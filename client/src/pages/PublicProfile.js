import React from 'react';
import { useParams } from 'react-router-dom';

const PublicProfile = () => {
  const { username } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Public Profile: @{username}
          </h1>
          <p className="text-gray-600">
            This feature will show the public profile of the user.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;