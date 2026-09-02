import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Asset {
  id: string;
  type: string;
  identifier: string;
  criticality: string;
  createdAt: string;
  _count?: { findings: number };
}

export const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [type, setType] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [criticality, setCriticality] = useState('medium');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/assets');
      setAssets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const resetForm = () => {
    setType('');
    setIdentifier('');
    setCriticality('medium');
    setEditingAsset(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (asset: Asset) => {
    setEditingAsset(asset);
    setType(asset.type);
    setIdentifier(asset.identifier);
    setCriticality(asset.criticality);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingAsset) {
        await apiClient.put(`/assets/${editingAsset.id}`, { type, identifier, criticality });
      } else {
        await apiClient.post('/assets', { type, identifier, criticality });
      }
      resetForm();
      fetchAssets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await apiClient.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const criticalityColor = (c: string) => {
    switch (c.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <button
          onClick={openCreateForm}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          + Add Asset
        </button>
      </div>

      {error && <p className="mb-4 text-red-500">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">{editingAsset ? 'Edit Asset' : 'Create Asset'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-md p-2" required>
                <option value="">Select type...</option>
                <option value="domain">Domain</option>
                <option value="ip">IP Address</option>
                <option value="repository">Repository</option>
                <option value="cloud">Cloud Resource</option>
                <option value="container">Container</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Identifier</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="e.g., example.com"
                className="w-full border rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Criticality</label>
              <select value={criticality} onChange={e => setCriticality(e.target.value)} className="w-full border rounded-md p-2">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700">
                {editingAsset ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="flex-1 rounded-md bg-gray-200 py-2 hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading assets...</p>
      ) : assets.length === 0 ? (
        <p className="text-gray-500">No assets yet. Click "+ Add Asset" to create one.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identifier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criticality</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Findings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm capitalize">{asset.type}</td>
                  <td className="px-4 py-3 text-sm font-mono">{asset.identifier}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${criticalityColor(asset.criticality)}`}>
                      {asset.criticality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{asset._count?.findings ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button onClick={() => openEditForm(asset)} className="text-indigo-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(asset.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};