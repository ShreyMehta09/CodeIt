const express = require('express');
const { body, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/problems
// @desc    Get user's problems with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      difficulty,
      platform,
      tags,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { userId: req.user.id };
    
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;
    if (platform) filter.platform = platform;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.$or = [
        { tags: { $in: tagArray } },
        { customTags: { $in: tagArray } }
      ];
    }
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const problems = await Problem.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Problem.countDocuments(filter);

    res.json({
      problems,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/problems
// @desc    Add a new problem
// @access  Private
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('platform').isIn(['leetcode', 'codeforces', 'codechef', 'atcoder', 'custom']).withMessage('Invalid platform'),
  body('problemId').trim().notEmpty().withMessage('Problem ID is required'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('difficulty').notEmpty().withMessage('Difficulty is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      platform,
      problemId,
      url,
      difficulty,
      tags = [],
      customTags = [],
      notes,
      priority = 'medium'
    } = req.body;

    // Check if problem already exists for this user
    const existingProblem = await Problem.findOne({
      userId: req.user.id,
      platform,
      problemId
    });

    if (existingProblem) {
      return res.status(400).json({ message: 'Problem already exists in your list' });
    }

    const problem = new Problem({
      title,
      platform,
      problemId,
      url,
      difficulty,
      tags: tags.map(tag => tag.toLowerCase()),
      customTags: customTags.map(tag => tag.toLowerCase()),
      notes,
      priority,
      userId: req.user.id
    });

    await problem.save();

    res.status(201).json({
      message: 'Problem added successfully',
      problem
    });
  } catch (error) {
    console.error('Add problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/problems/:id
// @desc    Update a problem
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      notes,
      solution,
      timeComplexity,
      spaceComplexity,
      customTags,
      priority
    } = req.body;

    const problem = await Problem.findOne({ _id: id, userId: req.user.id });
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update fields
    if (status) problem.status = status;
    if (notes !== undefined) problem.notes = notes;
    if (solution !== undefined) problem.solution = solution;
    if (timeComplexity !== undefined) problem.timeComplexity = timeComplexity;
    if (spaceComplexity !== undefined) problem.spaceComplexity = spaceComplexity;
    if (customTags) problem.customTags = customTags.map(tag => tag.toLowerCase());
    if (priority) problem.priority = priority;

    // Update attempt tracking
    if (status === 'attempted') {
      problem.attempts += 1;
      problem.lastAttemptAt = new Date();
    }

    await problem.save();

    // Update user stats if problem was solved
    if (status === 'solved' && problem.status !== 'solved') {
      await updateUserStats(req.user.id);
    }

    res.json({
      message: 'Problem updated successfully',
      problem
    });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/problems/:id
// @desc    Delete a problem
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const problem = await Problem.findOneAndDelete({ _id: id, userId: req.user.id });
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/problems/stats
// @desc    Get user's problem statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Problem.getUserStats(req.user.id);
    
    // Get platform-wise stats
    const platformStats = await Problem.aggregate([
      { $match: { userId: req.user.id, status: 'solved' } },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tag-wise stats
    const tagStats = await Problem.aggregate([
      { $match: { userId: req.user.id, status: 'solved' } },
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

    // Get recent activity
    const recentActivity = await Problem.find({
      userId: req.user.id,
      status: 'solved'
    })
    .sort({ solvedAt: -1 })
    .limit(5)
    .select('title platform difficulty solvedAt');

    res.json({
      ...stats,
      platformStats,
      tagStats,
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/problems/bulk-import
// @desc    Bulk import problems from a platform
// @access  Private
router.post('/bulk-import', auth, async (req, res) => {
  try {
    const { problems } = req.body;
    
    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ message: 'Problems array is required' });
    }

    const importedProblems = [];
    const skippedProblems = [];

    for (const problemData of problems) {
      try {
        // Check if problem already exists
        const existing = await Problem.findOne({
          userId: req.user.id,
          platform: problemData.platform,
          problemId: problemData.problemId
        });

        if (existing) {
          skippedProblems.push(problemData.title);
          continue;
        }

        const problem = new Problem({
          ...problemData,
          userId: req.user.id,
          tags: problemData.tags?.map(tag => tag.toLowerCase()) || [],
          customTags: problemData.customTags?.map(tag => tag.toLowerCase()) || []
        });

        await problem.save();
        importedProblems.push(problem);
      } catch (error) {
        console.error('Error importing problem:', problemData.title, error);
        skippedProblems.push(problemData.title);
      }
    }

    res.json({
      message: `Import completed. ${importedProblems.length} problems imported, ${skippedProblems.length} skipped.`,
      imported: importedProblems.length,
      skipped: skippedProblems.length,
      skippedProblems
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
});

// Helper function to update user stats
async function updateUserStats(userId) {
  try {
    const stats = await Problem.getUserStats(userId);
    
    // Calculate streak
    const solvedProblems = await Problem.find({
      userId,
      status: 'solved',
      solvedAt: { $exists: true }
    }).sort({ solvedAt: -1 });

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (const problem of solvedProblems) {
      const solvedDate = new Date(problem.solvedAt).toDateString();
      
      if (!lastDate) {
        tempStreak = 1;
        lastDate = solvedDate;
      } else {
        const daysDiff = Math.floor((new Date(lastDate) - new Date(solvedDate)) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
        } else if (daysDiff === 0) {
          // Same day, continue streak
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
        
        lastDate = solvedDate;
      }
    }

    maxStreak = Math.max(maxStreak, tempStreak);
    
    // Current streak is from most recent solving date
    if (solvedProblems.length > 0) {
      const today = new Date().toDateString();
      const lastSolvedDate = new Date(solvedProblems[0].solvedAt).toDateString();
      const daysSinceLastSolved = Math.floor((new Date(today) - new Date(lastSolvedDate)) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastSolved <= 1) {
        currentStreak = tempStreak;
      }
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.totalSolved': stats.solvedCount,
        'stats.currentStreak': currentStreak,
        'stats.maxStreak': maxStreak,
        'stats.lastSolvedDate': solvedProblems[0]?.solvedAt,
        'stats.solvedByDifficulty.easy': stats.easyCount,
        'stats.solvedByDifficulty.medium': stats.mediumCount,
        'stats.solvedByDifficulty.hard': stats.hardCount
      }
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

module.exports = router;