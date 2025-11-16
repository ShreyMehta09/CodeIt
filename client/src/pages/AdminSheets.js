import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import api from '../utils/api';

const AdminSheets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sheets, setSheets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom'
  });

  useEffect(() => {
    if (!user || user.username !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchGlobalSheets();
  }, [user, navigate]);

  const fetchGlobalSheets = async () => {
    try {
      const response = await api.get('/admin/sheets');
      setSheets(response.data);
    } catch (error) {
      console.error('Error fetching sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/sheets', formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', category: 'custom' });
      fetchGlobalSheets();
    } catch (error) {
      console.error('Error creating sheet:', error);
    }
  };

  const handleDeleteSheet = async (sheetId) => {
    if (window.confirm('Are you sure you want to delete this sheet?')) {
      try {
        await api.delete(`/admin/sheets/${sheetId}`);
        fetchGlobalSheets();
      } catch (error) {
        console.error('Error deleting sheet:', error);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Manage Global Sheets
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Create and manage problem sheets visible to all users
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Create New Sheet
            </button>
          </div>
        </div>

        {/* Sheets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheets.map((sheet) => (
            <div key={sheet._id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {sheet.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Global
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {sheet.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{sheet.problems?.length || 0} problems</span>
                  <span className="capitalize">{sheet.category}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/admin/sheets/${sheet._id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSheet(sheet._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-md transition duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sheets.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No global sheets</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new global sheet.</p>
          </div>
        )}

        {/* Create Sheet Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Create New Global Sheet
                </h3>
                <form onSubmit={handleCreateSheet}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sheet Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows="3"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="dsa">Data Structures & Algorithms</option>
                      <option value="algorithms">Algorithms</option>
                      <option value="data-structures">Data Structures</option>
                      <option value="dynamic-programming">Dynamic Programming</option>
                      <option value="graphs">Graphs</option>
                      <option value="trees">Trees</option>
                      <option value="arrays">Arrays</option>
                      <option value="strings">Strings</option>
                      <option value="math">Mathematics</option>
                      <option value="greedy">Greedy</option>
                      <option value="backtracking">Backtracking</option>
                      <option value="contest">Contest</option>
                      <option value="interview">Interview Preparation</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSheets;