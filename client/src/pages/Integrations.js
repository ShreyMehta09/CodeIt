import React from 'react';
import { Link2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';

const Integrations = () => {
  const platforms = [
    {
      name: 'LeetCode',
      description: 'Sync your LeetCode problems and statistics',
      icon: '🟠',
      isConnected: true,
      handle: 'john_doe',
      lastSynced: '2024-01-15T10:30:00Z',
      stats: {
        totalSolved: 245,
        easy: 89,
        medium: 123,
        hard: 33
      }
    },
    {
      name: 'Codeforces',
      description: 'Import your Codeforces contest history and ratings',
      icon: '🔵',
      isConnected: false,
      handle: '',
      lastSynced: null,
      stats: null
    },
    {
      name: 'CodeChef',
      description: 'Track your CodeChef contest participation',
      icon: '🟤',
      isConnected: false,
      handle: '',
      lastSynced: null,
      stats: null
    },
    {
      name: 'AtCoder',
      description: 'Sync your AtCoder contest results',
      icon: '🟣',
      isConnected: false,
      handle: '',
      lastSynced: null,
      stats: null
    },
    {
      name: 'GitHub',
      description: 'Showcase your coding projects and contributions',
      icon: '⚫',
      isConnected: true,
      handle: 'johndoe',
      lastSynced: '2024-01-14T15:20:00Z',
      stats: {
        repositories: 42,
        stars: 156,
        followers: 23
      }
    }
  ];

  const formatLastSynced = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Integrations</h1>
        <p className="text-gray-600">
          Connect your coding platforms to automatically sync your progress
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {platforms.map((platform, index) => (
          <div key={index} className="card">
            <div className="card-header">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{platform.icon}</div>
                  <div>
                    <h3 className="card-title">{platform.name}</h3>
                    <p className="card-description">{platform.description}</p>
                  </div>
                </div>
                <Badge variant={platform.isConnected ? 'success' : 'default'}>
                  {platform.isConnected ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <div className="card-content">
              {platform.isConnected ? (
                <div className="space-y-4">
                  {/* Connection Info */}
                  <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-success-800">
                          Connected as @{platform.handle}
                        </div>
                        <div className="text-xs text-success-600">
                          Last synced: {formatLastSynced(platform.lastSynced)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  {platform.stats && (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(platform.stats).map(([key, value]) => (
                        <div key={key} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-lg font-bold text-gray-900">{value}</div>
                          <div className="text-xs text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Configure
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger-600">
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Link2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Connect your {platform.name} account to start syncing
                    </p>
                  </div>
                  <Button className="w-full">
                    Connect {platform.name}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sync Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Sync Settings</h3>
          <p className="card-description">Configure how often your data is synchronized</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto Sync</div>
                <div className="text-sm text-gray-500">
                  Automatically sync data every 6 hours
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-500">
                  Get notified when sync completes or fails
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;