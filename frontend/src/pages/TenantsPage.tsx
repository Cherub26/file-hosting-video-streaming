import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { formatDateTime } from '../utils/format';

interface TenantItem {
  id: number;
  name: string;
  user_count: number;
  created_at: string;
}

export default function TenantsPage() {
  const { user, login } = useAuth();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      setError('');
      setLoading(true);
      try {
        const res = await fetch('/api/tenants', {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        let data = null;
        try {
          data = await res.json();
        } catch {}
        if (!res.ok) {
          setError(data?.error || 'Failed to fetch tenants. Please try again.');
          return;
        }
        if (!data || !data.tenants) {
          setError('Failed to fetch tenants. Please try again.');
          return;
        }
        setTenants(data.tenants);
      } catch (err) {
        setError('Failed to fetch tenants. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    if (user?.token) {
      fetchTenants();
    }
  }, [user]);

  const handleSwitchTenant = async (tenantId: number) => {
    setSwitching(tenantId);
    setError('');
    try {
      const res = await fetch('/api/switch-tenant', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to switch tenant');
      }
      
      // Update the user with new token and tenant_id
      login({
        ...user!,
        tenant_id: data.user.tenant_id,
        token: data.token
      });
      
      // Show success message
      alert('Tenant switched successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSwitching(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-8 pt-8">
      <div className="w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">Available Tenants</h2>
        {error && <div className="bg-red-100 text-red-700 border border-red-300 rounded px-4 py-2 mb-4 text-center text-sm">{error}</div>}
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            <strong>Current Tenant:</strong> {tenants.find(t => t.id === user?.tenant_id)?.name || 'Unknown'}
          </p>
        </div>

        {tenants.length === 0 ? (
          <div className="text-gray-500">No tenants available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow text-left text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[220px]">Tenant Name</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px]">Users</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[180px]">Created</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px]">Status</th>
                  <th className="py-3 px-6 text-blue-600 font-semibold min-w-[120px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="even:bg-gray-50">
                    <td className="py-2 px-6 min-w-[220px] font-medium">{tenant.name}</td>
                    <td className="py-2 px-6 min-w-[120px]">{tenant.user_count}</td>
                    <td className="py-2 px-6 min-w-[180px]">{formatDateTime(tenant.created_at)}</td>
                    <td className="py-2 px-6 min-w-[120px]">
                      {tenant.id === user?.tenant_id ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Current
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                          Other
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-6 min-w-[120px]">
                      {tenant.id === user?.tenant_id ? (
                        <span className="text-gray-500 text-sm">Current</span>
                      ) : (
                        <button
                          onClick={() => handleSwitchTenant(tenant.id)}
                          disabled={switching === tenant.id}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {switching === tenant.id ? 'Switching...' : 'Switch'}
                        </button>
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