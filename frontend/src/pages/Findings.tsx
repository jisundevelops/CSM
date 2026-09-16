import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Finding {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  severity: string;
  confidence: string;
  status: string;
  scannerSource: string;
  fingerprint: string;
  firstSeen: string;
  lastSeen: string;
  rawEvidence: any;
  asset?: { id: string; identifier: string; criticality: string };
  risks?: { id: string; score: number }[];
  evidences?: Evidence[];
  tasks?: Task[];
}

interface Evidence {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Task {
  id: string;
  status: string;
  assignedTo: string | null;
}

interface Asset {
  id: string;
  identifier: string;
}

export const Findings: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showRawEvidence, setShowRawEvidence] = useState(false);

  const [assetId, setAssetId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [confidence, setConfidence] = useState('confirmed');

  const [evidenceType, setEvidenceType] = useState('note');
  const [evidenceContent, setEvidenceContent] = useState('');

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskAssignedTo, setTaskAssignedTo] = useState('');

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/findings');
      setFindings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await apiClient.get('/assets');
      setAssets(data);
    } catch (err: any) {
      console.error('Failed to fetch assets:', err);
    }
  };

  useEffect(() => {
    fetchFindings();
    fetchAssets();
  }, []);

  const fetchFindingDetail = async (id: string) => {
    try {
      const data = await apiClient.get(`/findings/${id}`);
      setSelectedFinding(data);
      setEvidence(data.evidences || []);
      setTasks(data.tasks || []);
      setShowRawEvidence(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/findings', {
        assetId,
        title,
        description,
        severity,
        confidence
      });
      setShowCreateForm(false);
      resetCreateForm();
      fetchFindings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetCreateForm = () => {
    setAssetId('');
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setConfidence('confirmed');
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    try {
      await apiClient.post('/evidence', {
        findingId: selectedFinding.id,
        type: evidenceType,
        content: evidenceContent
      });
      setEvidenceContent('');
      fetchFindingDetail(selectedFinding.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    try {
      await apiClient.post('/tasks', {
        findingId: selectedFinding.id,
        assignedTo: taskAssignedTo || undefined
      });
      setShowTaskForm(false);
      setTaskAssignedTo('');
      fetchFindingDetail(selectedFinding.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const severityColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'critical': return 'bg-purple-100 text-purple-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'info': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'reopened': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sourceColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'manual': return 'bg-gray-100 text-gray-700';
      case 'dns': return 'bg-blue-100 text-blue-700';
      case 'ssl': return 'bg-green-100 text-green-700';
      case 'http_headers': return 'bg-yellow-100 text-yellow-700';
      case 'exposure': return 'bg-red-100 text-red-700';
      default: return 'bg-indigo-100 text-indigo-700';
    }
  };

  return (
    <div className="flex h-full relative">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">Findings</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            + Add Finding
          </button>
        </div>

        {error && <p className="mb-4 text-red-500">{error}</p>}

        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleCreateFinding} className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold">Create Finding</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Asset</label>
                <select value={assetId} onChange={e => setAssetId(e.target.value)} className="w-full border rounded-md p-2" required>
                  <option value="">Select asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.identifier}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-md p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-md p-2" rows={3} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full border rounded-md p-2">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confidence</label>
                  <select value={confidence} onChange={e => setConfidence(e.target.value)} className="w-full border rounded-md p-2">
                    <option value="confirmed">Confirmed</option>
                    <option value="probable">Probable</option>
                    <option value="possible">Possible</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700">Create</button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 rounded-md bg-gray-200 py-2 hover:bg-gray-300">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading findings...</p>
        ) : findings.length === 0 ? (
          <p className="text-gray-500">No findings yet. Click "+ Add Finding" to create one.</p>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {findings.map(finding => (
                    <tr
                      key={finding.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => fetchFindingDetail(finding.id)}
                    >
                      <td className="px-4 py-3 text-sm font-medium">{finding.title}</td>
                      <td className="px-4 py-3 text-sm">{finding.asset?.identifier || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${severityColor(finding.severity)}`}>
                          {finding.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        {finding.risks?.[0]?.score ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor(finding.status)}`}>
                          {finding.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${sourceColor(finding.scannerSource)}`}>
                          {finding.scannerSource}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedFinding && (
        <div className="fixed inset-0 z-50 md:static md:inset-auto md:z-auto md:w-96 bg-white md:border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Finding Detail</h2>
              <button onClick={() => setSelectedFinding(null)} className="text-gray-400 hover:text-gray-600 text-lg px-2">X</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Title</p>
                <p className="text-base">{selectedFinding.title}</p>
              </div>
              {selectedFinding.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm">{selectedFinding.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Severity</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${severityColor(selectedFinding.severity)}`}>
                    {selectedFinding.severity}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Risk Score</p>
                  <p className="text-lg font-bold">{selectedFinding.risks?.[0]?.score ?? '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor(selectedFinding.status)}`}>
                    {selectedFinding.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Confidence</p>
                  <span className="text-sm capitalize">{selectedFinding.confidence}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Scanner Source</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${sourceColor(selectedFinding.scannerSource)}`}>
                  {selectedFinding.scannerSource}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                <div>
                  <p className="font-medium">First Seen</p>
                  <p>{new Date(selectedFinding.firstSeen).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Last Seen</p>
                  <p>{new Date(selectedFinding.lastSeen).toLocaleString()}</p>
                </div>
              </div>

              {selectedFinding.rawEvidence && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowRawEvidence(!showRawEvidence)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    <span>Raw Scanner Output</span>
                    <span className="text-xs">{showRawEvidence ? 'Hide' : 'Show'}</span>
                  </button>
                  {showRawEvidence && (
                    <pre className="mt-2 bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedFinding.rawEvidence, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">Tasks</p>
                  <button onClick={() => setShowTaskForm(true)} className="text-xs text-indigo-600 hover:underline">+ Create Task</button>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-xs text-gray-400">No tasks yet</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className="text-xs bg-gray-50 p-2 rounded">
                        <p>Status: <span className="font-medium">{task.status}</span></p>
                        {task.assignedTo && <p>Assigned: {task.assignedTo}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showTaskForm && (
                <form onSubmit={handleCreateTask} className="bg-gray-50 p-3 rounded space-y-2">
                  <input
                    type="text"
                    value={taskAssignedTo}
                    onChange={e => setTaskAssignedTo(e.target.value)}
                    placeholder="Assign to user ID (optional)"
                    className="w-full border rounded p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-1 rounded text-sm hover:bg-indigo-700">Create</button>
                    <button type="button" onClick={() => setShowTaskForm(false)} className="flex-1 bg-gray-200 py-1 rounded text-sm hover:bg-gray-300">Cancel</button>
                  </div>
                </form>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Evidence</p>
                {evidence.length === 0 ? (
                  <p className="text-xs text-gray-400">No evidence yet</p>
                ) : (
                  <div className="space-y-2">
                    {evidence.map(ev => (
                      <div key={ev.id} className="bg-gray-50 p-2 rounded text-xs">
                        <p className="font-medium capitalize">{ev.type}</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{ev.content}</p>
                        <p className="text-gray-400 mt-1">{new Date(ev.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddEvidence} className="mt-3 space-y-2">
                  <select value={evidenceType} onChange={e => setEvidenceType(e.target.value)} className="w-full border rounded p-2 text-sm">
                    <option value="note">Note</option>
                    <option value="log_snippet">Log Snippet</option>
                    <option value="file_reference">File Reference</option>
                  </select>
                  <textarea
                    value={evidenceContent}
                    onChange={e => setEvidenceContent(e.target.value)}
                    placeholder="Add evidence..."
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                    required
                  />
                  <button type="submit" className="w-full bg-indigo-600 text-white py-1 rounded text-sm hover:bg-indigo-700">Add Evidence</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};