import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Asset {
  id: string;
  type: string;
  identifier: string;
  criticality: string;
  createdAt: string;
  _count?: { findings: number };
}

interface ScanResult {
  scanner: string;
  created: number;
  updated: number;
  errors: string[];
  findingIds: string[];
}

interface ScanSummary {
  assetId: string;
  startedAt: string;
  finishedAt: string;
  results: ScanResult[];
  totalCreated: number;
  totalUpdated: number;
}

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [scanning, setScanning] = useState(false);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [scanError, setScanError] = useState('');

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/assets/${id}`);
      setAsset(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const handleRunScan = async () => {
    setScanning(true);
    setScanSummary(null);
    setScanError('');
    try {
      const summary = await apiClient.post('/scanner/run', { assetId: id });
      setScanSummary(summary);
      fetchAsset();
    } catch (err: any) {
      setScanError(err.message);
    } finally {
      setScanning(false);
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

  if (loading) {
    return <p className="text-gray-500">Loading asset...</p>;
  }

  if (error || !asset) {
    return (
      <div>
        <p className="text-red-500 mb-4">{error || 'Asset not found'}</p>
        <Link to="/assets" className="text-indigo-600 hover:underline">← Back to Assets</Link>
      </div>
    );
  }

  const supportsScanning = asset.type === 'domain';

  return (
    <div>
      <div className="mb-6">
        <Link to="/assets" className="text-sm text-indigo-600 hover:underline">← Back to Assets</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{asset.identifier}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="capitalize">{asset.type}</span>
              <span>•</span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${criticalityColor(asset.criticality)}`}>
                {asset.criticality} criticality
              </span>
              <span>•</span>
              <span>{asset._count?.findings ?? 0} findings</span>
              <span>•</span>
              <span>Created {new Date(asset.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div>
            {supportsScanning ? (
              <button
                onClick={handleRunScan}
                disabled={scanning}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scanning ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    Scanning...
                  </>
                ) : (
                  <>▶ Run Scan</>
                )}
              </button>
            ) : (
              <span className="text-sm text-gray-500 italic">
                Scanning not available for {asset.type} assets yet
              </span>
            )}
          </div>
        </div>
      </div>

      {scanError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{scanError}</p>
        </div>
      )}

      {scanSummary && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Scan Results</h2>
            <span className="text-xs text-gray-500">
              {new Date(scanSummary.finishedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">New Findings</p>
              <p className="text-3xl font-bold text-green-800">{scanSummary.totalCreated}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">Re-detected</p>
              <p className="text-3xl font-bold text-blue-800">{scanSummary.totalUpdated}</p>
            </div>
          </div>

          {scanSummary.results.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No scanners support this asset type yet.
            </p>
          ) : (
            <div className="space-y-3">
              {scanSummary.results.map(result => (
                <div key={result.scanner} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase">{result.scanner}</h3>
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-700">+{result.created} new</span>
                      <span className="text-blue-700">{result.updated} updated</span>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                      {result.errors.map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Link
              to="/findings"
              className="text-sm text-indigo-600 hover:underline"
            >
              View all findings →
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-3">Linked Findings</h2>
        <p className="text-sm text-gray-500">
          View all findings for this asset in the{' '}
          <Link to="/findings" className="text-indigo-600 hover:underline">
            Findings page
          </Link>
          .
        </p>
      </div>
    </div>
  );
};