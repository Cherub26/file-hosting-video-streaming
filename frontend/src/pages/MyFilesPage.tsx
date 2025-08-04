import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { FiDownload, FiEye, FiEyeOff } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatDateTime, formatFileSize } from '../utils/format';

interface FileItem {
  id: number;
  public_id: string;
  original_name: string;
  blob_name: string;
  type: string;
  size: string;
  visibility: string;
  azure_url: string;
  tenant?: { name: string };
}

export default function MyFilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [changingVisibility, setChangingVisibility] = useState<string | null>(null);

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

  const changeFileVisibility = async (fileId: string, newVisibility: 'public' | 'private') => {
    setChangingVisibility(fileId);
    try {
      const res = await fetch(`/api/file/${fileId}/visibility`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to change visibility');
        return;
      }
      
      // Update the file in the state
      setFiles(files.map(file => 
        file.public_id === fileId 
          ? { ...file, visibility: newVisibility }
          : file
      ));
    } catch (err) {
      alert('Failed to change visibility');
    } finally {
      setChangingVisibility(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 pt-8">
      <div className="w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">Tenant Files</h2>
        {error && <div className="bg-red-100 text-red-700 border border-red-300 rounded px-4 py-2 mb-4 text-center text-sm">{error}</div>}
        {files.length === 0 ? (
          <div className="text-gray-500">No files uploaded in your tenant yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow text-left text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[220px]">Name</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px]">Tenant</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[100px]">Visibility</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[180px]">Uploaded</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px] whitespace-nowrap">Size</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[160px] whitespace-nowrap">Type</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[160px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.public_id} className="even:bg-gray-50">
                    <td className="py-2 px-6 min-w-[220px]">
                      <Link
                        to={`/file/${file.public_id}`}
                        className="text-blue-600 underline font-medium"
                      >
                        {file.original_name}
                      </Link>
                    </td>
                    <td className="py-2 px-6 min-w-[120px]">{file.tenant?.name || 'Unknown'}</td>
                    <td className="py-2 px-6 min-w-[100px]">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        file.visibility === 'public' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {file.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="py-2 px-6 min-w-[180px]">{formatDateTime((file as any).created_at)}</td>
                    <td className="py-2 px-6 min-w-[120px] whitespace-nowrap">{formatFileSize(file.size)}</td>
                    <td className="py-2 px-6 min-w-[160px] whitespace-nowrap">{file.type}</td>
                    <td className="py-2 px-6 min-w-[160px] whitespace-nowrap flex space-x-2">
                      <button
                        onClick={() => changeFileVisibility(file.public_id, file.visibility === 'public' ? 'private' : 'public')}
                        disabled={changingVisibility === file.public_id}
                        className="text-gray-600 hover:text-blue-600 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                        title={`Make ${file.visibility === 'public' ? 'private' : 'public'}`}
                      >
                        {changingVisibility === file.public_id ? (
                          <div className="w-5 h-5 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        ) : file.visibility === 'public' ? (
                          <FiEye size={20} />
                        ) : (
                          <FiEyeOff size={20} />
                        )}
                      </button>
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
                        className="text-blue-600 hover:text-black p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                        title="Download file"
                      >
                        <FiDownload size={20} />
                      </button>
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