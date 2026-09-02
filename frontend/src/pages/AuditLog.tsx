import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  actor?: { email: string } | null;
}

const ENTITY_TYPES = ['All', 'Asset', 'Finding', 'Risk', 'Task', 'Verification', 'Evidence', 'User'];

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchLogs = async (entityType?: string) => {
    try {
      setLoading(true);
      const endpoint = entityType && entityType !== 'All'
        ? `/audit-logs?entityType=${entityType}`
        : '/audit-logs';
      const data = await apiClient.get(endpoint);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(filter);
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          {ENTITY_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">No audit logs found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.actor?.email || 'System'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{log.action}</td>
                  <td className="px-4 py-3 text-sm">{log.entityType}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">{log.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};