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

// LeetCode sync function
async function syncLeetCode(userId, handle) {
  try {
    // LeetCode GraphQL endpoint
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          profile {
            ranking
            userAvatar
            realName
            aboutMe
            school
            websites
            countryName
            company
            jobTitle
            skillTags
            postViewCount
            postViewCountDiff
            reputation
            reputationDiff
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username: handle }
    });

    if (!response.data.data.matchedUser) {
      throw new Error('User not found on LeetCode');
    }

    const userData = response.data.data.matchedUser;
    const stats = userData.submitStats.acSubmissionNum;

    // Update user stats
    const user = await User.findById(userId);
    user.stats.solvedByPlatform.leetcode = stats.find(s => s.difficulty === 'All')?.count || 0;
    user.stats.solvedByDifficulty.easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    user.stats.solvedByDifficulty.medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    user.stats.solvedByDifficulty.hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    user.stats.totalSolved = user.stats.solvedByPlatform.leetcode;

    await user.save();

    return {
      platform: 'leetcode',
      totalSolved: user.stats.solvedByPlatform.leetcode,
      easy: user.stats.solvedByDifficulty.easy,
      medium: user.stats.solvedByDifficulty.medium,
      hard: user.stats.solvedByDifficulty.hard,
      ranking: userData.profile.ranking
    };
  } catch (error) {
    throw new Error(`LeetCode sync failed: ${error.message}`);
  }
}

// Codeforces sync function
async function syncCodeforces(userId, handle) {
  try {
    // Get user info
    const userResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
    
    if (userResponse.data.status !== 'OK') {
      throw new Error('User not found on Codeforces');
    }

    const userInfo = userResponse.data.result[0];

    // Get user submissions
    const submissionsResponse = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`);
    
    if (submissionsResponse.data.status !== 'OK') {
      throw new Error('Failed to fetch submissions');
    }

    const submissions = submissionsResponse.data.result;
    const solvedProblems = new Set();

    // Count solved problems
    submissions.forEach(submission => {
      if (submission.verdict === 'OK') {
        solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
      }
    });

    // Update user stats
    const user = await User.findById(userId);
    user.stats.solvedByPlatform.codeforces = solvedProblems.size;
    user.stats.totalSolved = Object.values(user.stats.solvedByPlatform).reduce((a, b) => a + b, 0);

    await user.save();

    return {
      platform: 'codeforces',
      totalSolved: solvedProblems.size,
      rating: userInfo.rating || 0,
      maxRating: userInfo.maxRating || 0,
      rank: userInfo.rank || 'unrated'
    };
  } catch (error) {
    throw new Error(`Codeforces sync failed: ${error.message}`);
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

module.exports = router;