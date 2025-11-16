const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const axios = require('axios');

// Function to fetch LeetCode stats from CodeIt API
async function fetchLeetCodeStats(handle) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    console.log(`Fetching LeetCode data from ${apiUrl}/api/leetcode/user/${handle}`);
    
    const response = await axios.get(`${apiUrl}/api/leetcode/user/${handle}`, {
      timeout: 15000
    });

    if (!response.data) {
      throw new Error('User not found on LeetCode');
    }

    const userData = response.data;
    const stats = userData.problemsSolved;
    const contestRanking = userData.contestRanking || {};
    
    // Generate rating history from contest ranking if available
    const ratingHistory = [];
    if (contestRanking.rating) {
      // Create a simple rating history point
      ratingHistory.push({
        timestamp: new Date(),
        rating: Math.round(contestRanking.rating),
        contestName: `Current Rating (Attended: ${contestRanking.attendedContestsCount || 0})`
      });
    }
    
    return {
      totalSolved: stats?.total || 0,
      easy: stats?.easy || 0,
      medium: stats?.medium || 0,
      hard: stats?.hard || 0,
      rating: contestRanking.rating ? Math.round(contestRanking.rating) : 0,
      ranking: userData.profile?.ranking || 0,
      globalRanking: contestRanking.globalRanking || 0,
      attendedContests: contestRanking.attendedContestsCount || 0,
      topPercentage: contestRanking.topPercentage || 0,
      ratingHistory: ratingHistory
    };
  } catch (error) {
    console.error('Error fetching LeetCode stats:', error.message);
    return null;
  }
}

// Function to fetch Codeforces stats from CodeIt API
async function fetchCodeforcesStats(handle) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    console.log(`Fetching Codeforces data from ${apiUrl}/api/codeforces/user/${handle}`);
    
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
    
    // Parse rating history from API response
    const ratingHistory = [];
    if (userData.ratingHistory && Array.isArray(userData.ratingHistory)) {
      userData.ratingHistory.forEach(contest => {
        ratingHistory.push({
          timestamp: new Date(contest.ratingUpdateTime * 1000),
          rating: contest.newRating,
          contestName: contest.contestName,
          rank: contest.rank,
          oldRating: contest.oldRating,
          ratingChange: contest.newRating - contest.oldRating
        });
      });
    }
    
    return {
      totalSolved: solvedCount,
      rating: userData.rating || 0,
      maxRating: userData.maxRating || userData.rating || 0,
      rank: userData.rank || 'unrated',
      maxRank: userData.maxRank || userData.rank || 'unrated',
      contribution: userData.contribution || 0,
      lastOnlineTime: userData.lastOnline ? new Date(userData.lastOnline * 1000) : null,
      contestsParticipated: userData.contestsParticipated || 0,
      ratingHistory: ratingHistory
    };
  } catch (error) {
    console.error('Error fetching Codeforces stats:', error.message);
    return null;
  }
}

// Function to fetch CodeChef stats from CodeIt API
async function fetchCodeChefStats(handle) {
  try {
    const apiUrl = process.env.CODEIT_API_URL || 'https://codeit-api.onrender.com';
    console.log(`Fetching CodeChef data from ${apiUrl}/api/codechef/user/${handle}`);
    
    const response = await axios.get(`${apiUrl}/api/codechef/user/${handle}`, {
      timeout: 15000
    });

    if (!response.data) {
      throw new Error('User not found on CodeChef');
    }

    const userData = response.data;

    // Extract stats - handle both direct fields and nested stats object
    const totalSolved = userData.problemsSolved || userData.stats?.problemsSolved || 0;
    const rating = userData.rating || 0;
    const maxRating = userData.maxRating || rating;
    const stars = userData.stars || 0;
    
    // Parse rating history from API response
    const ratingHistory = [];
    if (userData.ratingHistory && Array.isArray(userData.ratingHistory)) {
      userData.ratingHistory.forEach((contest, index) => {
        ratingHistory.push({
          timestamp: contest.date ? new Date(contest.date) : new Date(Date.now() - (userData.ratingHistory.length - index) * 7 * 24 * 60 * 60 * 1000),
          rating: parseInt(contest.rating) || 0,
          contestName: contest.contestName || `Contest ${index + 1}`,
          rank: contest.rank || null
        });
      });
    }
    
    // Calculate division based on rating
    let division = 'Div 4';
    if (rating >= 1400 && rating < 1600) {
      division = 'Div 3';
    } else if (rating >= 1600 && rating < 1800) {
      division = 'Div 2';
    } else if (rating >= 1800) {
      division = 'Div 1';
    }
    
    return {
      totalSolved: totalSolved,
      rating: rating,
      maxRating: maxRating,
      stars: stars,
      globalRank: userData.rank || 'Unrated',
      division: division,
      ratingHistory: ratingHistory,
      contestsParticipated: userData.contestsParticipated || userData.totalContests || 0
    };
  } catch (error) {
    console.error('Error fetching CodeChef stats:', error.message);
    return null;
  }
}

// Sync profile data from connected platforms
router.post('/sync', auth, async (req, res) => {
  try {
    console.log('Profile sync request received for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has any platforms configured
    const hasPlatforms = user.platforms && 
      Object.values(user.platforms).some(platform => platform.handle && platform.isConnected);

    console.log('User platforms status:', {
      hasPlatforms,
      platforms: user.platforms
    });

    // If no platforms are configured, set up demo data for testing
    if (!hasPlatforms) {
      console.log('No platforms configured, setting up demo data...');
      
      // Initialize platforms with demo data
      user.platforms = {
        leetcode: {
          handle: 'demo_user_leetcode',
          isConnected: true,
          lastSynced: new Date()
        },
        codeforces: {
          handle: 'demo_user_cf',
          isConnected: true,
          lastSynced: new Date()
        },
        codechef: {
          handle: 'demo_user_cc',
          isConnected: true,
          lastSynced: new Date()
        }
      };
      
      await user.save();
      console.log('Demo platforms configured successfully');
    }

    const syncResults = {
      success: true,
      platformData: {},
      totalProblems: 0,
      lastSyncTime: new Date(),
      errors: [],
      isDemo: !hasPlatforms
    };

    // Sync LeetCode data
    if (user.platforms?.leetcode?.handle && user.platforms.leetcode.isConnected) {
      console.log('Syncing LeetCode data for handle:', user.platforms.leetcode.handle);
      const leetcodeStats = await fetchLeetCodeStats(user.platforms.leetcode.handle);
      if (leetcodeStats) {
        const platformData = {
          handle: user.platforms.leetcode.handle,
          totalSolved: leetcodeStats.totalSolved,
          easy: leetcodeStats.easy,
          medium: leetcodeStats.medium,
          hard: leetcodeStats.hard,
          rating: leetcodeStats.rating,
          ranking: leetcodeStats.ranking,
          globalRanking: leetcodeStats.globalRanking,
          attendedContests: leetcodeStats.attendedContests,
          topPercentage: leetcodeStats.topPercentage,
          ratingHistory: leetcodeStats.ratingHistory
        };
        syncResults.platformData.leetcode = platformData;
        syncResults.totalProblems += leetcodeStats.totalSolved;
        
        // Update user stats and cache data
        user.stats.solvedByPlatform.leetcode = leetcodeStats.totalSolved;
        user.platforms.leetcode.lastSynced = new Date();
        user.platforms.leetcode.cachedData = platformData;
      } else {
        syncResults.errors.push('Failed to fetch LeetCode data');
      }
    }

    // Sync Codeforces data
    if (user.platforms?.codeforces?.handle && user.platforms.codeforces.isConnected) {
      console.log('Syncing Codeforces data for handle:', user.platforms.codeforces.handle);
      const codeforcesStats = await fetchCodeforcesStats(user.platforms.codeforces.handle);
      if (codeforcesStats) {
        const platformData = {
          handle: user.platforms.codeforces.handle,
          totalSolved: codeforcesStats.totalSolved,
          rating: codeforcesStats.rating,
          maxRating: codeforcesStats.maxRating,
          rank: codeforcesStats.rank,
          maxRank: codeforcesStats.maxRank,
          contribution: codeforcesStats.contribution,
          lastOnlineTime: codeforcesStats.lastOnlineTime,
          contestsParticipated: codeforcesStats.contestsParticipated,
          ratingHistory: codeforcesStats.ratingHistory
        };
        syncResults.platformData.codeforces = platformData;
        syncResults.totalProblems += codeforcesStats.totalSolved;
        
        // Update user stats and cache data
        user.stats.solvedByPlatform.codeforces = codeforcesStats.totalSolved;
        user.platforms.codeforces.lastSynced = new Date();
        user.platforms.codeforces.cachedData = platformData;
      } else {
        syncResults.errors.push('Failed to fetch Codeforces data');
      }
    }

    // Sync CodeChef data
    if (user.platforms?.codechef?.handle && user.platforms.codechef.isConnected) {
      console.log('Syncing CodeChef data for handle:', user.platforms.codechef.handle);
      const codechefStats = await fetchCodeChefStats(user.platforms.codechef.handle);
      if (codechefStats) {
        const platformData = {
          handle: user.platforms.codechef.handle,
          totalSolved: codechefStats.totalSolved,
          rating: codechefStats.rating,
          maxRating: codechefStats.maxRating,
          stars: codechefStats.stars,
          globalRank: codechefStats.globalRank,
          division: codechefStats.division,
          contestsParticipated: codechefStats.contestsParticipated,
          ratingHistory: codechefStats.ratingHistory
        };
        syncResults.platformData.codechef = platformData;
        syncResults.totalProblems += codechefStats.totalSolved;
        
        // Update user stats and cache data
        user.stats.solvedByPlatform.codechef = codechefStats.totalSolved;
        user.platforms.codechef.lastSynced = new Date();
        user.platforms.codechef.cachedData = platformData;
      } else {
        syncResults.errors.push('Failed to fetch CodeChef data');
      }
    }

    // Update total solved problems
    user.stats.totalSolved = syncResults.totalProblems;

    // Save user data
    await user.save();

    // Add summary information to response
    syncResults.summary = {
      platformsConnected: Object.keys(syncResults.platformData).length,
      totalProblems: syncResults.totalProblems,
      platformBreakdown: Object.entries(syncResults.platformData).map(([platform, data]) => ({
        platform,
        problems: data.totalSolved,
        rating: data.rating
      }))
    };

    console.log('Profile sync completed successfully:', {
      totalProblems: syncResults.totalProblems,
      platforms: Object.keys(syncResults.platformData),
      errors: syncResults.errors,
      isDemo: syncResults.isDemo
    });

    res.json(syncResults);

  } catch (error) {
    console.error('Profile sync error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync profile data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get profile data
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare cached platform data
    const cachedPlatformData = {};
    if (user.platforms?.leetcode?.cachedData) {
      cachedPlatformData.leetcode = user.platforms.leetcode.cachedData;
    }
    if (user.platforms?.codeforces?.cachedData) {
      cachedPlatformData.codeforces = user.platforms.codeforces.cachedData;
    }
    if (user.platforms?.codechef?.cachedData) {
      cachedPlatformData.codechef = user.platforms.codechef.cachedData;
    }

    const profileData = {
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks
      },
      stats: user.stats,
      platforms: user.platforms,
      badges: user.badges,
      settings: user.settings,
      cachedPlatformData: Object.keys(cachedPlatformData).length > 0 ? cachedPlatformData : null
    };

    res.json(profileData);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch profile data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;