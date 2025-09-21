const express = require('express');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Sheet = require('../models/Sheet');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard data for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with stats
    const user = await User.findById(userId).select('-password');

    // Get problem statistics
    const problemStats = await Problem.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          solvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] }
          },
          attemptedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'attempted'] }, 1, 0] }
          },
          todoCount: {
            $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
          },
          reviewCount: {
            $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get difficulty-wise solved count
    const difficultyStats = await Problem.aggregate([
      { $match: { userId: userId, status: 'solved' } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get platform-wise solved count
    const platformStats = await Problem.aggregate([
      { $match: { userId: userId, status: 'solved' } },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tag-wise solved count (top 10)
    const tagStats = await Problem.aggregate([
      { $match: { userId: userId, status: 'solved' } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity (last 10 solved problems)
    const recentActivity = await Problem.find({
      userId: userId,
      status: 'solved'
    })
    .sort({ solvedAt: -1 })
    .limit(10)
    .select('title platform difficulty solvedAt url tags');

    // Get solving streak data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const streakData = await Problem.aggregate([
      {
        $match: {
          userId: userId,
          status: 'solved',
          solvedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$solvedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get user's sheets summary
    const sheetsSummary = await Sheet.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSheets: { $sum: 1 },
          publicSheets: {
            $sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] }
          },
          totalProblemsInSheets: { $sum: '$totalProblems' },
          totalSolvedInSheets: { $sum: '$solvedProblems' }
        }
      }
    ]);

    // Get recent sheets
    const recentSheets = await Sheet.find({ userId: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name category totalProblems solvedProblems updatedAt');

    // Calculate progress metrics
    const stats = problemStats[0] || {
      totalProblems: 0,
      solvedCount: 0,
      attemptedCount: 0,
      todoCount: 0,
      reviewCount: 0
    };

    const difficultyMap = {
      easy: 0,
      medium: 0,
      hard: 0
    };
    difficultyStats.forEach(stat => {
      if (difficultyMap.hasOwnProperty(stat._id)) {
        difficultyMap[stat._id] = stat.count;
      }
    });

    const platformMap = {};
    platformStats.forEach(stat => {
      platformMap[stat._id] = stat.count;
    });

    // Calculate weekly progress
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await Problem.countDocuments({
      userId: userId,
      status: 'solved',
      solvedAt: { $gte: oneWeekAgo }
    });

    // Get upcoming contests (mock data - in real app, fetch from APIs)
    const upcomingContests = [
      {
        name: 'Codeforces Round #XXX',
        platform: 'codeforces',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        duration: 7200 // 2 hours in seconds
      },
      {
        name: 'LeetCode Weekly Contest XXX',
        platform: 'leetcode',
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        duration: 5400 // 1.5 hours in seconds
      }
    ];

    res.json({
      user: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        stats: user.stats
      },
      stats: {
        ...stats,
        weeklyProgress,
        difficultyBreakdown: difficultyMap,
        platformBreakdown: platformMap,
        topTags: tagStats
      },
      recentActivity,
      streakData,
      sheets: {
        summary: sheetsSummary[0] || {
          totalSheets: 0,
          publicSheets: 0,
          totalProblemsInSheets: 0,
          totalSolvedInSheets: 0
        },
        recent: recentSheets
      },
      upcomingContests
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get detailed analytics for user
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Daily solving pattern
    const dailyPattern = await Problem.aggregate([
      {
        $match: {
          userId: userId,
          status: 'solved',
          solvedAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$solvedAt'
            }
          },
          count: { $sum: 1 },
          difficulties: {
            $push: '$difficulty'
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Hourly pattern (what time of day user solves most problems)
    const hourlyPattern = await Problem.aggregate([
      {
        $match: {
          userId: userId,
          status: 'solved',
          solvedAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: {
            $hour: '$solvedAt'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Problem difficulty progression over time
    const difficultyProgression = await Problem.aggregate([
      {
        $match: {
          userId: userId,
          status: 'solved',
          solvedAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$solvedAt'
              }
            },
            difficulty: '$difficulty'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Average time between attempts and solutions (mock data)
    const performanceMetrics = {
      averageAttemptsPerProblem: 2.3,
      averageTimeToSolve: '45 minutes',
      successRate: 78.5,
      improvementTrend: 'increasing'
    };

    res.json({
      period: parseInt(period),
      dailyPattern,
      hourlyPattern,
      difficultyProgression,
      performanceMetrics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/goals
// @desc    Get user goals and progress
// @access  Private
router.get('/goals', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Mock goals - in real app, these would be stored in database
    const goals = [
      {
        id: 1,
        title: 'Solve 100 problems this month',
        type: 'monthly',
        target: 100,
        current: user.stats.totalSolved % 100,
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        status: 'active'
      },
      {
        id: 2,
        title: 'Maintain 7-day streak',
        type: 'streak',
        target: 7,
        current: user.stats.currentStreak,
        status: user.stats.currentStreak >= 7 ? 'completed' : 'active'
      },
      {
        id: 3,
        title: 'Complete Striver A2Z Sheet',
        type: 'sheet',
        target: 450,
        current: 120, // This would come from actual sheet progress
        status: 'active'
      }
    ];

    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recommendations
// @desc    Get problem recommendations for user
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's solved problems to understand patterns
    const solvedProblems = await Problem.find({
      userId: userId,
      status: 'solved'
    }).select('tags difficulty platform');

    // Get user's weak areas (tags with fewer solved problems)
    const tagCounts = {};
    solvedProblems.forEach(problem => {
      problem.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const weakTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 5)
      .map(([tag]) => tag);

    // Mock recommendations based on weak areas
    const recommendations = [
      {
        type: 'weak_area',
        title: 'Practice Dynamic Programming',
        description: 'You have solved fewer DP problems. Try these curated problems.',
        problems: [
          {
            title: 'Climbing Stairs',
            platform: 'leetcode',
            difficulty: 'easy',
            url: 'https://leetcode.com/problems/climbing-stairs/',
            tags: ['dynamic-programming']
          },
          {
            title: 'House Robber',
            platform: 'leetcode',
            difficulty: 'medium',
            url: 'https://leetcode.com/problems/house-robber/',
            tags: ['dynamic-programming']
          }
        ]
      },
      {
        type: 'difficulty_progression',
        title: 'Ready for Hard Problems?',
        description: 'Based on your medium problem success rate, try these hard problems.',
        problems: [
          {
            title: 'Median of Two Sorted Arrays',
            platform: 'leetcode',
            difficulty: 'hard',
            url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
            tags: ['array', 'binary-search']
          }
        ]
      },
      {
        type: 'trending',
        title: 'Trending Problems',
        description: 'Popular problems being solved by the community.',
        problems: [
          {
            title: 'Two Sum',
            platform: 'leetcode',
            difficulty: 'easy',
            url: 'https://leetcode.com/problems/two-sum/',
            tags: ['array', 'hash-table']
          }
        ]
      }
    ];

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;