import React from 'react';
import { Edit, Share, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import { getAvatarUrl, formatDate } from '../utils/helpers';

const Profile = () => {
  const { user } = useAuth();

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {user.stats?.totalSolved || 0}
              </div>
              <div className="text-sm text-gray-600">Problems Solved</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {user.stats?.currentStreak || 0}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {user.stats?.maxStreak || 0}
              </div>
              <div className="text-sm text-gray-600">Max Streak</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {user.badges?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Badges Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Difficulty Breakdown</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-success-600">
                {user.stats?.solvedByDifficulty?.easy || 0}
              </div>
              <div className="text-sm text-gray-600">Easy</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-warning-600">
                {user.stats?.solvedByDifficulty?.medium || 0}
              </div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-danger-600">
                {user.stats?.solvedByDifficulty?.hard || 0}
              </div>
              <div className="text-sm text-gray-600">Hard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Connections */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Platform Connections</h2>
          <p className="card-description">Your connected coding platforms</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(user.platforms || {}).map(([platform, data]) => (
              <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${data.isConnected ? 'bg-success-500' : 'bg-gray-300'}`} />
                  <div>
                    <div className="font-medium capitalize">{platform}</div>
                    {data.handle && (
                      <div className="text-sm text-gray-500">@{data.handle}</div>
                    )}
                  </div>
                </div>
                <Badge variant={data.isConnected ? 'success' : 'default'}>
                  {data.isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            ))}
          </div>
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