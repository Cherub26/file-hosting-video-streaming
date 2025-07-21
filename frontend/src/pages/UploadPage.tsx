import React, { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!file) return setError('No file selected');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('visibility', visibility);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess('Upload successful!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">Upload File</h2>
        {error && <div className="bg-red-100 text-red-700 border border-red-300 rounded px-4 py-2 mb-4 text-center text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 border border-green-300 rounded px-4 py-2 mb-4 text-center text-sm">{success}</div>}
        <input type="file" accept="video/*,image/*" onChange={e => setFile(e.target.files?.[0] || null)} required className="w-full mb-4 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50" />
        <select value={visibility} onChange={e => setVisibility(e.target.value as 'public' | 'private')} className="w-full mb-4 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50">
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white font-semibold text-lg py-3 rounded hover:bg-blue-700 transition" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
      </form>
    </div>
  );
} 