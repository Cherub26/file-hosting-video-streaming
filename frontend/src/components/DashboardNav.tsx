import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export default function DashboardNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <nav className="dashboard-nav flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Home logo on the left */}
      <div className="flex items-center gap-2">
        <Link to="/" aria-label="Home" className="flex items-center text-decoration-none">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 11.5L12 4L21 11.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 10.5V20H19V10.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-blue-600 font-bold text-xl ml-1">Home</span>
        </Link>
      </div>
      {/* Center navigation (if logged in) */}
      <div className="flex items-center gap-6">
        {user && (
          <>
            <Link to="/upload" className="text-blue-600 font-medium hover:underline">Upload</Link>
            <Link to="/my-files" className="text-blue-600 font-medium hover:underline hidden md:inline">My Files</Link>
          </>
        )}
      </div>
      {/* Right side: User dropdown */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-blue-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 select-none"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={open}
            >
              {user.username}
              <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-blue-600 rounded-xl shadow-lg z-50 py-2 animate-fade-in border border-blue-100" style={{ minWidth: '12rem' }}>
                <Link to="/my-files" className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 transition text-base hover:text-blue-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  My Files
                </Link>
                <button
                  onClick={() => { setOpen(false); logout(); navigate('/login'); }}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition w-full text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 