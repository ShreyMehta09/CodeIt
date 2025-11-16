const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const User = require('../models/User');
const Sheet = require('../models/Sheet');
const Problem = require('../models/Problem');

// Get admin stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, globalSheets, globalProblems] = await Promise.all([
      User.countDocuments({}),
      Sheet.countDocuments({ isGlobal: true }),
      Problem.countDocuments({ isGlobal: true })
    ]);

    res.json({
      totalUsers,
      globalSheets,
      globalProblems
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all global sheets
router.get('/sheets', requireAdmin, async (req, res) => {
  try {
    const sheets = await Sheet.find({ isGlobal: true })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 });

    res.json(sheets);
  } catch (error) {
    console.error('Error fetching global sheets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create global sheet
router.post('/sheets', requireAdmin, async (req, res) => {
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
      problems: []
    });

    await sheet.save();
    await sheet.populate('userId', 'name username');

    res.status(201).json(sheet);
  } catch (error) {
    console.error('Error creating global sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete global sheet
router.delete('/sheets/:id', requireAdmin, async (req, res) => {
  try {
    const sheet = await Sheet.findById(req.params.id);

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    if (!sheet.isGlobal) {
      return res.status(403).json({ message: 'Cannot delete non-global sheet' });
    }

    await Sheet.findByIdAndDelete(req.params.id);

    res.json({ message: 'Sheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting global sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all global problems
router.get('/problems', requireAdmin, async (req, res) => {
  try {
    const problems = await Problem.find({ isGlobal: true })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 });

    res.json(problems);
  } catch (error) {
    console.error('Error fetching global problems:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create global problem
router.post('/problems', requireAdmin, async (req, res) => {
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
      status: 'todo'
    });

    await problem.save();
    await problem.populate('userId', 'name username');

    res.status(201).json(problem);
  } catch (error) {
    console.error('Error creating global problem:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete global problem
router.delete('/problems/:id', requireAdmin, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (!problem.isGlobal) {
      return res.status(403).json({ message: 'Cannot delete non-global problem' });
    }

    // Remove problem from all sheets
    await Sheet.updateMany(
      { 'problems.problemId': req.params.id },
      { $pull: { problems: { problemId: req.params.id } } }
    );

    await Problem.findByIdAndDelete(req.params.id);

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Error deleting global problem:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sheet details for editing
router.get('/sheets/:id', requireAdmin, async (req, res) => {
  try {
    const sheet = await Sheet.findById(req.params.id)
      .populate('problems.problemId')
      .populate('userId', 'name username');

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    if (!sheet.isGlobal) {
      return res.status(403).json({ message: 'Access denied to non-global sheet' });
    }

    res.json(sheet);
  } catch (error) {
    console.error('Error fetching sheet details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add problem to global sheet
router.post('/sheets/:id/problems', requireAdmin, async (req, res) => {
  try {
    const { problemId } = req.body;
    const sheet = await Sheet.findById(req.params.id);

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    if (!sheet.isGlobal) {
      return res.status(403).json({ message: 'Cannot modify non-global sheet' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Check if problem already exists in sheet
    const existingProblem = sheet.problems.find(p => p.problemId.toString() === problemId);
    if (existingProblem) {
      return res.status(400).json({ message: 'Problem already exists in sheet' });
    }

    sheet.problems.push({
      problemId: problemId,
      addedAt: new Date(),
      order: sheet.problems.length
    });

    await sheet.save();
    await sheet.populate('problems.problemId');

    res.json(sheet);
  } catch (error) {
    console.error('Error adding problem to sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove problem from global sheet
router.delete('/sheets/:id/problems/:problemId', requireAdmin, async (req, res) => {
  try {
    const sheet = await Sheet.findById(req.params.id);

    if (!sheet) {
      return res.status(404).json({ message: 'Sheet not found' });
    }

    if (!sheet.isGlobal) {
      return res.status(403).json({ message: 'Cannot modify non-global sheet' });
    }

    sheet.problems = sheet.problems.filter(p => p.problemId.toString() !== req.params.problemId);
    await sheet.save();

    res.json({ message: 'Problem removed from sheet successfully' });
  } catch (error) {
    console.error('Error removing problem from sheet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;