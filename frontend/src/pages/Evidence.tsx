import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Evidence {
  id: string;
  findingId: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Finding {
  id: string;
  title: string;
}

export const Evidence: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [evidenceByFinding, setEvidenceByFinding] = useState<Record<string, Evidence[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const findingsData = await apiClient.get('/findings');
        setFindings(findingsData);

        const evidenceMap: Record<string, Evidence[]> = {};
        for (const finding of findingsData) {
          const evidenceData = await apiClient.get(`/evidence?findingId=${finding.id}`);
          evidenceMap[finding.id] = evidenceData;
        }
        setEvidenceByFinding(evidenceMap);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Evidence</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-6">
          {findings.map(finding => {
            const evidence = evidenceByFinding[finding.id] || [];
            if (evidence.length === 0) return null;
            return (
              <div key={finding.id} className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-bold mb-3">{finding.title}</h2>
                <div className="space-y-3">
                  {evidence.map(ev => (
                    <div key={ev.id} className="bg-gray-50 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{ev.type}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(ev.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{ev.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.values(evidenceByFinding).every(e => e.length === 0) && (
            <p className="text-gray-500">No evidence attached to any findings yet.</p>
          )}
        </div>
      )}
    </div>
  );
};