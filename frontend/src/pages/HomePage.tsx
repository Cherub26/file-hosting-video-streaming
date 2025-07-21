import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl text-center p-10 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome to File Hosting & Video Streaming</h1>
        <p className="text-lg text-gray-700 mb-8">
          Effortlessly upload, store, and share your files and videos. Enjoy secure access, public/private sharing, and instant streaming—all in a modern, easy-to-use interface.
        </p>
        <ul className="text-left inline-block mx-auto mb-8 p-0 list-none text-base text-gray-800">
          <li>• Fast and secure file uploads</li>
          <li>• Public and private file sharing</li>
          <li>• Stream videos directly from the cloud</li>
          <li>• Simple, clean interface</li>
        </ul>
        {user ? (
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/upload" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Upload</Link>
            <Link to="/my-files" className="bg-gray-100 text-blue-600 px-8 py-3 rounded-lg font-semibold border border-blue-600 hover:bg-blue-50 transition">My Files</Link>
          </div>
        ) : (
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/login" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Login</Link>
            <Link to="/register" className="bg-gray-100 text-blue-600 px-8 py-3 rounded-lg font-semibold border border-blue-600 hover:bg-blue-50 transition">Register</Link>
          </div>
        )}
      </div>
    </div>
  );
} 