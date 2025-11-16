import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Share, Edit, Plus } from 'lucide-react';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';

const SheetDetail = () => {
  const { id } = useParams();

  // Mock data - in real app, fetch based on id
  const sheet = {
    id: 1,
    name: 'Striver A2Z DSA Sheet',
    description: 'Complete data structures and algorithms practice sheet covering all important topics',
    category: 'dsa',
    totalProblems: 450,
    solvedProblems: 120,
    isPublic: true,
    problems: [
      {
        id: 1,
        title: 'Two Sum',
        platform: 'leetcode',
        difficulty: 'easy',
        status: 'solved',
        tags: ['array', 'hash-table'],
        url: 'https://leetcode.com/problems/two-sum/'
      },
      {
        id: 2,
        title: 'Add Two Numbers',
        platform: 'leetcode',
        difficulty: 'medium',
        status: 'attempted',
        tags: ['linked-list', 'math'],
        url: 'https://leetcode.com/problems/add-two-numbers/'
      }
    ]
  };

  const calculateProgress = (solved, total) => {
    if (total === 0) return 0;
    return Math.round((solved / total) * 100);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sheets
        </Button>
      </div>

      {/* Sheet Info */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{sheet.name}</h1>
              <p className="text-gray-600 mb-4">{sheet.description}</p>
              
              <div className="flex items-center space-x-4 mb-4">
                <Badge variant="outline">{sheet.category}</Badge>
                <span className="text-sm text-gray-500">
                  {sheet.totalProblems} problems
                </span>
                <span className="text-sm text-gray-500">
                  {sheet.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              {/* Progress */}
              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {sheet.solvedProblems}/{sheet.totalProblems}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(sheet.solvedProblems, sheet.totalProblems)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {calculateProgress(sheet.solvedProblems, sheet.totalProblems)}% complete
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Problem
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Problems List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Problems</h2>
          <p className="card-description">
            {sheet.problems.length} problems in this sheet
          </p>
        </div>
        <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
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
                {sheet.problems.map((problem, index) => (
                  <tr key={problem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
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
                            {problem.platform}
                          </a>
                        </div>
                      </div>
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
                        {problem.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" size="sm">
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
    </div>
  );
};

export default SheetDetail;