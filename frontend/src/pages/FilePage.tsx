import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { FiDownload, FiEye, FiEyeOff } from 'react-icons/fi';
import { formatDateTime, formatFileSize } from '../utils/format';
import type { FetchHeaders } from '../types';

interface FileItem {
  id: number;
  public_id: string;
  original_name: string;
  blob_name: string;
  type: string;
  size: string;
  visibility: string;
  azure_url: string;
  created_at: string;
}

export default function FilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [file, setFile] = useState<FileItem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    let isMounted = true;
    
    async function fetchFile() {
      setError('');
      setLoading(true);
      try {
        // Try to fetch file, with authorization header if user is logged in
        const headers: FetchHeaders = {};
        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`;
        }
        
        const res = await fetch(`/api/file/${id}`, { headers });
        
        let data = null;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
        }
        
        if (!res.ok || !data || !data.file) {
          if (isMounted) {
            setError(data?.error || 'File not found or you do not have access.');
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setFile(data.file);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (isMounted) {
          setError('Failed to fetch file.');
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchFile();
    }
    
    return () => {
      isMounted = false;
    };
  }, [id, user]);



  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-red-600 font-semibold mb-4">{error}</div>
        {!user && (
          <div className="text-gray-600 text-sm">
            This file may be private. <Link to="/login" className="text-blue-600 hover:underline">Login</Link> to access it.
          </div>
        )}
      </div>
    </div>
  );

  if (!file) {
    console.log('No file data, returning null');
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">No file data</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-4 break-words">{file.original_name}</h2>
        
        <div className="mb-6 text-gray-700 space-y-2">
          <div><span className="font-semibold">Uploaded:</span> {formatDateTime(file.created_at)}</div>
          <div><span className="font-semibold">Size:</span> {formatFileSize(file.size)}</div>
          <div><span className="font-semibold">Type:</span> {file.type}</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Visibility:</span>
            <div className="flex items-center gap-2">
              {file.visibility === 'public' ? (
                <FiEye className="text-green-600" size={16} />
              ) : (
                <FiEyeOff className="text-orange-600" size={16} />
              )}
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                file.visibility === 'public' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {file.visibility === 'public' ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {file.visibility === 'public' ? 'Anyone can access this file' : 'Only tenant members can access this file'}
          </div>
        </div>
        
        <button
          onClick={async () => {
            try {
              const headers: FetchHeaders = {};
              if (user?.token) {
                headers.Authorization = `Bearer ${user.token}`;
              }
              
              const res = await fetch(`/api/download/${file.public_id}`, { headers });
              if (!res.ok) {
                alert('Failed to download file.');
                return;
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.original_name;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch {
              alert('Failed to download file.');
            }
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <FiDownload size={20} /> Download
        </button>
      </div>
    </div>
  );
} 