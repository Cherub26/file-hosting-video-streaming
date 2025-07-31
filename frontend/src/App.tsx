import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import MyFilesPage from './pages/MyFilesPage';
import MyVideosPage from './pages/MyVideosPage';
import TenantsPage from './pages/TenantsPage';
import HomePage from './pages/HomePage';
import FilePage from './pages/FilePage';
import VideoPage from './pages/VideoPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import { useAuth } from './providers/AuthProvider';
import DashboardNav from './components/DashboardNav';

function App() {
  const { user, loading, logout } = useAuth();



  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/upload" element={user ? <UploadPage /> : <Navigate to="/login" />} />
        <Route path="/my-files" element={user ? <MyFilesPage /> : <Navigate to="/login" />} />
        <Route path="/my-videos" element={user ? <MyVideosPage /> : <Navigate to="/login" />} />
        <Route path="/tenants" element={user ? <TenantsPage /> : <Navigate to="/login" />} />
        <Route path="/file/:id" element={user ? <FilePage /> : <Navigate to="/login" />} />
        <Route path="/video/:id" element={user ? <VideoPage /> : <Navigate to="/login" />} />
        <Route path="/video/:id/play" element={user ? <VideoPlayerPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App; 