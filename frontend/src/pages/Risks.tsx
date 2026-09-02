import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Finding {
  id: string;
  title: string;
  severity: string;
  status: string;
  asset?: { identifier: string; criticality: string };
  risks?: { id: string; score: number }[];
}

export const Risks: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const data = await apiClient.get('/findings');
        setFindings(data);
      } catch (err) {
        console.error('Failed to fetch findings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, []);

  const sortedFindings = [...findings].sort((a, b) => {
    const scoreA = a.risks?.[0]?.score ?? 0;
    const scoreB = b.risks?.[0]?.score ?? 0;
    return scoreB - scoreA;
  });

  const riskColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Risk Overview</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : sortedFindings.length === 0 ? (
        <p className="text-gray-500">No findings with risk scores yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Finding</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedFindings.map(finding => (
                <tr key={finding.id} className="hover:bg-gray-50">
                  <td className={`px-4 py-3 text-2xl font-bold ${riskColor(finding.risks?.[0]?.score ?? 0)}`}>
                    {finding.risks?.[0]?.score ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{finding.title}</td>
                  <td className="px-4 py-3 text-sm">{finding.asset?.identifier || '-'}</td>
                  <td className="px-4 py-3 text-sm capitalize">{finding.severity}</td>
                  <td className="px-4 py-3 text-sm capitalize">{finding.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};