import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.email}</h1>
      <p className="text-gray-600">Select a section from the sidebar to get started.</p>
    </div>
  );
};