import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';

const Problems = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // Mock data - in real app, this would come from API
  const problems = [
    {
      id: 1,
      title: 'Two Sum',
      platform: 'leetcode',
      difficulty: 'easy',
      status: 'solved',
      tags: ['array', 'hash-table'],
      url: 'https://leetcode.com/problems/two-sum/',
      solvedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      title: 'Add Two Numbers',
      platform: 'leetcode',
      difficulty: 'medium',
      status: 'attempted',
      tags: ['linked-list', 'math'],
      url: 'https://leetcode.com/problems/add-two-numbers/',
      lastAttemptAt: '2024-01-14T15:20:00Z'
    },
    {
      id: 3,
      title: 'Longest Substring Without Repeating Characters',
      platform: 'leetcode',
      difficulty: 'medium',
      status: 'todo',
      tags: ['string', 'sliding-window'],
      url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/'
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'solved', label: 'Solved' },
    { value: 'attempted', label: 'Attempted' },
    { value: 'todo', label: 'To Do' },
    { value: 'review', label: 'Review' }
  ];

  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'leetcode', label: 'LeetCode' },
    { value: 'codeforces', label: 'Codeforces' },
    { value: 'codechef', label: 'CodeChef' },
    { value: 'atcoder', label: 'AtCoder' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      solved: 'success',
      attempted: 'warning',
      todo: 'default',
      review: 'primary'
    };
    return colors[status] || 'default';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'success',
      medium: 'warning',
      hard: 'danger'
    };
    return colors[difficulty] || 'default';
  };

  const getPlatformColor = (platform) => {
    const colors = {
      leetcode: 'warning',
      codeforces: 'primary',
      codechef: 'success',
      atcoder: 'danger'
    };
    return colors[platform] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Problems</h1>
          <p className="text-gray-600">Track and manage your coding problems</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Problem
        </Button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input"
            >
              {difficultyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="input"
            >
              {platformOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Problems List */}
      <div className="card">
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {problem.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          <a 
                            href={problem.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            View Problem
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getPlatformColor(problem.platform)}>
                        {problem.platform}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(problem.status)}>
                        {problem.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {problems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first problem or adjusting your filters.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Problem
          </Button>
        </div>
      )}
    </div>
  );
};

export default Problems;