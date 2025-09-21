const express = require('express');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Sheet = require('../models/Sheet');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile/:username
// @desc    Get public user profile
// @access  Public
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username }).select('-password -email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isPublic) {
      return res.status(403).json({ message: 'This profile is private' });
    }
    
    // Get user stats
    const problemStats = await Problem.getUserStats(user._id);
    
    // Get recent activity (last 10 solved problems)
    const recentActivity = await Problem.find({
      userId: user._id,
      status: 'solved'
    })
    .sort({ solvedAt: -1 })
    .limit(10)
    .select('title platform difficulty solvedAt url');
    
    // Get user's public sheets
    const publicSheets = await Sheet.find({
      userId: user._id,
      isPublic: true
    })
    .select('name description category totalProblems solvedProblems progressPercentage')
    .limit(5);
    
    res.json({
      user: {
        ...user.toJSON(),
        stats: {
          ...user.stats,
          ...problemStats
        }
      },
      recentActivity,
      publicSheets
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }
    
    const users = await User.find({
      isPublic: true,
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username name avatar stats.totalSolved')
    .limit(parseInt(limit));
    
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/platforms
// @desc    Update platform handles
// @access  Private
router.put('/platforms', auth, async (req, res) => {
  try {
    const { platforms } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Update platform handles
    Object.keys(platforms).forEach(platform => {
      if (user.platforms[platform]) {
        user.platforms[platform].handle = platforms[platform].handle;
        user.platforms[platform].isConnected = !!platforms[platform].handle;
      }
    });
    
    await user.save();
    
    res.json({
      message: 'Platform handles updated successfully',
      platforms: user.platforms
    });
  } catch (error) {
    console.error('Update platforms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50, sortBy = 'totalSolved' } = req.query;
    
    let sortField = 'stats.totalSolved';
    if (sortBy === 'streak') sortField = 'stats.currentStreak';
    if (sortBy === 'maxStreak') sortField = 'stats.maxStreak';
    
    const users = await User.find({ isPublic: true })
      .select('username name avatar stats')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));
    
    res.json(users);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Follow/unfollow user
// @access  Private
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentUser = await User.findById(req.user.id);
    
    // Check if already following
    const isFollowing = currentUser.following?.includes(userId);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
      userToFollow.followers = userToFollow.followers?.filter(id => id.toString() !== req.user.id) || [];
    } else {
      // Follow
      currentUser.following = currentUser.following || [];
      currentUser.following.push(userId);
      userToFollow.followers = userToFollow.followers || [];
      userToFollow.followers.push(req.user.id);
    }
    
    await currentUser.save();
    await userToFollow.save();
    
    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;