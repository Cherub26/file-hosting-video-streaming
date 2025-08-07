import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { FiDownload, FiPlay, FiEye, FiEyeOff } from 'react-icons/fi';
import { formatDateTime, formatFileSize } from '../utils/format';
import AuthenticatedImage from '../components/AuthenticatedImage';
import type { FetchHeaders } from '../types';

interface VideoItem {
  id: number;
  public_id: string;
  title: string;
  type: string;
  size?: string;
  visibility: string;
  azure_url?: string;
  thumb_url?: string;
  created_at: string;
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchVideo() {
      setError('');
      setLoading(true);
      try {
        // Try to fetch video, with authorization header if user is logged in
        const headers: FetchHeaders = {};
        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`;
        }
        
        const res = await fetch(`/api/video/${id}`, { headers });
        
        let data = null;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
        }
        
        if (!res.ok || !data || !data.video) {
          if (isMounted) {
            setError(data?.error || 'Video not found or you do not have access.');
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setVideo(data.video);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (isMounted) {
          setError('Failed to fetch video.');
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchVideo();
    }
    
    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleDownload = async () => {
    try {
      const headers: FetchHeaders = {};
      if (user?.token) {
        headers.Authorization = `Bearer ${user.token}`;
      }
      
      const res = await fetch(`/api/download-video/${video?.public_id}`, { headers });
      if (!res.ok) {
        alert('Failed to download video.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = video?.title || 'video';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download video.');
    }
  };

  const handlePlay = () => {
    navigate(`/video/${video?.public_id}/play`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-red-600 font-semibold mb-4">{error}</div>
        {!user && (
          <div className="text-gray-600 text-sm">
            This video may be private. <Link to="/login" className="text-blue-600 hover:underline">Login</Link> to access it.
          </div>
        )}
      </div>
    </div>
  );

  if (!video) {
    console.log('No video data, returning null');
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">No video data</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-4 break-words">{video.title}</h2>
        
        {/* Video Thumbnail */}
        <div className="mb-6">
          {video.thumb_url ? (
            <AuthenticatedImage 
              src={`/api/serve-video-thumbnail/${video.public_id}`}
              alt={video.title}
              className="w-full max-h-96 object-contain rounded-lg shadow-md"
              fallback={
                <div className="w-full h-64 bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                  <FiPlay size={48} className="text-gray-500" />
                </div>
              }
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
              <FiPlay size={48} className="text-gray-500" />
            </div>
          )}
        </div>

        {/* Video Metadata */}
        <div className="mb-6 text-gray-700 space-y-2">
          <div><span className="font-semibold">Uploaded:</span> {formatDateTime(video.created_at)}</div>
          {video.size && <div><span className="font-semibold">Size:</span> {formatFileSize(video.size)}</div>}
          <div><span className="font-semibold">Type:</span> {video.type}</div>

          <div className="flex items-center gap-2">
            <span className="font-semibold">Visibility:</span>
            <div className="flex items-center gap-2">
              {video.visibility === 'public' ? (
                <FiEye className="text-green-600" size={16} />
              ) : (
                <FiEyeOff className="text-orange-600" size={16} />
              )}
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                video.visibility === 'public' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {video.visibility === 'public' ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {video.visibility === 'public' ? 'Anyone can access this video' : 'Only tenant members can access this video'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
          >
            <FiPlay size={20} /> Play Video
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
          >
            <FiDownload size={20} /> Download
          </button>
        </div>
      </div>
    </div>
  );
} 