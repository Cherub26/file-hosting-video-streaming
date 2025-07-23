import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { FiDownload } from 'react-icons/fi';
import { formatDateTime, formatFileSize } from '../utils/format';

interface FileItem {
  id: number;
  public_id: string;
  original_name: string;
  blob_name: string;
  type: string;
  size: string;
  status: string;
  azure_url: string;
  visibility: string;
  created_at: string;
}

export default function FilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [file, setFile] = useState<FileItem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFile() {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`/api/file/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        let data = null;
        try {
          data = await res.json();
        } catch {}
        if (!res.ok || !data || !data.file) {
          setError(data?.error || 'File not found or you do not have access.');
          setLoading(false);
          return;
        }
        setFile(data.file);
      } catch {
        setError('Failed to fetch file.');
      }
      setLoading(false);
    }
    if (id && user?.token) fetchFile();
  }, [id, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center text-red-600 font-semibold">{error}</div>
    </div>
  );

  if (!file) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">{file.original_name}</h2>
        <div className="mb-4 text-gray-700">
          <div><span className="font-semibold">Uploaded:</span> {formatDateTime(file.created_at)}</div>
          <div><span className="font-semibold">Size:</span> {formatFileSize(file.size)}</div>
          <div><span className="font-semibold">Type:</span> {file.type}</div>
          <div><span className="font-semibold">Visibility:</span> {file.visibility}</div>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/download/${file.public_id}`, {
                headers: { Authorization: `Bearer ${user?.token}` },
              });
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