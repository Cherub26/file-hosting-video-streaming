import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

interface FileItem {
  id: number;
  original_name: string;
  blob_name: string;
  type: string;
  size: string;
  status: string;
  azure_url: string;
  visibility: string;
}

export default function MyFilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFiles() {
      setError('');
      try {
        const res = await fetch('/api/my-files', {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        let data = null;
        try {
          data = await res.json();
        } catch {}
        if (!res.ok) {
          setError(data?.error || 'Failed to fetch files. Please try again.');
          return;
        }
        if (!data || !data.files) {
          setError('Failed to fetch files. Please try again.');
          return;
        }
        setFiles(data.files);
      } catch (err: any) {
        setError('Failed to fetch files. Please try again.');
      }
    }
    fetchFiles();
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">My Files</h2>
        {error && <div className="bg-red-100 text-red-700 border border-red-300 rounded px-4 py-2 mb-4 text-center text-sm">{error}</div>}
        {files.length === 0 ? (
          <div className="text-gray-500">No files uploaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-blue-600 font-semibold">Name</th>
                  <th className="py-3 px-4 text-left text-blue-600 font-semibold">Visibility</th>
                  <th className="py-3 px-4 text-left text-blue-600 font-semibold">Link</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id} className="even:bg-gray-50">
                    <td className="py-2 px-4">{file.original_name}</td>
                    <td className="py-2 px-4 capitalize">{file.visibility}</td>
                    <td className="py-2 px-4">
                      {file.visibility === 'public' ? (
                        <a href={file.azure_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Public Link</a>
                      ) : (
                        <span className="text-gray-400">Private</span>
                      )}
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