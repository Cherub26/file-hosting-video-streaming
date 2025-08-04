import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { FiArrowLeft, FiDownload, FiEye, FiEyeOff } from 'react-icons/fi';
import { formatDateTime, formatFileSize } from '../utils/format';
import AuthenticatedImage from '../components/AuthenticatedImage';
import AuthenticatedVideo from '../components/AuthenticatedVideo';

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

export default function VideoPlayerPage() {
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
        const headers: any = {};
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
      const headers: any = {};
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

  const handleBack = () => {
    navigate(`/video/${video?.public_id}`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft size={20} />
                Back to Video Details
              </button>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-sm">
                {video.title}
              </h1>
              <div className="flex items-center gap-2">
                {video.visibility === 'public' ? (
                  <FiEye className="text-green-600" size={18} />
                ) : (
                  <FiEyeOff className="text-orange-600" size={18} />
                )}
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  video.visibility === 'public' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {video.visibility === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
              >
                <FiDownload size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black rounded-lg shadow-lg overflow-hidden">
          {video.azure_url ? (
            <AuthenticatedVideo 
              src={`/api/serve-video/${video.public_id}`}
              className="w-full max-h-[70vh] object-contain"
              controls={true}
              fallback={
                <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-xl">Video not available for playback</p>
                  </div>
                </div>
              }
            />
          ) : (
            <div className="w-full h-96 bg-gray-800 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-xl">Video not available for playback</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Video Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div><span className="font-semibold">Title:</span> {video.title}</div>
            <div><span className="font-semibold">Uploaded:</span> {formatDateTime(video.created_at)}</div>
            {video.size && <div><span className="font-semibold">Size:</span> {formatFileSize(video.size)}</div>}
            <div><span className="font-semibold">Type:</span> {video.type}</div>
  
          </div>
        </div>
      </div>
    </div>
  );
} 