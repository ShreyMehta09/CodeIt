const cron = require('node-cron');
const User = require('../models/User');
const axios = require('axios');

// Run sync job every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Starting background sync job...');
  
  try {
    // Get all users with connected platforms
    const users = await User.find({
      $or: [
        { 'platforms.leetcode.isConnected': true },
        { 'platforms.codeforces.isConnected': true },
        { 'platforms.github.isConnected': true }
      ]
    });

    console.log(`Found ${users.length} users with connected platforms`);

    for (const user of users) {
      try {
        // Sync LeetCode data
        if (user.platforms.leetcode.isConnected && user.platforms.leetcode.handle) {
          await syncUserLeetCode(user);
        }

        // Sync Codeforces data
        if (user.platforms.codeforces.isConnected && user.platforms.codeforces.handle) {
          await syncUserCodeforces(user);
        }

        // Sync GitHub data
        if (user.platforms.github.isConnected && user.platforms.github.handle) {
          await syncUserGitHub(user);
        }

        // Update last synced time
        await user.save();
        
        console.log(`Synced data for user: ${user.username}`);
      } catch (error) {
        console.error(`Error syncing user ${user.username}:`, error.message);
      }
    }

    console.log('Background sync job completed');
  } catch (error) {
    console.error('Background sync job failed:', error);
  }
});

// Sync LeetCode data for a user
async function syncUserLeetCode(user) {
  try {
    const handle = user.platforms.leetcode.handle;
    
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
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username: handle }
    }, {
      timeout: 10000
    });

    if (response.data.data.matchedUser) {
      const stats = response.data.data.matchedUser.submitStats.acSubmissionNum;
      
      user.stats.solvedByPlatform.leetcode = stats.find(s => s.difficulty === 'All')?.count || 0;
      user.stats.solvedByDifficulty.easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
      user.stats.solvedByDifficulty.medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
      user.stats.solvedByDifficulty.hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
      
      user.platforms.leetcode.lastSynced = new Date();
    }
  } catch (error) {
    console.error(`LeetCode sync failed for ${user.username}:`, error.message);
  }
}

// Sync Codeforces data for a user
async function syncUserCodeforces(user) {
  try {
    const handle = user.platforms.codeforces.handle;
    
    const submissionsResponse = await axios.get(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`,
      { timeout: 10000 }
    );
    
    if (submissionsResponse.data.status === 'OK') {
      const submissions = submissionsResponse.data.result;
      const solvedProblems = new Set();

      submissions.forEach(submission => {
        if (submission.verdict === 'OK') {
          solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
        }
      });

      user.stats.solvedByPlatform.codeforces = solvedProblems.size;
      user.platforms.codeforces.lastSynced = new Date();
    }
  } catch (error) {
    console.error(`Codeforces sync failed for ${user.username}:`, error.message);
  }
}

// Sync GitHub data for a user
async function syncUserGitHub(user) {
  try {
    const handle = user.platforms.github.handle;
    const headers = {};
    
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const userResponse = await axios.get(`https://api.github.com/users/${handle}`, {
      headers,
      timeout: 10000
    });

    if (userResponse.data) {
      // Store GitHub stats in user profile (you might want to add these fields to User model)
      user.platforms.github.lastSynced = new Date();
    }
  } catch (error) {
    console.error(`GitHub sync failed for ${user.username}:`, error.message);
  }
}

// Manual sync function that can be called from routes
async function manualSync(userId, platform) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    switch (platform) {
      case 'leetcode':
        await syncUserLeetCode(user);
        break;
      case 'codeforces':
        await syncUserCodeforces(user);
        break;
      case 'github':
        await syncUserGitHub(user);
        break;
      default:
        throw new Error('Unsupported platform');
    }

    await user.save();
    return { success: true, message: `${platform} sync completed` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  manualSync
};