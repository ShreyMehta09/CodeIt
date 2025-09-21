import React, { useState, useEffect } from 'react';
import { Link2, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import PlatformConnectionModal from '../components/UI/PlatformConnectionModal';
import usePlatformConnection from '../hooks/usePlatformConnection';
import { formatDate } from '../utils/helpers';

const Integrations = () => {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const {
    loading: actionLoading,
    initiateConnection,
    verifyConnection,
    disconnectPlatform,
    getIntegrationStatus,
    syncPlatform
  } = usePlatformConnection();

  // Platform definitions
  const platformDefinitions = [
    {
      key: 'leetcode',
      name: 'LeetCode',
      description: 'Sync your LeetCode problems and statistics',
      icon: '🟠'
    },
    {
      key: 'codeforces',
      name: 'Codeforces',
      description: 'Import your Codeforces contest history and ratings',
      icon: '🔵'
    },
    {
      key: 'codechef',
      name: 'CodeChef',
      description: 'Track your CodeChef contest participation',
      icon: '🟤'
    }
  ];

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    setLoading(true);
    try {
      const status = await getIntegrationStatus();
      
      const updatedPlatforms = platformDefinitions.map(platform => ({
        ...platform,
        isConnected: status[platform.key]?.isConnected || false,
        handle: status[platform.key]?.handle || '',
        lastSynced: status[platform.key]?.lastSynced || null
      }));
      
      setPlatforms(updatedPlatforms);
    } catch (error) {
      console.error('Failed to load integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platformKey) => {
    setSelectedPlatform(platformKey);
    setIsModalOpen(true);
  };

  const handleDisconnect = async (platformKey) => {
    if (window.confirm(`Are you sure you want to disconnect ${platformKey}?`)) {
      try {
        await disconnectPlatform(platformKey);
        await loadIntegrationStatus(); // Refresh the status
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
  };

  const handleSync = async (platformKey, handle) => {
    try {
      await syncPlatform(platformKey, handle);
      await loadIntegrationStatus(); // Refresh the status
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleModalConnect = async (platform, username) => {
    return await initiateConnection(platform, username);
  };

  const handleModalVerify = async (platform, username) => {
    await verifyConnection(platform, username);
    await loadIntegrationStatus(); // Refresh the status
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Platform Integrations</h1>
        <p className="text-gray-600">
          Connect your coding platforms to automatically sync your progress
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <div key={platform.key} className="card">
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
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-800 font-medium">@{platform.handle}</p>
                        {platform.lastSynced && (
                          <p className="text-green-600 text-sm">
                            Last synced: {formatDate(platform.lastSynced)}
                          </p>
                        )}
                      </div>
                      <a
                        href={getPlatformUrl(platform.key, platform.handle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleSync(platform.key, platform.handle)}
                      disabled={actionLoading}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Now
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDisconnect(platform.key)}
                      disabled={actionLoading}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Link2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Connect your {platform.name} account to sync your coding progress
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => handleConnect(platform.key)}
                    disabled={actionLoading}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect {platform.name}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <h3 className="card-title">How Platform Integration Works</h3>
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                1
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Enter Username</h4>
              <p className="text-gray-600">Provide your username for the platform you want to connect.</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                2
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Verify Ownership</h4>
              <p className="text-gray-600">Temporarily add our verification code to your profile to prove ownership.</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                3
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Auto Sync</h4>
              <p className="text-gray-600">Your progress will be automatically synced and tracked.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Connection Modal */}
      <PlatformConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        platform={selectedPlatform}
        onConnect={handleModalConnect}
        onVerify={handleModalVerify}
      />
    </div>
  );
};

// Helper function to get platform URLs
const getPlatformUrl = (platform, handle) => {
  const urls = {
    leetcode: `https://leetcode.com/${handle}/`,
    codeforces: `https://codeforces.com/profile/${handle}`,
    codechef: `https://www.codechef.com/users/${handle}`
  };
  return urls[platform] || '#';
};

export default Integrations;