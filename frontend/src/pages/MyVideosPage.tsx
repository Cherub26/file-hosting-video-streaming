import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { FiDownload, FiPlay } from 'react-icons/fi';
import { formatDateTime, formatFileSize } from '../utils/format';

interface VideoItem {
  id: number;
  public_id: string;
  title: string;
  type: string;
  azure_url?: string;
  thumb_url?: string;
  size?: string;
  status: string;
  created_at: string;
  tenant?: { name: string };
}

export default function MyVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchVideos() {
      setError('');
      try {
        const res = await fetch('/api/my-videos', {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        let data = null;
        try {
          data = await res.json();
        } catch {}
        if (!res.ok) {
          setError(data?.error || 'Failed to fetch videos. Please try again.');
          return;
        }
        if (!data || !data.videos) {
          setError('Failed to fetch videos. Please try again.');
          return;
        }
        setVideos(data.videos);
      } catch (err: any) {
        setError('Failed to fetch videos. Please try again.');
      }
    }
    fetchVideos();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 px-8 pt-8">
      <div className="w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">Tenant Videos</h2>
        {error && <div className="bg-red-100 text-red-700 border border-red-300 rounded px-4 py-2 mb-4 text-center text-sm">{error}</div>}
        {videos.length === 0 ? (
          <div className="text-gray-500">No videos uploaded in your tenant yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow text-left text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[220px]">Title</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px]">Tenant</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px]">Format</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[180px]">Uploaded</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px] whitespace-nowrap">Size</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(video => (
                  <tr key={video.public_id} className="even:bg-gray-50">
                    <td className="py-2 px-6 min-w-[220px]">
                      <Link 
                        to={`/video/${video.public_id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        {video.title}
                      </Link>
                    </td>
                    <td className="py-2 px-6 min-w-[120px]">{video.tenant?.name || 'Unknown'}</td>
                    <td className="py-2 px-6 min-w-[120px] whitespace-nowrap">{video.type?.split('/')[1] || '-'}</td>
                    <td className="py-2 px-6 min-w-[180px]">{formatDateTime((video as any).created_at)}</td>
                    <td className="py-2 px-6 min-w-[120px] whitespace-nowrap">{video.size ? formatFileSize(video.size) : '-'}</td>
                    <td className="py-2 px-6 min-w-[120px] whitespace-nowrap">
                      <div className="flex gap-2">
                        <Link
                          to={`/video/${video.public_id}`}
                          className="text-green-600 hover:text-green-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-green-300"
                          title="Play video"
                        >
                          <FiPlay size={20} />
                        </Link>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/download-video/${video.public_id}`, {
                                headers: { Authorization: `Bearer ${user?.token}` },
                              });
                              if (!res.ok) {
                                alert('Failed to download video.');
                                return;
                              }
                              const blob = await res.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = video.title;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            } catch {
                              alert('Failed to download video.');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                          title="Download video"
                        >
                          <FiDownload size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 