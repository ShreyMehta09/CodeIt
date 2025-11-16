import React, { useState } from 'react';
import { X, ExternalLink, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Button from '../UI/Button';

const PlatformConnectionModal = ({ 
  isOpen, 
  onClose, 
  platform, 
  onConnect,
  onVerify 
}) => {
  const [step, setStep] = useState(1); // 1: username input, 2: verification
  const [username, setUsername] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting to connect platform:', platform, 'with username:', username.trim());
      const result = await onConnect(platform, username.trim());
      console.log('Connection result:', result);
      setVerificationData(result);
      setStep(2);
    } catch (err) {
      console.error('Connection error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initiate connection';
      setError(`Connection failed: ${errorMessage}. Please ensure the server is running.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    setError('');

    try {
      await onVerify(platform, username);
      onClose();
      // Reset state for next use
      setStep(1);
      setUsername('');
      setVerificationData(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setStep(1);
    setUsername('');
    setVerificationData(null);
    setError('');
    setCopied(false);
  };

  const getPlatformInfo = () => {
    const platformInfo = {
      leetcode: {
        name: 'LeetCode',
        icon: '🟠',
        color: 'orange'
      },
      codeforces: {
        name: 'Codeforces',
        icon: '🔵',
        color: 'blue'
      },
      codechef: {
        name: 'CodeChef',
        icon: '🟤',
        color: 'amber'
      }
    };
    return platformInfo[platform] || { name: platform, icon: '📊', color: 'gray' };
  };

  const platformInfo = getPlatformInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{platformInfo.icon}</span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connect {platformInfo.name}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Enter your {platformInfo.name} username
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  We'll need to verify that you own this account by asking you to temporarily update your profile.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={`Enter your ${platformInfo.name} username`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    disabled={loading}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClose} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && verificationData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {verificationData.instructions?.title || 'Verify Your Profile'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Follow the steps below to verify your {platformInfo.name} account.
                </p>
              </div>

              {/* Verification Code */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Verification Code</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Copy this code to your profile</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600 text-sm font-mono dark:text-gray-200">
                      {verificationData.verificationCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(verificationData.verificationCode)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {verificationData.instructions && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Instructions:</h4>
                  <ol className="space-y-2">
                    {verificationData.instructions.steps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                      </li>
                    ))}
                  </ol>

                  {verificationData.instructions.profileUrl && (
                    <div className="mt-4">
                      <a
                        href={verificationData.instructions.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-800 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open your {platformInfo.name} profile</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Timer */}
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-md p-3">
                <p className="text-amber-800 dark:text-amber-400 text-sm">
                  ⏰ This verification code expires in {verificationData.expiresIn} minutes.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button onClick={handleVerification} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Connection'
                  )}
                </Button>
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </Button>
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformConnectionModal;