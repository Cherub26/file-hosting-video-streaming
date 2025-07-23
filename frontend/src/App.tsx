import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import MyFilesPage from './pages/MyFilesPage';
import MyVideosPage from './pages/MyVideosPage';
import HomePage from './pages/HomePage';
import FilePage from './pages/FilePage';
import { useAuth } from './providers/AuthProvider';
import DashboardNav from './components/DashboardNav';

function App() {
  const { user, logout } = useAuth();

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
        <Route path="/file/:id" element={user ? <FilePage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App; 