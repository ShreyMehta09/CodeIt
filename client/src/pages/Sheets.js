import React, { useState, useEffect } from 'react';
import { Plus, FileText, Users, Lock, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import api from '../utils/api';

const Sheets = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'my', 'global'

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      // For now, we'll use mock data but structure it for real API calls
      const mockGlobalSheets = [
        {
          _id: 'global1',
          name: 'Striver A2Z DSA Sheet',
          description: 'Complete data structures and algorithms practice sheet',
          category: 'dsa',
          problems: new Array(450).fill({}),
          solvedProblems: 120,
          isPublic: true,
          isGlobal: true,
          type: 'global',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: 'global2',
          name: 'LeetCode Top Interview Questions',
          description: 'Most frequently asked interview questions from top companies',
          category: 'interview',
          problems: new Array(100).fill({}),
          solvedProblems: 0,
          isPublic: true,
          isGlobal: true,
          type: 'global',
          updatedAt: '2024-01-14T15:20:00Z'
        }
      ];

      const mockUserSheets = [
        {
          _id: 'user1',
          name: 'My Custom Sheet',
          description: 'Personal collection of favorite problems',
          category: 'custom',
          problems: new Array(25).fill({}),
          solvedProblems: 15,
          isPublic: false,
          isGlobal: false,
          type: 'user',
          updatedAt: '2024-01-13T12:00:00Z'
        }
      ];

      setSheets([...mockGlobalSheets, ...mockUserSheets]);
    } catch (error) {
      console.error('Error fetching sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSheets = sheets.filter(sheet => {
    if (filter === 'my') return sheet.type === 'user';
    if (filter === 'global') return sheet.type === 'global';
    return true; // 'all'
  });

  const calculateProgress = (solved, total) => {
    if (total === 0) return 0;
    return Math.round((solved / total) * 100);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Problem Sheets</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize your practice with custom problem collections</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Create Sheet
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            All Sheets
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'my'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            My Sheets
          </button>
          <button
            onClick={() => setFilter('global')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'global'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Global Sheets
          </button>
        </nav>
      </div>

      {/* Sheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSheets.map((sheet) => (
          <div key={sheet._id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{sheet.name}</h3>
                    {sheet.type === 'global' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Globe className="w-3 h-3 mr-1" />
                        Global
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{sheet.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {sheet.isPublic ? (
                    <Users className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sheet.solvedProblems || 0}/{sheet.problems?.length || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(sheet.solvedProblems || 0, sheet.problems?.length || 0)}%` }}
                    />
                  </div>
                </div>

                {/* Category and Stats */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="capitalize">
                    {sheet.category}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <FileText className="w-3 h-3 mr-1" />
                    {sheet.problems?.length || 0} problems
                  </div>
                </div>

                {/* Updated date */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Updated {new Date(sheet.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Action button */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.location.href = `/sheets/${sheet._id}`}
                >
                  View Sheet
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredSheets.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {filter === 'my' ? 'No personal sheets' : filter === 'global' ? 'No global sheets' : 'No sheets found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filter === 'my' ? 'Get started by creating your first sheet.' : 'Check back later for new content.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Sheets;