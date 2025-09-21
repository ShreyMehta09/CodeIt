import React from 'react';
import { useQuery } from 'react-query';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award,
  Code2,
  Clock,
  BarChart3,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Badge from '../components/UI/Badge';
import { formatRelativeTime, getDifficultyColor, getPlatformColor } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery(
    'dashboard',
    async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentActivity = dashboardData?.recentActivity || [];
  const streakData = dashboardData?.streakData || [];

  const statCards = [
    {
      title: 'Problems Solved',
      value: stats.solvedCount || 0,
      change: `+${stats.weeklyProgress || 0} this week`,
      icon: Code2,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Current Streak',
      value: user?.stats?.currentStreak || 0,
      change: `Max: ${user?.stats?.maxStreak || 0} days`,
      icon: Target,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Easy Problems',
      value: stats.difficultyBreakdown?.easy || 0,
      change: 'Difficulty: Easy',
      icon: Award,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Hard Problems',
      value: stats.difficultyBreakdown?.hard || 0,
      change: 'Difficulty: Hard',
      icon: TrendingUp,
      color: 'text-danger-600',
      bgColor: 'bg-danger-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to continue your competitive programming journey?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-description">Your latest solved problems</p>
            </div>
            <div className="card-content">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={getPlatformColor(activity.platform)}
                            >
                              {activity.platform}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={getDifficultyColor(activity.difficulty)}
                            >
                              {activity.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatRelativeTime(activity.solvedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400">Start solving problems to see your activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <a
                  href="/problems"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Code2 className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium">Add Problem</span>
                </a>
                <a
                  href="/sheets"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium">Create Sheet</span>
                </a>
                <a
                  href="/integrations"
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="font-medium">Sync Platforms</span>
                </a>
              </div>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Platform Breakdown</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {Object.entries(stats.platformBreakdown || {}).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={getPlatformColor(platform)}
                      >
                        {platform}
                      </Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.platformBreakdown || {}).length === 0 && (
                  <p className="text-gray-500 text-sm">No platform data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Tags */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Tags</h3>
            </div>
            <div className="card-content">
              <div className="space-y-2">
                {(stats.topTags || []).slice(0, 5).map((tag, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Badge variant="outline">{tag._id}</Badge>
                    <span className="text-sm text-gray-600">{tag.count}</span>
                  </div>
                ))}
                {(!stats.topTags || stats.topTags.length === 0) && (
                  <p className="text-gray-500 text-sm">No tags data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;