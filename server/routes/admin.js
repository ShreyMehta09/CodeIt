const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/adminAuth");
const User = require("../models/User");
const Sheet = require("../models/Sheet");
const Problem = require("../models/Problem");
const multer = require("multer");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const fs = require("fs");
const os = require("os");

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Get admin stats
router.get("/stats", requireAdmin, async (req, res) => {
	try {
		const [
			totalUsers,
			globalSheets,
			globalProblems,
			pendingApprovals,
			pendingProblemApprovals,
		] = await Promise.all([
			User.countDocuments({}),
			Sheet.countDocuments({ isGlobal: true }),
			Problem.countDocuments({ isGlobal: true }),
			Sheet.countDocuments({ approvalStatus: "pending" }),
			Problem.countDocuments({ approvalStatus: "pending" }),
		]);

		res.json({
			totalUsers,
			globalSheets,
			globalProblems,
			pendingApprovals,
			pendingProblemApprovals,
		});
	} catch (error) {
		console.error("Error fetching admin stats:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Get all global sheets
router.get("/sheets", requireAdmin, async (req, res) => {
	try {
		const sheets = await Sheet.find({ isGlobal: true })
			.populate("userId", "name username")
			.sort({ createdAt: -1 });

		res.json(sheets);
	} catch (error) {
		console.error("Error fetching global sheets:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Get pending sheet approvals
router.get("/sheets/pending-approvals", requireAdmin, async (req, res) => {
	try {
		const pendingSheets = await Sheet.find({ approvalStatus: "pending" })
			.populate("userId", "name username email")
			.sort({ approvalRequestedAt: -1 });

		res.json({
			sheets: pendingSheets,
			total: pendingSheets.length,
		});
	} catch (error) {
		console.error("Error fetching pending approvals:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Approve sheet
router.post("/sheets/:id/approve", requireAdmin, async (req, res) => {
	try {
		const sheet = await Sheet.findById(req.params.id);

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		if (sheet.approvalStatus !== "pending") {
			return res.status(400).json({ message: "Sheet is not pending approval" });
		}

		sheet.approvalStatus = "approved";
		sheet.approvedBy = req.user._id;
		sheet.approvedAt = new Date();
		sheet.isGlobal = true;
		sheet.isPublic = true;

		await sheet.save();

		res.json({
			message: "Sheet approved and made global successfully",
			sheet,
		});
	} catch (error) {
		console.error("Error approving sheet:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Reject sheet
router.post("/sheets/:id/reject", requireAdmin, async (req, res) => {
	try {
		const { reason } = req.body;

		if (!reason) {
			return res.status(400).json({ message: "Rejection reason is required" });
		}

		const sheet = await Sheet.findById(req.params.id);

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		if (sheet.approvalStatus !== "pending") {
			return res.status(400).json({ message: "Sheet is not pending approval" });
		}

		sheet.approvalStatus = "rejected";
		sheet.rejectionReason = reason;
		sheet.isPublic = false;
		sheet.isGlobal = false;

		await sheet.save();

		res.json({
			message: "Sheet approval rejected",
			sheet,
		});
	} catch (error) {
		console.error("Error rejecting sheet:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Create global sheet
router.post("/sheets", requireAdmin, async (req, res) => {
	try {
		const { name, description, category } = req.body;

		const sheet = new Sheet({
			name,
			description,
			category,
			userId: req.user._id,
			isPublic: true,
			isGlobal: true,
			createdByAdmin: true,
			problems: [],
		});

		await sheet.save();
		await sheet.populate("userId", "name username");

		res.status(201).json(sheet);
	} catch (error) {
		console.error("Error creating global sheet:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Delete global sheet
router.delete("/sheets/:id", requireAdmin, async (req, res) => {
	try {
		const sheet = await Sheet.findById(req.params.id);

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		if (!sheet.isGlobal) {
			return res
				.status(403)
				.json({ message: "Cannot delete non-global sheet" });
		}

		await Sheet.findByIdAndDelete(req.params.id);

		res.json({ message: "Sheet deleted successfully" });
	} catch (error) {
		console.error("Error deleting global sheet:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Get all global problems
router.get("/problems", requireAdmin, async (req, res) => {
	try {
		const problems = await Problem.find({ isGlobal: true })
			.populate("userId", "name username")
			.sort({ createdAt: -1 });

		res.json(problems);
	} catch (error) {
		console.error("Error fetching global problems:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Create global problem
router.post("/problems", requireAdmin, async (req, res) => {
	try {
		const { title, platform, problemId, url, difficulty, tags } = req.body;

		const problem = new Problem({
			title,
			platform,
			problemId,
			url,
			difficulty,
			tags: tags || [],
			userId: req.user._id,
			isGlobal: true,
			createdByAdmin: true,
			status: "todo",
		});

		await problem.save();
		await problem.populate("userId", "name username");

		res.status(201).json(problem);
	} catch (error) {
		console.error("Error creating global problem:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Delete global problem
router.delete("/problems/:id", requireAdmin, async (req, res) => {
	try {
		const problem = await Problem.findById(req.params.id);

		if (!problem) {
			return res.status(404).json({ message: "Problem not found" });
		}

		if (!problem.isGlobal) {
			return res
				.status(403)
				.json({ message: "Cannot delete non-global problem" });
		}

		// Remove problem from all sheets
		await Sheet.updateMany(
			{ "problems.problemId": req.params.id },
			{ $pull: { problems: { problemId: req.params.id } } }
		);

		await Problem.findByIdAndDelete(req.params.id);

		res.json({ message: "Problem deleted successfully" });
	} catch (error) {
		console.error("Error deleting global problem:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Get sheet details for editing
router.get("/sheets/:id", requireAdmin, async (req, res) => {
	try {
		const sheet = await Sheet.findById(req.params.id)
			.populate("problems.problemId")
			.populate("userId", "name username");

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		if (!sheet.isGlobal) {
			return res
				.status(403)
				.json({ message: "Access denied to non-global sheet" });
		}

		res.json(sheet);
	} catch (error) {
		console.error("Error fetching sheet details:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Add problem to global sheet
router.post("/sheets/:id/problems", requireAdmin, async (req, res) => {
	try {
		const { problemId } = req.body;
		const sheet = await Sheet.findById(req.params.id);

		if (!sheet) {
			return res.status(404).json({ message: "Sheet not found" });
		}

		if (!sheet.isGlobal) {
			return res
				.status(403)
				.json({ message: "Cannot modify non-global sheet" });
		}

		const problem = await Problem.findById(problemId);
		if (!problem) {
			return res.status(404).json({ message: "Problem not found" });
		}

		// Check if problem already exists in sheet
		const existingProblem = sheet.problems.find(
			(p) => p.problemId.toString() === problemId
		);
		if (existingProblem) {
			return res
				.status(400)
				.json({ message: "Problem already exists in sheet" });
		}

		sheet.problems.push({
			problemId: problemId,
			addedAt: new Date(),
			order: sheet.problems.length,
		});

		await sheet.save();
		await sheet.populate("problems.problemId");

		res.json(sheet);
	} catch (error) {
		console.error("Error adding problem to sheet:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Remove problem from global sheet
router.delete(
	"/sheets/:id/problems/:problemId",
	requireAdmin,
	async (req, res) => {
		try {
			const sheet = await Sheet.findById(req.params.id);

			if (!sheet) {
				return res.status(404).json({ message: "Sheet not found" });
			}

			if (!sheet.isGlobal) {
				return res
					.status(403)
					.json({ message: "Cannot modify non-global sheet" });
			}

			sheet.problems = sheet.problems.filter(
				(p) => p.problemId.toString() !== req.params.problemId
			);
			await sheet.save();

			res.json({ message: "Problem removed from sheet successfully" });
		} catch (error) {
			console.error("Error removing problem from sheet:", error);
			res.status(500).json({ message: "Server error" });
		}
	}
);

// Get pending problem approvals
router.get("/problems/pending-approvals", requireAdmin, async (req, res) => {
	try {
		const pendingProblems = await Problem.find({ approvalStatus: "pending" })
			.populate("userId", "name username email")
			.sort({ approvalRequestedAt: -1 });

		res.json({
			problems: pendingProblems,
			total: pendingProblems.length,
		});
	} catch (error) {
		console.error("Error fetching pending problem approvals:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Approve problem
router.post("/problems/:id/approve", requireAdmin, async (req, res) => {
	try {
		const problem = await Problem.findById(req.params.id);

		if (!problem) {
			return res.status(404).json({ message: "Problem not found" });
		}

		if (problem.approvalStatus !== "pending") {
			return res
				.status(400)
				.json({ message: "Problem is not pending approval" });
		}

		problem.approvalStatus = "approved";
		problem.approvedBy = req.user._id;
		problem.approvedAt = new Date();
		problem.isGlobal = true;

		await problem.save();

		res.json({
			message: "Problem approved and made global successfully",
			problem,
		});
	} catch (error) {
		console.error("Error approving problem:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Reject problem
router.post("/problems/:id/reject", requireAdmin, async (req, res) => {
	try {
		const { reason } = req.body;

		if (!reason) {
			return res.status(400).json({ message: "Rejection reason is required" });
		}

		const problem = await Problem.findById(req.params.id);

		if (!problem) {
			return res.status(404).json({ message: "Problem not found" });
		}

		if (problem.approvalStatus !== "pending") {
			return res
				.status(400)
				.json({ message: "Problem is not pending approval" });
		}

		problem.approvalStatus = "rejected";
		problem.rejectionReason = reason;
		problem.isGlobal = false;

		await problem.save();

		res.json({
			message: "Problem approval rejected",
			problem,
		});
	} catch (error) {
		console.error("Error rejecting problem:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// ===== USER MANAGEMENT ROUTES =====

// Get all users with stats
router.get("/users", requireAdmin, async (req, res) => {
	try {
		const {
			page = 1,
			limit = 20,
			search = "",
			status = "all",
			sortBy = "createdAt",
		} = req.query;

		const query = {};

		// Add search filter
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
				{ username: { $regex: search, $options: "i" } },
			];
		}

		// Add status filter
		if (status !== "all") {
			if (status === "banned") {
				query.isBanned = true;
			} else if (status === "active") {
				query.isBanned = { $ne: true };
			}
		}

		const sortOptions = {
			createdAt: { createdAt: -1 },
			name: { name: 1 },
			solved: { "stats.totalSolved": -1 },
			streak: { "stats.currentStreak": -1 },
		};

		const users = await User.find(query)
			.select("-password")
			.sort(sortOptions[sortBy] || { createdAt: -1 })
			.limit(parseInt(limit))
			.skip((parseInt(page) - 1) * parseInt(limit));

		const total = await User.countDocuments(query);

		// Get additional stats for each user
		const usersWithStats = await Promise.all(
			users.map(async (user) => {
				const [problemCount, sheetCount] = await Promise.all([
					Problem.countDocuments({ userId: user._id }),
					Sheet.countDocuments({ userId: user._id }),
				]);

				return {
					...user.toObject(),
					problemCount,
					sheetCount,
				};
			})
		);

		res.json({
			users: usersWithStats,
			total,
			page: parseInt(page),
			totalPages: Math.ceil(total / parseInt(limit)),
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Get user activity logs
router.get("/users/:id/activity", requireAdmin, async (req, res) => {
	try {
		const userId = req.params.id;

		// Get recent problems solved
		const recentProblems = await Problem.find({
			userId,
			status: "solved",
			solvedAt: { $exists: true },
		})
			.sort({ solvedAt: -1 })
			.limit(20)
			.select("title platform difficulty solvedAt");

		// Get user's sheets
		const sheets = await Sheet.find({ userId })
			.sort({ createdAt: -1 })
			.limit(10)
			.select("name category createdAt isGlobal");

		// Get login history (we'll need to add this to User model in future)
		const user = await User.findById(userId).select("createdAt lastLoginAt");

		res.json({
			recentProblems,
			sheets,
			user,
			activitySummary: {
				totalProblemsSolved: recentProblems.length,
				totalSheets: sheets.length,
				accountAge: Math.floor(
					(Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
				),
			},
		});
	} catch (error) {
		console.error("Error fetching user activity:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Ban/Unban user
router.post("/users/:id/ban", requireAdmin, async (req, res) => {
	try {
		const { reason, duration } = req.body; // duration in days, 0 for permanent
		const user = await User.findById(req.params.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (user.username === "admin") {
			return res.status(403).json({ message: "Cannot ban admin user" });
		}

		user.isBanned = true;
		user.banReason = reason;
		user.bannedAt = new Date();
		user.bannedBy = req.user._id;

		if (duration > 0) {
			user.banExpiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
		}

		await user.save();

		res.json({
			message: "User banned successfully",
			user: user.toObject(),
		});
	} catch (error) {
		console.error("Error banning user:", error);
		res.status(500).json({ message: "Server error" });
	}
});

router.post("/users/:id/unban", requireAdmin, async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		user.isBanned = false;
		user.banReason = undefined;
		user.bannedAt = undefined;
		user.bannedBy = undefined;
		user.banExpiresAt = undefined;

		await user.save();

		res.json({
			message: "User unbanned successfully",
			user: user.toObject(),
		});
	} catch (error) {
		console.error("Error unbanning user:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Warn user
router.post("/users/:id/warn", requireAdmin, async (req, res) => {
	try {
		const { message } = req.body;
		const user = await User.findById(req.params.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (!user.warnings) {
			user.warnings = [];
		}

		user.warnings.push({
			message,
			issuedBy: req.user._id,
			issuedAt: new Date(),
		});

		await user.save();

		res.json({
			message: "Warning issued successfully",
			user: user.toObject(),
		});
	} catch (error) {
		console.error("Error warning user:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// ===== BULK OPERATIONS ROUTES =====

// Bulk import problems from CSV/Excel
router.post(
	"/problems/bulk-import",
	requireAdmin,
	upload.single("file"),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({ message: "No file uploaded" });
			}

			const filePath = req.file.path;
			const problems = [];
			let errors = [];

			// Determine file type and parse accordingly
			if (req.file.originalname.endsWith(".csv")) {
				// Parse CSV
				await new Promise((resolve, reject) => {
					fs.createReadStream(filePath)
						.pipe(csv())
						.on("data", (row) => {
							try {
								problems.push({
									title: row.title || row.Title,
									platform: (row.platform || row.Platform || "").toLowerCase(),
									problemId: row.problemId || row.ProblemId || row.id,
									url: row.url || row.URL,
									difficulty: (
										row.difficulty ||
										row.Difficulty ||
										"medium"
									).toLowerCase(),
									tags: (row.tags || row.Tags || "")
										.split(",")
										.map((t) => t.trim())
										.filter(Boolean),
									userId: req.user._id,
									isGlobal: true,
									createdByAdmin: true,
									status: "todo",
								});
							} catch (err) {
								errors.push(`Row error: ${err.message}`);
							}
						})
						.on("end", resolve)
						.on("error", reject);
				});
			} else if (
				req.file.originalname.endsWith(".xlsx") ||
				req.file.originalname.endsWith(".xls")
			) {
				// Parse Excel
				const workbook = XLSX.readFile(filePath);
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const data = XLSX.utils.sheet_to_json(worksheet);

				data.forEach((row) => {
					try {
						problems.push({
							title: row.title || row.Title,
							platform: (row.platform || row.Platform || "").toLowerCase(),
							problemId: row.problemId || row.ProblemId || row.id,
							url: row.url || row.URL,
							difficulty: (
								row.difficulty ||
								row.Difficulty ||
								"medium"
							).toLowerCase(),
							tags: (row.tags || row.Tags || "")
								.split(",")
								.map((t) => t.trim())
								.filter(Boolean),
							userId: req.user._id,
							isGlobal: true,
							createdByAdmin: true,
							status: "todo",
						});
					} catch (err) {
						errors.push(`Row error: ${err.message}`);
					}
				});
			} else {
				fs.unlinkSync(filePath);
				return res
					.status(400)
					.json({ message: "Unsupported file format. Use CSV or Excel." });
			}

			// Insert problems in bulk
			const insertedProblems = await Problem.insertMany(problems, {
				ordered: false,
			});

			// Clean up uploaded file
			fs.unlinkSync(filePath);

			res.json({
				message: "Problems imported successfully",
				imported: insertedProblems.length,
				errors: errors.length > 0 ? errors : undefined,
			});
		} catch (error) {
			// Clean up file on error
			if (req.file && fs.existsSync(req.file.path)) {
				fs.unlinkSync(req.file.path);
			}
			console.error("Error importing problems:", error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	}
);

// Bulk approve sheets
router.post("/sheets/bulk-approve", requireAdmin, async (req, res) => {
	try {
		const { sheetIds } = req.body;

		if (!Array.isArray(sheetIds) || sheetIds.length === 0) {
			return res.status(400).json({ message: "Sheet IDs array is required" });
		}

		const result = await Sheet.updateMany(
			{
				_id: { $in: sheetIds },
				approvalStatus: "pending",
			},
			{
				$set: {
					approvalStatus: "approved",
					approvedBy: req.user._id,
					approvedAt: new Date(),
					isGlobal: true,
					isPublic: true,
				},
			}
		);

		res.json({
			message: "Sheets approved successfully",
			approved: result.modifiedCount,
		});
	} catch (error) {
		console.error("Error bulk approving sheets:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Bulk reject sheets
router.post("/sheets/bulk-reject", requireAdmin, async (req, res) => {
	try {
		const { sheetIds, reason } = req.body;

		if (!Array.isArray(sheetIds) || sheetIds.length === 0) {
			return res.status(400).json({ message: "Sheet IDs array is required" });
		}

		if (!reason) {
			return res.status(400).json({ message: "Rejection reason is required" });
		}

		const result = await Sheet.updateMany(
			{
				_id: { $in: sheetIds },
				approvalStatus: "pending",
			},
			{
				$set: {
					approvalStatus: "rejected",
					rejectionReason: reason,
					isGlobal: false,
					isPublic: false,
				},
			}
		);

		res.json({
			message: "Sheets rejected successfully",
			rejected: result.modifiedCount,
		});
	} catch (error) {
		console.error("Error bulk rejecting sheets:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// ===== ANALYTICS ROUTES =====

// Get DAU/MAU analytics
router.get("/analytics/users", requireAdmin, async (req, res) => {
	try {
		const now = new Date();
		const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
		const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
		const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

		// Note: This requires lastLoginAt field in User model
		// For now, we'll use updatedAt as a proxy
		const [
			dau,
			wau,
			mau,
			newUsersToday,
			newUsersWeek,
			newUsersMonth,
			totalUsers,
			bannedUsers,
		] = await Promise.all([
			User.countDocuments({ updatedAt: { $gte: oneDayAgo } }),
			User.countDocuments({ updatedAt: { $gte: oneWeekAgo } }),
			User.countDocuments({ updatedAt: { $gte: oneMonthAgo } }),
			User.countDocuments({ createdAt: { $gte: oneDayAgo } }),
			User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
			User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
			User.countDocuments({}),
			User.countDocuments({ isBanned: true }),
		]);

		// Get user growth data for last 30 days
		const userGrowth = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date(now - i * 24 * 60 * 60 * 1000);
			const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

			const count = await User.countDocuments({
				createdAt: { $gte: date, $lt: nextDate },
			});

			userGrowth.push({
				date: date.toISOString().split("T")[0],
				count,
			});
		}

		res.json({
			dau,
			wau,
			mau,
			newUsersToday,
			newUsersWeek,
			newUsersMonth,
			totalUsers,
			bannedUsers,
			activeUsersPercent:
				totalUsers > 0 ? ((dau / totalUsers) * 100).toFixed(2) : 0,
			userGrowth,
		});
	} catch (error) {
		console.error("Error fetching user analytics:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Get popular problems and sheets
router.get("/analytics/content", requireAdmin, async (req, res) => {
	try {
		// Get most solved problems (global)
		const popularProblems = await Problem.aggregate([
			{ $match: { isGlobal: true } },
			{
				$lookup: {
					from: "users",
					let: { problemId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ["$$problemId", { $ifNull: ["$solvedProblems", []] }],
								},
							},
						},
					],
					as: "solvers",
				},
			},
			{
				$project: {
					title: 1,
					platform: 1,
					difficulty: 1,
					solveCount: { $size: "$solvers" },
				},
			},
			{ $sort: { solveCount: -1 } },
			{ $limit: 10 },
		]);

		// Get most popular sheets
		const popularSheets = await Sheet.aggregate([
			{ $match: { isGlobal: true } },
			{
				$lookup: {
					from: "users",
					let: { sheetId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ["$$sheetId", { $ifNull: ["$sheets", []] }],
								},
							},
						},
					],
					as: "users",
				},
			},
			{
				$project: {
					name: 1,
					category: 1,
					problemCount: { $size: "$problems" },
					userCount: { $size: "$users" },
				},
			},
			{ $sort: { userCount: -1 } },
			{ $limit: 10 },
		]);

		// Problem statistics
		const [
			totalProblems,
			solvedProblems,
			easyProblems,
			mediumProblems,
			hardProblems,
		] = await Promise.all([
			Problem.countDocuments({ isGlobal: true }),
			Problem.countDocuments({ isGlobal: true, status: "solved" }),
			Problem.countDocuments({ isGlobal: true, difficulty: "easy" }),
			Problem.countDocuments({ isGlobal: true, difficulty: "medium" }),
			Problem.countDocuments({ isGlobal: true, difficulty: "hard" }),
		]);

		res.json({
			popularProblems,
			popularSheets,
			statistics: {
				totalProblems,
				solvedProblems,
				difficultyBreakdown: {
					easy: easyProblems,
					medium: mediumProblems,
					hard: hardProblems,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching content analytics:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Get server health metrics
router.get("/analytics/health", requireAdmin, async (req, res) => {
	try {
		const dbStats = await Promise.all([
			User.estimatedDocumentCount(),
			Sheet.estimatedDocumentCount(),
			Problem.estimatedDocumentCount(),
		]);

		const memoryUsage = process.memoryUsage();
		const cpuUsage = process.cpuUsage();

		res.json({
			server: {
				uptime: process.uptime(),
				nodeVersion: process.version,
				platform: process.platform,
				memory: {
					total: os.totalmem(),
					free: os.freemem(),
					used: os.totalmem() - os.freemem(),
					processHeap: memoryUsage.heapUsed,
					processTotal: memoryUsage.rss,
				},
				cpu: {
					user: cpuUsage.user,
					system: cpuUsage.system,
				},
			},
			database: {
				users: dbStats[0],
				sheets: dbStats[1],
				problems: dbStats[2],
				status: "connected",
			},
			timestamp: new Date(),
		});
	} catch (error) {
		console.error("Error fetching server health:", error);
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
