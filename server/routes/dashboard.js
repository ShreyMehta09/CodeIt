const express = require("express");
const User = require("../models/User");
const Problem = require("../models/Problem");
const Sheet = require("../models/Sheet");
const auth = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard data for authenticated user
// @access  Private
router.get("/", auth, async (req, res) => {
	try {
		const userId = req.user.id;

		// Get user with stats
		const user = await User.findById(userId).select("-password");

		// Get all user's sheets to calculate progress
		const userSheets = await Sheet.find({
			userId: userId,
			isGlobal: false,
		});

		// Calculate problem statistics from sheets
		let totalProblems = 0;
		let solvedCount = 0;
		let attemptedCount = 0;
		let todoCount = 0;
		let reviewCount = 0;
		const difficultyMap = { easy: 0, medium: 0, hard: 0 };
		const platformMap = {};
		const tagMap = {};

		// Get all problems referenced in user's sheets
		const allProblemIds = [];
		const problemStatusMap = new Map();

		for (const sheet of userSheets) {
			for (const problem of sheet.problems) {
				const key = problem.problemId.toString();
				if (!problemStatusMap.has(key)) {
					allProblemIds.push(problem.problemId);
					problemStatusMap.set(key, problem.status || "todo");
				}
			}
		}

		// Also get standalone user-created problems (not in sheets)
		const standaloneProblems = await Problem.find({
			userId: userId,
			isGlobal: false,
		});

		// Add standalone problems to the tracking
		standaloneProblems.forEach((problem) => {
			const key = problem._id.toString();
			if (!problemStatusMap.has(key)) {
				allProblemIds.push(problem._id);
				problemStatusMap.set(key, problem.status || "todo");
			}
		});

		// Fetch all unique problems from sheets (if any)
		let problems = [];
		if (allProblemIds.length > 0) {
			problems = await Problem.find({
				_id: { $in: allProblemIds },
			});
		}

		// Merge with standalone problems to ensure we have all problems
		const allProblems = [...problems];
		standaloneProblems.forEach((sp) => {
			if (!allProblems.find((p) => p._id.toString() === sp._id.toString())) {
				allProblems.push(sp);
			}
		});

		// Calculate statistics
		allProblems.forEach((problem) => {
			const status = problemStatusMap.get(problem._id.toString());
			totalProblems++;

			if (status === "solved") {
				solvedCount++;
				// Count difficulty for solved problems
				if (difficultyMap.hasOwnProperty(problem.difficulty)) {
					difficultyMap[problem.difficulty]++;
				}
				// Count platform
				if (problem.platform) {
					platformMap[problem.platform] =
						(platformMap[problem.platform] || 0) + 1;
				}
				// Count tags
				if (problem.tags && problem.tags.length > 0) {
					problem.tags.forEach((tag) => {
						tagMap[tag] = (tagMap[tag] || 0) + 1;
					});
				}
			} else if (status === "attempted") {
				attemptedCount++;
			} else if (status === "review") {
				reviewCount++;
			} else {
				todoCount++;
			}
		});

		// Get top tags
		const topTags = Object.entries(tagMap)
			.map(([tag, count]) => ({ _id: tag, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Get recent activity (recently solved problems from sheets and standalone)
		const recentActivity = [];
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		// Add problems from sheets
		for (const sheet of userSheets) {
			for (const sheetProblem of sheet.problems) {
				if (sheetProblem.status === "solved") {
					const problem = allProblems.find(
						(p) => p._id.toString() === sheetProblem.problemId.toString()
					);
					if (problem) {
						recentActivity.push({
							title: problem.title,
							platform: problem.platform,
							difficulty: problem.difficulty,
							solvedAt: sheet.updatedAt, // Use sheet update time as approximation
							tags: problem.tags,
						});
					}
				}
			}
		}

		// Add standalone solved problems
		standaloneProblems.forEach((problem) => {
			if (problem.status === "solved" && problem.solvedAt) {
				recentActivity.push({
					title: problem.title,
					platform: problem.platform,
					difficulty: problem.difficulty,
					solvedAt: problem.solvedAt,
					tags: problem.tags,
				});
			}
		});

		// Sort by most recent and limit to 10
		recentActivity.sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt));
		const limitedActivity = recentActivity.slice(0, 10);

		// Calculate weekly progress
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		const weeklyProgress = recentActivity.filter(
			(activity) => new Date(activity.solvedAt) >= oneWeekAgo
		).length;

		// Get user's sheets summary
		const sheetsSummary = await Sheet.aggregate([
			{ $match: { userId: userId, isGlobal: false } },
			{
				$group: {
					_id: null,
					totalSheets: { $sum: 1 },
					publicSheets: {
						$sum: { $cond: [{ $eq: ["$isPublic", true] }, 1, 0] },
					},
					totalProblemsInSheets: { $sum: "$totalProblems" },
					totalSolvedInSheets: { $sum: "$solvedProblems" },
				},
			},
		]);

		// Get recent sheets
		const recentSheets = await Sheet.find({ userId: userId, isGlobal: false })
			.sort({ updatedAt: -1 })
			.limit(5)
			.select("name category totalProblems solvedProblems updatedAt");

		// Generate streak data for last 30 days
		const streakData = [];
		const today = new Date();
		for (let i = 29; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split("T")[0];

			const count = recentActivity.filter((activity) => {
				const activityDate = new Date(activity.solvedAt)
					.toISOString()
					.split("T")[0];
				return activityDate === dateStr;
			}).length;

			streakData.push({
				_id: dateStr,
				count,
			});
		}

		res.json({
			user: {
				name: user.name,
				username: user.username,
				avatar: user.avatar,
				stats: user.stats,
			},
			stats: {
				totalProblems,
				solvedCount,
				attemptedCount,
				todoCount,
				reviewCount,
				weeklyProgress,
				difficultyBreakdown: difficultyMap,
				platformBreakdown: platformMap,
				topTags,
			},
			recentActivity: limitedActivity,
			streakData,
			sheets: {
				summary: sheetsSummary[0] || {
					totalSheets: 0,
					publicSheets: 0,
					totalProblemsInSheets: 0,
					totalSolvedInSheets: 0,
				},
				recent: recentSheets,
			},
		});
	} catch (error) {
		console.error("Get dashboard error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/dashboard/analytics
// @desc    Get detailed analytics for user
// @access  Private
router.get("/analytics", auth, async (req, res) => {
	try {
		const userId = req.user.id;
		const { period = "30" } = req.query; // days

		const daysAgo = new Date();
		daysAgo.setDate(daysAgo.getDate() - parseInt(period));

		// Daily solving pattern
		const dailyPattern = await Problem.aggregate([
			{
				$match: {
					userId: userId,
					status: "solved",
					solvedAt: { $gte: daysAgo },
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$solvedAt",
						},
					},
					count: { $sum: 1 },
					difficulties: {
						$push: "$difficulty",
					},
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// Hourly pattern (what time of day user solves most problems)
		const hourlyPattern = await Problem.aggregate([
			{
				$match: {
					userId: userId,
					status: "solved",
					solvedAt: { $gte: daysAgo },
				},
			},
			{
				$group: {
					_id: {
						$hour: "$solvedAt",
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		// Problem difficulty progression over time
		const difficultyProgression = await Problem.aggregate([
			{
				$match: {
					userId: userId,
					status: "solved",
					solvedAt: { $gte: daysAgo },
				},
			},
			{
				$group: {
					_id: {
						date: {
							$dateToString: {
								format: "%Y-%m-%d",
								date: "$solvedAt",
							},
						},
						difficulty: "$difficulty",
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { "_id.date": 1 } },
		]);

		// Average time between attempts and solutions (mock data)
		const performanceMetrics = {
			averageAttemptsPerProblem: 2.3,
			averageTimeToSolve: "45 minutes",
			successRate: 78.5,
			improvementTrend: "increasing",
		};

		res.json({
			period: parseInt(period),
			dailyPattern,
			hourlyPattern,
			difficultyProgression,
			performanceMetrics,
		});
	} catch (error) {
		console.error("Get analytics error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/dashboard/goals
// @desc    Get user goals and progress
// @access  Private
router.get("/goals", auth, async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await User.findById(userId);

		// Mock goals - in real app, these would be stored in database
		const goals = [
			{
				id: 1,
				title: "Solve 100 problems this month",
				type: "monthly",
				target: 100,
				current: user.stats.totalSolved % 100,
				deadline: new Date(
					new Date().getFullYear(),
					new Date().getMonth() + 1,
					0
				),
				status: "active",
			},
			{
				id: 2,
				title: "Maintain 7-day streak",
				type: "streak",
				target: 7,
				current: user.stats.currentStreak,
				status: user.stats.currentStreak >= 7 ? "completed" : "active",
			},
			{
				id: 3,
				title: "Complete Striver A2Z Sheet",
				type: "sheet",
				target: 450,
				current: 120, // This would come from actual sheet progress
				status: "active",
			},
		];

		res.json(goals);
	} catch (error) {
		console.error("Get goals error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @route   GET /api/dashboard/recommendations
// @desc    Get problem recommendations for user
// @access  Private
router.get("/recommendations", auth, async (req, res) => {
	try {
		const userId = req.user.id;

		// Get user's solved problems to understand patterns
		const solvedProblems = await Problem.find({
			userId: userId,
			status: "solved",
		}).select("tags difficulty platform");

		// Get user's weak areas (tags with fewer solved problems)
		const tagCounts = {};
		solvedProblems.forEach((problem) => {
			problem.tags.forEach((tag) => {
				tagCounts[tag] = (tagCounts[tag] || 0) + 1;
			});
		});

		const weakTags = Object.entries(tagCounts)
			.sort(([, a], [, b]) => a - b)
			.slice(0, 5)
			.map(([tag]) => tag);

		// Mock recommendations based on weak areas
		const recommendations = [
			{
				type: "weak_area",
				title: "Practice Dynamic Programming",
				description:
					"You have solved fewer DP problems. Try these curated problems.",
				problems: [
					{
						title: "Climbing Stairs",
						platform: "leetcode",
						difficulty: "easy",
						url: "https://leetcode.com/problems/climbing-stairs/",
						tags: ["dynamic-programming"],
					},
					{
						title: "House Robber",
						platform: "leetcode",
						difficulty: "medium",
						url: "https://leetcode.com/problems/house-robber/",
						tags: ["dynamic-programming"],
					},
				],
			},
			{
				type: "difficulty_progression",
				title: "Ready for Hard Problems?",
				description:
					"Based on your medium problem success rate, try these hard problems.",
				problems: [
					{
						title: "Median of Two Sorted Arrays",
						platform: "leetcode",
						difficulty: "hard",
						url: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
						tags: ["array", "binary-search"],
					},
				],
			},
			{
				type: "trending",
				title: "Trending Problems",
				description: "Popular problems being solved by the community.",
				problems: [
					{
						title: "Two Sum",
						platform: "leetcode",
						difficulty: "easy",
						url: "https://leetcode.com/problems/two-sum/",
						tags: ["array", "hash-table"],
					},
				],
			},
		];

		res.json(recommendations);
	} catch (error) {
		console.error("Get recommendations error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
