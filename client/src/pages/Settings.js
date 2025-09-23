import React, { useState, useEffect, useCallback } from 'react';
import { User, Bell, Shield, Palette, Link, Save, Globe, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import DebugSettings from '../components/DebugSettings';
import api from '../utils/api';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: ''
  });
  
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    linkedin: '',
    github: '',
    portfolio: '',
    blog: ''
  });
  
  const [notifications, setNotifications] = useState({
    general: true,
    weeklyReports: true,
    platformUpdates: true,
    achievements: true,
    reminders: false
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showStats: true,
    showBadges: true,
    showSocialLinks: true
  });

  const [themePreference, setThemePreference] = useState('auto');

  // Load settings on component mount
  const fetchSettings = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping settings fetch');
      return;
    }
    
    try {
      console.log('Fetching settings for user:', user.id);
      
      const response = await api.get('/settings');
      console.log('Settings response received, status:', response.status);
      
      const data = response.data;
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      // Set profile data with fallbacks
      setProfileData({
        name: data.profile?.name || user.name || '',
        username: data.profile?.username || user.username || '',
        bio: data.profile?.bio || '',
        location: data.profile?.location || '',
        website: data.profile?.website || ''
      });
      
      // Set social links with fallbacks
      setSocialLinks({
        twitter: data.socialLinks?.twitter || '',
        linkedin: data.socialLinks?.linkedin || '',
        github: data.socialLinks?.github || '',
        portfolio: data.socialLinks?.portfolio || '',
        blog: data.socialLinks?.blog || ''
      });
      
      // Set notifications with fallbacks
      setNotifications({
        general: data.settings?.emailNotifications?.general ?? true,
        weeklyReports: data.settings?.emailNotifications?.weeklyReports ?? true,
        platformUpdates: data.settings?.emailNotifications?.platformUpdates ?? true,
        achievements: data.settings?.emailNotifications?.achievements ?? true,
        reminders: data.settings?.emailNotifications?.reminders ?? false
      });
      
      // Set privacy with fallbacks
      setPrivacy({
        profileVisibility: data.settings?.privacy?.profileVisibility || 'public',
        showStats: data.settings?.privacy?.showStats ?? true,
        showBadges: data.settings?.privacy?.showBadges ?? true,
        showSocialLinks: data.settings?.privacy?.showSocialLinks ?? true
      });
      
      setThemePreference(data.settings?.theme || 'auto');
      
      console.log('Settings loaded successfully');
      setError(null);
      setRetryCount(0);
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      
      // More specific error handling
      let errorMessage = 'Failed to load settings';
      
      if (error.response) {
        const status = error.response.status;
        console.error('Response status:', status, 'Data:', error.response.data);
        
        switch (status) {
          case 401:
            errorMessage = 'Session expired. Please log in again.';
            // Don't set error state for 401, let auth context handle it
            return;
          case 403:
            errorMessage = 'Access denied. Please check your permissions.';
            break;
          case 404:
            errorMessage = 'Settings not found. Creating default settings...';
            // Try to initialize with default values
            setProfileData({
              name: user?.name || '',
              username: user?.username || '',
              bio: '',
              location: '',
              website: ''
            });
            return;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.response.data?.message || 'Server error occurred';
        }
      } else if (error.request) {
        console.error('Network error - no response received');
        errorMessage = 'Network error. Check your internet connection.';
      } else {
        console.error('Request setup error:', error.message);
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Auto-retry for network errors (max 2 retries)
      if (retryCount < 2 && (error.code === 'NETWORK_ERROR' || !error.response)) {
        console.log(`Auto-retrying in 2 seconds... (attempt ${retryCount + 1}/2)`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchSettings();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user ID to prevent infinite loops

  const retryFetchSettings = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError(null);
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      if (user && isMounted) {
        await fetchSettings();
      } else if (!user) {
        setLoading(false);
      }
    };
    
    loadSettings();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [fetchSettings, user]);
  
  // Reset error state when user changes
  useEffect(() => {
    setError(null);
    setRetryCount(0);
  }, [user?.id]);

  const updateSettings = async (endpoint, data, stateKey) => {
    // Prevent multiple simultaneous requests
    if (saving[stateKey]) {
      console.log(`Already saving ${stateKey}, skipping request`);
      return;
    }
    
    setSaving(prev => ({ ...prev, [stateKey]: true }));
    
    try {
      console.log(`Updating ${endpoint} with data:`, data);
      
      // Validate data before sending
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }
      
      const response = await api.put(`/settings/${endpoint}`, data);
      
      if (response.status === 200) {
        console.log(`${endpoint} updated successfully:`, response.data);
        
        // Show success message
        alert('Settings updated successfully!');
        
        // Refresh settings only if needed
        if (endpoint === 'profile') {
          await fetchSettings();
        }
        
        return { success: true, data: response.data };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error);
      
      let errorMessage = `Failed to update ${endpoint}`;
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        
        switch (status) {
          case 400:
            errorMessage = message || 'Invalid data provided';
            break;
          case 401:
            errorMessage = 'Session expired. Please log in again.';
            break;
          case 409:
            errorMessage = message || 'Conflict with existing data';
            break;
          case 500:
            errorMessage = 'Server error. Please try again.';
            break;
          default:
            errorMessage = message || `Server returned error ${status}`;
        }
        
        console.error('Response status:', status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        errorMessage = 'Network error. Check your connection.';
        console.error('Network error - no response received');
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      // Show user-friendly error
      alert(`Update failed: ${errorMessage}`);
      
      return { success: false, error: errorMessage };
    } finally {
      setSaving(prev => ({ ...prev, [stateKey]: false }));
    }
  };

  const handleProfileUpdate = () => {
    updateSettings('profile', profileData, 'profile');
  };

  const handleSocialLinksUpdate = () => {
    updateSettings('social-links', socialLinks, 'socialLinks');
  };

  const handleNotificationsUpdate = () => {
    updateSettings('notifications', { emailNotifications: notifications }, 'notifications');
  };

  const handlePrivacyUpdate = () => {
    updateSettings('privacy', privacy, 'privacy');
  };

  const handleThemeUpdate = async (newTheme) => {
    setThemePreference(newTheme);
    await setTheme(newTheme);
    
    // Also save to backend
    try {
      await api.put('/settings/theme', { theme: newTheme });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access your settings.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Error Display */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Failed to Load Settings
              </h3>
            </div>
          </div>
          <div className="text-sm text-red-700 dark:text-red-300 mb-4">
            {error}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={retryFetchSettings}
              className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
              Retry Loading Settings
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>

        {/* Debug Component for troubleshooting */}
        <DebugSettings />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'social', label: 'Social Links', icon: Link },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* Temporary Debug Component */}
      <DebugSettings />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Profile Information</h3>
              <p className="card-description">Update your personal information and profile details</p>
            </div>
            <div className="card-content space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Your location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleProfileUpdate}
                  disabled={saving.profile}
                  className="flex items-center space-x-2"
                >
                  {saving.profile ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  <span>Save Profile</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Social Links */}
        {activeTab === 'social' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Social Links</h3>
              <p className="card-description">Add your social media profiles and portfolio links</p>
            </div>
            <div className="card-content space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={socialLinks.twitter || ''}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={socialLinks.linkedin || ''}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={socialLinks.github || ''}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Portfolio
                  </label>
                  <input
                    type="url"
                    value={socialLinks.portfolio || ''}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, portfolio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blog
                  </label>
                  <input
                    type="url"
                    value={socialLinks.blog || ''}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, blog: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://yourblog.com"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleSocialLinksUpdate}
                  disabled={saving.socialLinks}
                  className="flex items-center space-x-2"
                >
                  {saving.socialLinks ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  <span>Save Social Links</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Privacy & Visibility</h3>
              <p className="card-description">Control who can see your profile and activity</p>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Visibility
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', description: 'Anyone can view your profile', icon: Globe },
                    { value: 'private', label: 'Private', description: 'Only you can view your profile', icon: Lock }
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value={option.value}
                          checked={privacy.profileVisibility === option.value}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Display Options</h4>
                {[
                  { key: 'showStats', label: 'Show Statistics', description: 'Display your coding statistics on your profile' },
                  { key: 'showBadges', label: 'Show Badges', description: 'Display your achievements and badges' },
                  { key: 'showSocialLinks', label: 'Show Social Links', description: 'Display your social media links' }
                ].map((option) => (
                  <label key={option.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-600">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrivacy(prev => ({ ...prev, [option.key]: !prev[option.key] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacy[option.key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacy[option.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handlePrivacyUpdate}
                  disabled={saving.privacy}
                  className="flex items-center space-x-2"
                >
                  {saving.privacy ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  <span>Save Privacy Settings</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Email Notifications</h3>
              <p className="card-description">Choose what notifications you want to receive</p>
            </div>
            <div className="card-content space-y-4">
              {[
                { key: 'general', label: 'General Updates', description: 'Product updates and announcements' },
                { key: 'weeklyReports', label: 'Weekly Reports', description: 'Weekly summary of your coding activity' },
                { key: 'platformUpdates', label: 'Platform Updates', description: 'Updates about connected platforms' },
                { key: 'achievements', label: 'Achievements', description: 'Notifications when you earn badges or reach milestones' },
                { key: 'reminders', label: 'Coding Reminders', description: 'Gentle reminders to keep your coding streak alive' }
              ].map((option) => (
                <label key={option.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg dark:border-gray-600">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications(prev => ({ ...prev, [option.key]: !prev[option.key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[option.key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[option.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              ))}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleNotificationsUpdate}
                  disabled={saving.notifications}
                  className="flex items-center space-x-2"
                >
                  {saving.notifications ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  <span>Save Notification Settings</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Theme Preferences</h3>
              <p className="card-description">Customize how the app looks and feels</p>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme Selection
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', description: 'Light theme' },
                    { value: 'dark', label: 'Dark', description: 'Dark theme' },
                    { value: 'auto', label: 'Auto', description: 'Follows system preference' }
                  ].map((option) => (
                    <label key={option.value} className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={themePreference === option.value}
                        onChange={(e) => handleThemeUpdate(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-8 rounded mb-2 ${
                        option.value === 'light' ? 'bg-white border border-gray-300' :
                        option.value === 'dark' ? 'bg-gray-800' :
                        'bg-gradient-to-r from-white via-gray-200 to-gray-800'
                      }`} />
                      <div className={`font-medium ${themePreference === option.value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {option.description}
                      </div>
                      {themePreference === option.value && (
                        <div className="absolute inset-0 border-2 border-primary-600 dark:border-primary-400 rounded-lg pointer-events-none" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;