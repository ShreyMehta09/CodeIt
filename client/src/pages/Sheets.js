import React from 'react';
import { Plus, FileText, Users, Lock } from 'lucide-react';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';

const Sheets = () => {
  // Mock data
  const sheets = [
    {
      id: 1,
      name: 'Striver A2Z DSA Sheet',
      description: 'Complete data structures and algorithms practice sheet',
      category: 'dsa',
      totalProblems: 450,
      solvedProblems: 120,
      isPublic: true,
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'LeetCode Top 100',
      description: 'Most frequently asked interview questions',
      category: 'interview',
      totalProblems: 100,
      solvedProblems: 45,
      isPublic: false,
      updatedAt: '2024-01-14T15:20:00Z'
    }
  ];

  const calculateProgress = (solved, total) => {
    if (total === 0) return 0;
    return Math.round((solved / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Problem Sheets</h1>
          <p className="text-gray-600">Organize your practice with custom problem collections</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Create Sheet
        </Button>
      </div>

      {/* Sheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sheets.map((sheet) => (
          <div key={sheet.id} className="card hover:shadow-md transition-shadow">
            <div className="card-header">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="card-title text-lg">{sheet.name}</h3>
                  <p className="card-description">{sheet.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {sheet.isPublic ? (
                    <Users className="w-4 h-4 text-success-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="card-content">
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {sheet.solvedProblems}/{sheet.totalProblems}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(sheet.solvedProblems, sheet.totalProblems)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {calculateProgress(sheet.solvedProblems, sheet.totalProblems)}% complete
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Badge variant="outline">{sheet.category}</Badge>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sheets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sheets yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first problem sheet to organize your practice.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Sheet
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sheets;