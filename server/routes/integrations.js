const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const User = require('../models/User');
const Problem = require('../models/Problem');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/integrations/sync/:platform
// @desc    Sync data from a platform
// @access  Private
router.post('/sync/:platform', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    const { handle } = req.body;

    if (!handle) {
      return res.status(400).json({ message: 'Handle is required' });
    }

    const user = await User.findById(req.user.id);
    
    // Update user's platform handle
    if (user.platforms[platform]) {
      user.platforms[platform].handle = handle;
      user.platforms[platform].isConnected = true;
    }

    let syncResult;
    
    switch (platform) {
      case 'leetcode':
        syncResult = await syncLeetCode(user._id, handle);
        break;
      case 'codeforces':
        syncResult = await syncCodeforces(user._id, handle);
        break;
      case 'codechef':
        syncResult = await syncCodeChef(user._id, handle);
        break;
      case 'github':
        syncResult = await syncGitHub(user._id, handle);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported platform' });
    }

    // Update last synced time
    user.platforms[platform].lastSynced = new Date();
    await user.save();

    res.json({
      message: `${platform} sync completed successfully`,
      ...syncResult
    });
  } catch (error) {
    console.error(`Sync ${req.params.platform} error:`, error);
    res.status(500).json({ 
      message: `Failed to sync ${req.params.platform} data`,
      error: error.message 
    });
  }
});

// @route   GET /api/integrations/status
// @desc    Get integration status for user
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const status = {};
    Object.keys(user.platforms).forEach(platform => {
      status[platform] = {
        isConnected: user.platforms[platform].isConnected,
        handle: user.platforms[platform].handle,
        lastSynced: user.platforms[platform].lastSynced
      };
    });

    res.json(status);
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Platform verification functions
async function verifyPlatformProfile(platform, username, verificationCode) {
  try {
    switch (platform) {
      case 'leetcode':
        return await verifyLeetCodeProfile(username, verificationCode);
      case 'codeforces':
        return await verifyCodeforcesProfile(username, verificationCode);
      case 'codechef':
        return await verifyCodeChefProfile(username, verificationCode);
      default:
        return false;
    }
  } catch (error) {
    console.error(`Verification error for ${platform}:`, error);
    return false;
  }
}

async function verifyLeetCodeProfile(username, verificationCode) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    const response = await axios.get(`${apiUrl}/api/leetcode/user/${username}`, {
      timeout: 15000
    });

    if (!response.data) {
      return false;
    }

    // Check if data is nested under profile or directly available
    const userData = response.data;
    const profile = userData.profile || userData;
    
    // Check summary field specifically as requested
    const summary = profile.summary || profile.aboutMe || userData.summary || userData.aboutMe || '';
    
    console.log('LeetCode verification - Username:', username);
    console.log('LeetCode verification - Summary from API:', summary);
    console.log('LeetCode verification - Looking for code:', verificationCode);
    console.log('LeetCode verification - Match result:', summary.includes(verificationCode));
    
    return summary.includes(verificationCode);
  } catch (error) {
    console.error('LeetCode verification error:', error);
    return false;
  }
}

async function verifyCodeforcesProfile(username, verificationCode) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    const response = await axios.get(`${apiUrl}/api/codeforces/user/${username}`, {
      timeout: 15000
    });

    if (!response.data) {
      return false;
    }

    const user = response.data;
    // Check firstName field specifically as requested
    const firstName = user.firstName || '';
    
    console.log('Codeforces verification - Username:', username);
    console.log('Codeforces verification - FirstName from API:', firstName);
    console.log('Codeforces verification - Looking for code:', verificationCode);
    console.log('Codeforces verification - Match result:', firstName.includes(verificationCode));
    
    return firstName.includes(verificationCode);
  } catch (error) {
    console.error('Codeforces verification error:', error);
    return false;
  }
}

async function verifyCodeChefProfile(username, verificationCode) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    const response = await axios.get(`${apiUrl}/api/codechef/user/${username}`, {
      timeout: 15000
    });

    if (!response.data) {
      return false;
    }

    // CodeChef API returns data directly, not nested under profile
    const userData = response.data;
    // Check name field specifically as requested
    const name = userData.name || '';
    
    console.log('CodeChef verification - Username:', username);
    console.log('CodeChef verification - Name from API:', name);
    console.log('CodeChef verification - Looking for code:', verificationCode);
    console.log('CodeChef verification - Match result:', name.includes(verificationCode));
    
    return name.includes(verificationCode);
  } catch (error) {
    console.error('CodeChef verification error:', error);
    return false;
  }
}

// LeetCode sync function
async function syncLeetCode(userId, handle) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    const response = await axios.get(`${apiUrl}/api/leetcode/user/${handle}`, {
      timeout: 15000
    });

    if (!response.data) {
      throw new Error('User not found on LeetCode');
    }

    const userData = response.data;
    const stats = userData.problemsSolved;

    // Update user stats
    const user = await User.findById(userId);
    user.stats.solvedByPlatform.leetcode = stats?.total || 0;
    user.stats.solvedByDifficulty.easy = stats?.easy || 0;
    user.stats.solvedByDifficulty.medium = stats?.medium || 0;
    user.stats.solvedByDifficulty.hard = stats?.hard || 0;
    user.stats.totalSolved = Object.values(user.stats.solvedByPlatform).reduce((a, b) => a + b, 0);

    await user.save();

    return {
      platform: 'leetcode',
      totalSolved: user.stats.solvedByPlatform.leetcode,
      easy: user.stats.solvedByDifficulty.easy,
      medium: user.stats.solvedByDifficulty.medium,
      hard: user.stats.solvedByDifficulty.hard,
      ranking: userData.profile?.ranking || null
    };
  } catch (error) {
    throw new Error(`LeetCode sync failed: ${error.message}`);
  }
}

// Codeforces sync function
async function syncCodeforces(userId, handle) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    const response = await axios.get(`${apiUrl}/api/codeforces/user/${handle}`, {
      timeout: 15000
    });

    if (!response.data) {
      throw new Error('User not found on Codeforces');
    }

    const userData = response.data;

    // Get submissions to count solved problems
    let solvedCount = 0;
    try {
      const submissionsResponse = await axios.get(`${apiUrl}/api/codeforces/user/${handle}/submissions`, {
        timeout: 15000
      });
      
      if (submissionsResponse.data && submissionsResponse.data.solvedProblems) {
        solvedCount = submissionsResponse.data.solvedProblems;
      }
    } catch (submissionError) {
      console.warn('Could not fetch submissions for solved count:', submissionError.message);
    }

    // Update user stats
    const user = await User.findById(userId);
    user.stats.solvedByPlatform.codeforces = solvedCount;
    user.stats.totalSolved = Object.values(user.stats.solvedByPlatform).reduce((a, b) => a + b, 0);

    await user.save();

    return {
      platform: 'codeforces',
      totalSolved: solvedCount,
      rating: userData.rating || 0,
      maxRating: userData.maxRating || 0,
      rank: userData.rank || 'unrated'
    };
  } catch (error) {
    throw new Error(`Codeforces sync failed: ${error.message}`);
  }
}

// CodeChef sync function
async function syncCodeChef(userId, handle) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    const response = await axios.get(`${apiUrl}/api/codechef/user/${handle}`, {
      timeout: 15000
    });

    if (!response.data) {
      throw new Error('User not found on CodeChef');
    }

    const userData = response.data;
    const stats = userData.stats || {};

    // Extract stats
    const totalSolved = stats.problemsSolved || 0;
    const rating = userData.rating || 0;
    const maxRating = userData.maxRating || rating;
    const stars = userData.stars || 0;

    // Update user stats
    const user = await User.findById(userId);
    user.stats.solvedByPlatform.codechef = totalSolved;
    user.stats.totalSolved = Object.values(user.stats.solvedByPlatform).reduce((a, b) => a + b, 0);

    await user.save();

    return {
      platform: 'codechef',
      totalSolved,
      rating,
      maxRating,
      stars
    };
  } catch (error) {
    throw new Error(`CodeChef sync failed: ${error.message}`);
  }
}

// GitHub sync function
async function syncGitHub(userId, handle) {
  try {
    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Get user info
    const userResponse = await axios.get(`https://api.github.com/users/${handle}`, { headers });
    const userInfo = userResponse.data;

    // Get repositories
    const reposResponse = await axios.get(`https://api.github.com/users/${handle}/repos?sort=updated&per_page=100`, { headers });
    const repos = reposResponse.data;

    // Calculate stats
    const totalRepos = repos.length;
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const languages = {};
    
    repos.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });

    const topLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lang, count]) => ({ language: lang, count }));

    return {
      platform: 'github',
      totalRepos,
      totalStars,
      followers: userInfo.followers,
      following: userInfo.following,
      topLanguages,
      publicRepos: userInfo.public_repos
    };
  } catch (error) {
    throw new Error(`GitHub sync failed: ${error.message}`);
  }
}

// @route   GET /api/integrations/github/:handle/repos
// @desc    Get GitHub repositories for a user
// @access  Public
router.get('/github/:handle/repos', async (req, res) => {
  try {
    const { handle } = req.params;
    const { page = 1, per_page = 10 } = req.query;

    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(
      `https://api.github.com/users/${handle}/repos?sort=updated&page=${page}&per_page=${per_page}`,
      { headers }
    );

    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      updatedAt: repo.updated_at,
      topics: repo.topics
    }));

    res.json(repos);
  } catch (error) {
    console.error('Get GitHub repos error:', error);
    res.status(500).json({ message: 'Failed to fetch GitHub repositories' });
  }
});

// @route   POST /api/integrations/disconnect/:platform
// @desc    Disconnect a platform integration
// @access  Private
router.post('/disconnect/:platform', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    
    const user = await User.findById(req.user.id);
    
    if (user.platforms[platform]) {
      user.platforms[platform].handle = '';
      user.platforms[platform].isConnected = false;
      user.platforms[platform].lastSynced = null;
      user.platforms[platform].verificationCode = '';
      user.platforms[platform].verificationExpiry = null;
    }

    await user.save();

    res.json({
      message: `${platform} disconnected successfully`
    });
  } catch (error) {
    console.error('Disconnect platform error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/integrations/connect/:platform
// @desc    Initiate platform connection with verification
// @access  Private
router.post('/connect/:platform', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const supportedPlatforms = ['leetcode', 'codeforces', 'codechef'];
    if (!supportedPlatforms.includes(platform)) {
      return res.status(400).json({ message: 'Unsupported platform' });
    }

    const user = await User.findById(req.user.id);
    
    // Generate verification code
    const verificationCode = 'CodeIt_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    user.platforms[platform].verificationCode = verificationCode;
    user.platforms[platform].verificationExpiry = verificationExpiry;
    await user.save();

    res.json({
      verificationCode,
      username,
      platform,
      expiresIn: 10, // minutes
      instructions: getVerificationInstructions(platform, username, verificationCode)
    });
  } catch (error) {
    console.error('Connect platform error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/integrations/verify/:platform
// @desc    Verify platform connection
// @access  Private
router.post('/verify/:platform', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findById(req.user.id);
    const platformData = user.platforms[platform];

    if (!platformData.verificationCode || !platformData.verificationExpiry) {
      return res.status(400).json({ 
        message: 'No verification code found. Please initiate connection first.' 
      });
    }

    if (new Date() > platformData.verificationExpiry) {
      return res.status(400).json({ 
        message: 'Verification code expired. Please initiate connection again.' 
      });
    }

    // Verify the code on the platform
    const isVerified = await verifyPlatformProfile(platform, username, platformData.verificationCode);

    if (!isVerified) {
      return res.status(400).json({ 
        message: 'Verification failed. Please make sure you have updated your profile with the verification code.' 
      });
    }

    // Connection successful
    platformData.handle = username;
    platformData.isConnected = true;
    platformData.verificationCode = '';
    platformData.verificationExpiry = null;
    platformData.lastSynced = new Date();

    await user.save();

    // Sync data from platform
    let syncResult;
    try {
      switch (platform) {
        case 'leetcode':
          syncResult = await syncLeetCode(user._id, username);
          break;
        case 'codeforces':
          syncResult = await syncCodeforces(user._id, username);
          break;
        case 'codechef':
          syncResult = await syncCodeChef(user._id, username);
          break;
      }
    } catch (syncError) {
      console.warn('Sync error after verification:', syncError);
      // Don't fail verification if sync fails
    }

    res.json({
      message: `${platform} connected successfully`,
      platform,
      username,
      syncResult
    });
  } catch (error) {
    console.error('Verify platform error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function getVerificationInstructions(platform, username, verificationCode) {
  const instructions = {
    leetcode: {
      title: 'LeetCode Profile Verification',
      steps: [
        '1. Go to your LeetCode profile settings',
        '2. Update your "Summary" section to include this code: ' + verificationCode,
        '3. Save your profile changes',
        '4. Click "Verify Connection" below',
        '5. You can remove the code from your summary after verification'
      ],
      profileUrl: `https://leetcode.com/${username}/`
    },
    codeforces: {
      title: 'Codeforces Profile Verification', 
      steps: [
        '1. Go to your Codeforces profile settings',
        '2. Update your "First Name" field to include: ' + verificationCode,
        '3. Save your profile changes',
        '4. Click "Verify Connection" below',
        '5. You can change your first name back after verification'
      ],
      profileUrl: `https://codeforces.com/profile/${username}`
    },
    codechef: {
      title: 'CodeChef Profile Verification',
      steps: [
        '1. Go to your CodeChef profile settings',
        '2. Update your "Name" field to include: ' + verificationCode,
        '3. Save your profile changes', 
        '4. Click "Verify Connection" below',
        '5. You can change your name back after verification'
      ],
      profileUrl: `https://www.codechef.com/users/${username}`
    }
  };

  return instructions[platform];
}

module.exports = router;