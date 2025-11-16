import React, { useState, useEffect } from 'react';
import { Edit, Share, Calendar, MapPin, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import { getAvatarUrl, formatDate } from '../utils/helpers';
import api from '../utils/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Load cached platform data on component mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        console.log('Loading cached platform data...');
        const response = await api.get('/profile');
        console.log('Profile response:', response.data);
        
        if (response.data.cachedPlatformData && Object.keys(response.data.cachedPlatformData).length > 0) {
          console.log('Found cached data:', response.data.cachedPlatformData);
          // Format cached data to match sync response format
          const formattedData = {
            success: true,
            platformData: response.data.cachedPlatformData,
            totalProblems: Object.values(response.data.cachedPlatformData).reduce(
              (sum, platform) => sum + (platform.totalSolved || 0), 0
            ),
            lastSyncTime: response.data.platforms?.leetcode?.lastSynced || 
                          response.data.platforms?.codeforces?.lastSynced || 
                          response.data.platforms?.codechef?.lastSynced || 
                          new Date(),
            errors: [],
            isDemo: false,
            summary: {
              platformsConnected: Object.keys(response.data.cachedPlatformData).length,
              totalProblems: Object.values(response.data.cachedPlatformData).reduce(
                (sum, platform) => sum + (platform.totalSolved || 0), 0
              ),
              platformBreakdown: Object.entries(response.data.cachedPlatformData).map(([platform, data]) => ({
                platform,
                problems: data.totalSolved,
                rating: data.rating
              }))
            }
          };
          setSyncData(formattedData);
          console.log('Cached data loaded successfully');
        } else {
          console.log('No cached data available');
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadCachedData();
  }, []);

  const handleSync = async () => {
    try {
      setSyncLoading(true);
      setSyncError(null);
      
      console.log('Starting profile sync...');
      
      // Make POST request to sync endpoint
      const response = await api.post('/profile/sync');
      
      console.log('Sync response:', response.data);
      
      if (response.data.success) {
        setSyncData(response.data);
        // Update user context with new stats if needed
        if (updateUser) {
          updateUser(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalSolved: response.data.totalProblems
            }
          }));
        }
      } else {
        setSyncError('Failed to sync data');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.response?.data?.message || error.message || 'Failed to sync data');
    } finally {
      setSyncLoading(false);
    }
  };

  const renderRatingGraph = (platformData, platformName) => {
    if (!platformData || !platformData.ratingHistory || platformData.ratingHistory.length === 0) {
      return <div className="text-sm text-gray-500">No rating history available</div>;
    }

    // Sort rating history by timestamp for accurate chronological display
    const sortedHistory = [...platformData.ratingHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const chartData = {
      labels: sortedHistory.map((point, index) => {
        const date = new Date(point.timestamp);
        // Show contest name for tooltip, date for label
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
        });
      }),
      datasets: [
        {
          label: `${platformName.charAt(0).toUpperCase() + platformName.slice(1)} Rating`,
          data: sortedHistory.map(point => point.rating),
          borderColor: platformName === 'leetcode' ? '#FFA116' : 
                      platformName === 'codeforces' ? '#1F8ACB' : '#5B4638',
          backgroundColor: platformName === 'leetcode' ? '#FFA11615' : 
                           platformName === 'codeforces' ? '#1F8ACB15' : '#5B463815',
          tension: 0.2,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: platformName === 'leetcode' ? '#FFA116' : 
                                platformName === 'codeforces' ? '#1F8ACB' : '#5B4638',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: platformName === 'leetcode' ? '#FF8C00' : 
                                    platformName === 'codeforces' ? '#1E7BB8' : '#4A3528',
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 12,
              weight: 'bold'
            },
            color: '#374151'
          }
        },
        title: {
          display: true,
          text: `${platformName.charAt(0).toUpperCase() + platformName.slice(1)} Rating History`,
          font: {
            size: 16,
            weight: 'bold'
          },
          color: '#1F2937'
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: platformName === 'leetcode' ? '#FFA116' : 
                      platformName === 'codeforces' ? '#1F8ACB' : '#5B4638',
          borderWidth: 2,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              const dataIndex = context[0].dataIndex;
              const point = sortedHistory[dataIndex];
              return point.contestName || `Contest ${dataIndex + 1}`;
            },
            label: function(context) {
              const dataIndex = context.dataIndex;
              const point = sortedHistory[dataIndex];
              const date = new Date(point.timestamp).toLocaleDateString('en-US', { 
                weekday: 'short',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
              
              // Calculate rating change if not first contest
              let ratingChange = '';
              if (dataIndex > 0) {
                const previousRating = sortedHistory[dataIndex - 1].rating;
                const change = point.rating - previousRating;
                ratingChange = change >= 0 ? ` (+${change})` : ` (${change})`;
              }
              
              return [
                `Rating: ${point.rating}${ratingChange}`,
                `Date: ${date}`
              ];
            },
            afterLabel: function(context) {
              const dataIndex = context.dataIndex;
              const point = sortedHistory[dataIndex];
              
              // Add additional platform-specific info
              if (platformName === 'codeforces' && platformData.rank) {
                return `Rank: ${platformData.rank}`;
              } else if (platformName === 'codechef' && platformData.stars) {
                return `Stars: ${platformData.stars}⭐`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: false
          },
          border: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            },
            color: '#6B7280',
            padding: 8
          },
          title: {
            display: true,
            text: 'Rating',
            font: {
              size: 12,
              weight: 'bold'
            },
            color: '#374151'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          border: {
            display: false
          },
          ticks: {
            font: {
              size: 10
            },
            color: '#6B7280',
            maxRotation: 45,
            padding: 8
          },
          title: {
            display: true,
            text: 'Contest Date',
            font: {
              size: 12,
              weight: 'bold'
            },
            color: '#374151'
          }
        }
      }
    };

    return <Line data={chartData} options={options} />;
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={getAvatarUrl(user)}
                alt={user.name}
                className="w-24 h-24 rounded-full"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 mt-4 sm:mt-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-gray-600">@{user.username}</p>
                  
                  {user.bio && (
                    <p className="text-gray-700 mt-2">{user.bio}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    {user.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.location}
                      </div>
                    )}
                    {user.website && (
                      <div className="flex items-center">
                        <LinkIcon className="w-4 h-4 mr-1" />
                        <a 
                          href={user.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatDate(user.createdAt, 'MMM yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSync}
                    disabled={syncLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                    {syncLoading ? 'Syncing...' : 'Sync Data'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      {syncError && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-content">
            <div className="text-red-700 font-medium">Sync Error</div>
            <div className="text-red-600 text-sm">{syncError}</div>
          </div>
        </div>
      )}

      {syncData && syncData.success && (
        <div className="card border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30">
          <div className="card-content">
            <div className="text-green-700 dark:text-green-400 font-medium">
              Sync Successful! 
              {syncData.isDemo && (
                <span className="text-blue-600 dark:text-blue-400 text-sm ml-2">(Demo Data)</span>
              )}
              <span className="text-green-600 dark:text-green-400 text-sm ml-2">
                Total Problems: {syncData.totalProblems} | Last Sync: {new Date(syncData.lastSyncTime).toLocaleString()}
              </span>
            </div>
            {syncData.summary && (
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {syncData.summary.platformBreakdown.map(platform => (
                    <div key={platform.platform} className="bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                      <div className="font-medium capitalize dark:text-white">{platform.platform}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {platform.problems} problems • Rating: {platform.rating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {syncData.isDemo && (
              <div className="text-blue-600 dark:text-blue-400 text-sm mt-2 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                <strong>Demo Mode:</strong> Connect your real platform accounts in Settings to see your actual data.
              </div>
            )}
            {syncData.errors && syncData.errors.length > 0 && (
              <div className="text-yellow-600 text-sm mt-1">
                Warnings: {syncData.errors.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Data Charts */}
      {syncData && syncData.platformData && Object.keys(syncData.platformData).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Rating History</h2>
            <p className="card-description">Your rating progression across platforms</p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(syncData.platformData).map(([platform, data]) => (
                <div key={platform} className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-lg capitalize">{platform}</h3>
                      <div className="text-sm text-gray-600 mb-2">@{data.handle}</div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700">Problems Solved</div>
                          <div className="text-lg font-bold text-blue-600">{data.totalSolved}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Current Rating</div>
                          <div className="text-lg font-bold text-green-600">{data.rating || 'N/A'}</div>
                        </div>
                        
                        {data.maxRating && (
                          <>
                            <div>
                              <div className="font-medium text-gray-700">Max Rating</div>
                              <div className="text-sm font-semibold text-orange-600">{data.maxRating}</div>
                            </div>
                          </>
                        )}
                        
                        {data.rank && (
                          <div>
                            <div className="font-medium text-gray-700">Rank</div>
                            <div className="text-sm font-semibold text-purple-600 capitalize">{data.rank}</div>
                          </div>
                        )}
                        
                        {data.stars && (
                          <div>
                            <div className="font-medium text-gray-700">Stars</div>
                            <div className="text-sm font-semibold text-yellow-600">{data.stars}⭐</div>
                          </div>
                        )}
                        
                        {data.division && (
                          <div>
                            <div className="font-medium text-gray-700">Division</div>
                            <div className="text-sm font-semibold text-indigo-600">{data.division}</div>
                          </div>
                        )}
                        
                        {data.globalRank && (
                          <div>
                            <div className="font-medium text-gray-700">Global Rank</div>
                            <div className="text-sm font-semibold text-red-600">#{data.globalRank.toLocaleString()}</div>
                          </div>
                        )}
                        
                        {data.contribution !== undefined && (
                          <div>
                            <div className="font-medium text-gray-700">Contribution</div>
                            <div className="text-sm font-semibold text-cyan-600">{data.contribution}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-64 bg-white dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700">
                    {renderRatingGraph(data, platform)}
                  </div>
                  
                  {/* Contest History Table */}
                  {data.ratingHistory && data.ratingHistory.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <h4 className="font-semibold text-sm">Recent Contests</h4>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Contest</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Date</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Rating</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Change</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...data.ratingHistory]
                              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                              .slice(0, 8)
                              .map((contest, index, sortedContests) => {
                                const date = new Date(contest.timestamp);
                                const nextContest = sortedContests[index + 1];
                                const ratingChange = nextContest ? contest.rating - nextContest.rating : null;
                                
                                return (
                                  <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-800 truncate max-w-32" title={contest.contestName}>
                                      {contest.contestName || `Contest ${index + 1}`}
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-600">
                                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                                    </td>
                                    <td className="px-3 py-2 text-center font-semibold text-gray-800">
                                      {contest.rating}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {ratingChange !== null ? (
                                        <span className={`font-semibold ${ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {ratingChange >= 0 ? '+' : ''}{ratingChange}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Difficulty Breakdown */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Difficulty Breakdown</h2>
          <p className="card-description">
            {syncData?.platformData?.leetcode ? 
              `LeetCode problems solved by difficulty` : 
              'Connect LeetCode to see difficulty breakdown'}
          </p>
        </div>
        <div className="card-content">
          {syncData?.platformData?.leetcode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-success-600">
                    {syncData.platformData.leetcode.easy || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Easy</div>
                  <div className="mt-2 bg-success-100 dark:bg-success-900/30 rounded-full h-2">
                    <div 
                      className="bg-success-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${syncData.platformData.leetcode.totalSolved > 0 
                          ? (syncData.platformData.leetcode.easy / syncData.platformData.leetcode.totalSolved * 100) 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {syncData.platformData.leetcode.totalSolved > 0 
                      ? Math.round(syncData.platformData.leetcode.easy / syncData.platformData.leetcode.totalSolved * 100) 
                      : 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning-600">
                    {syncData.platformData.leetcode.medium || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Medium</div>
                  <div className="mt-2 bg-warning-100 dark:bg-warning-900/30 rounded-full h-2">
                    <div 
                      className="bg-warning-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${syncData.platformData.leetcode.totalSolved > 0 
                          ? (syncData.platformData.leetcode.medium / syncData.platformData.leetcode.totalSolved * 100) 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {syncData.platformData.leetcode.totalSolved > 0 
                      ? Math.round(syncData.platformData.leetcode.medium / syncData.platformData.leetcode.totalSolved * 100) 
                      : 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-danger-600">
                    {syncData.platformData.leetcode.hard || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Hard</div>
                  <div className="mt-2 bg-danger-100 dark:bg-danger-900/30 rounded-full h-2">
                    <div 
                      className="bg-danger-600 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${syncData.platformData.leetcode.totalSolved > 0 
                          ? (syncData.platformData.leetcode.hard / syncData.platformData.leetcode.totalSolved * 100) 
                          : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {syncData.platformData.leetcode.totalSolved > 0 
                      ? Math.round(syncData.platformData.leetcode.hard / syncData.platformData.leetcode.totalSolved * 100) 
                      : 0}%
                  </div>
                </div>
              </div>
              <div className="border-t dark:border-gray-700 pt-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400">Total Solved</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {syncData.platformData.leetcode.totalSolved}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400">Contest Rating</div>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      {syncData.platformData.leetcode.rating || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400">Global Ranking</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {syncData.platformData.leetcode.globalRanking ? 
                        `#${syncData.platformData.leetcode.globalRanking.toLocaleString()}` : 
                        syncData.platformData.leetcode.ranking ? 
                        `#${syncData.platformData.leetcode.ranking.toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400">Contests</div>
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {syncData.platformData.leetcode.attendedContests || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-xl font-bold text-success-600">
                  {user.stats?.solvedByDifficulty?.easy || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Easy</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-warning-600">
                  {user.stats?.solvedByDifficulty?.medium || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-danger-600">
                  {user.stats?.solvedByDifficulty?.hard || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hard</div>
              </div>
            </div>
          )}
        </div>
      </div>

      

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Badges</h2>
            <p className="card-description">Your achievements and milestones</p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.badges.map((badge, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{badge.icon}</div>
                  <div>
                    <div className="font-medium">{badge.name}</div>
                    <div className="text-sm text-gray-500">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;