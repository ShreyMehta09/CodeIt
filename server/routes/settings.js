const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Test endpoint without auth
router.get('/test', (req, res) => {
  res.json({ message: 'Settings route is working', timestamp: new Date().toISOString() });
});

// Get user settings
router.get('/', auth, async (req, res) => {
  try {
    console.log('Settings GET request received, user ID:', req.user?.id);
    
    if (!req.user?.id) {
      console.log('No user ID in request');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Add timeout and error handling for database query
    const user = await Promise.race([
      User.findById(req.user.id).select('-password'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);
    
    if (!user) {
      console.log('User not found with ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.email);

    // Initialize settings with defaults if they don't exist
    const defaultSettings = {
      emailNotifications: {
        general: true,
        weeklyReports: true,
        platformUpdates: true,
        achievements: true,
        reminders: false
      },
      privacy: {
        profileVisibility: 'public',
        showStats: true,
        showBadges: true,
        showSocialLinks: true
      },
      theme: 'auto'
    };

    const userSettings = user.settings || {};
    const mergedSettings = {
      emailNotifications: { ...defaultSettings.emailNotifications, ...userSettings.emailNotifications },
      privacy: { ...defaultSettings.privacy, ...userSettings.privacy },
      theme: userSettings.theme || defaultSettings.theme
    };

    const response = {
      profile: {
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        location: user.location,
        website: user.website,
        avatar: user.avatar
      },
      socialLinks: user.socialLinks || {},
      settings: mergedSettings,
      isPublic: user.isPublic
    };

    console.log('Sending settings response');
    res.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    
    // More specific error handling
    if (error.message === 'Database query timeout') {
      return res.status(504).json({ 
        message: 'Database timeout. Please try again.',
        error: 'TIMEOUT'
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid user ID format',
        error: 'INVALID_ID'
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      message: 'Server error while fetching settings', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
    });
  }
});

// Update profile information
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request:', req.body);
    const { name, username, bio, location, website, avatar } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is already taken (if changing)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Update profile fields
    if (name) user.name = name;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    console.log('Profile updated successfully for user:', user._id);

    res.json({
      message: 'Profile updated successfully',
      profile: {
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        location: user.location,
        website: user.website,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update social links
router.put('/social-links', auth, async (req, res) => {
  try {
    const { twitter, linkedin, github, portfolio, blog } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize socialLinks if it doesn't exist
    if (!user.socialLinks) {
      user.socialLinks = {};
    }

    // Update social links
    user.socialLinks.twitter = twitter || '';
    user.socialLinks.linkedin = linkedin || '';
    user.socialLinks.github = github || '';
    user.socialLinks.portfolio = portfolio || '';
    user.socialLinks.blog = blog || '';

    await user.save();

    res.json({
      message: 'Social links updated successfully',
      socialLinks: user.socialLinks
    });
  } catch (error) {
    console.error('Error updating social links:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notification settings
router.put('/notifications', auth, async (req, res) => {
  try {
    const { emailNotifications } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.emailNotifications) {
      user.settings.emailNotifications = {};
    }

    // Update notification settings
    if (emailNotifications) {
      user.settings.emailNotifications = {
        ...user.settings.emailNotifications,
        ...emailNotifications
      };
    }

    await user.save();

    res.json({
      message: 'Notification settings updated successfully',
      emailNotifications: user.settings.emailNotifications
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update privacy settings
router.put('/privacy', auth, async (req, res) => {
  try {
    const { profileVisibility, showStats, showBadges, showSocialLinks } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.privacy) {
      user.settings.privacy = {};
    }

    // Update privacy settings
    if (profileVisibility !== undefined) user.settings.privacy.profileVisibility = profileVisibility;
    if (showStats !== undefined) user.settings.privacy.showStats = showStats;
    if (showBadges !== undefined) user.settings.privacy.showBadges = showBadges;
    if (showSocialLinks !== undefined) user.settings.privacy.showSocialLinks = showSocialLinks;

    // Also update the legacy isPublic field for backward compatibility
    if (profileVisibility !== undefined) {
      user.isPublic = profileVisibility === 'public';
    }

    await user.save();

    res.json({
      message: 'Privacy settings updated successfully',
      privacy: user.settings.privacy,
      isPublic: user.isPublic
    });
  } catch (error) {
    console.error('Error updating privacy:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update theme preference
router.put('/theme', auth, async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({ message: 'Invalid theme selection' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }

    user.settings.theme = theme;
    await user.save();

    res.json({
      message: 'Theme updated successfully',
      theme: user.settings.theme
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;