export interface CanonicalFinding {
  asset_id: string;
  scanner_source: string;
  fingerprint: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: 'confirmed' | 'probable' | 'possible';
  status: 'open' | 'reopened' | 'resolved';
  raw_evidence: any;
}

export interface Scanner {
  name: string;
  supportedAssetTypes: string[];
  run(asset: { id: string; type: string; identifier: string; organizationId: string }): Promise<CanonicalFinding[]>;
}

export interface ScanResult {
  scanner: string;
  created: number;
  updated: number;
  errors: string[];
  findingIds: string[];
}

export interface ScanSummary {
  assetId: string;
  startedAt: string;
  finishedAt: string;
  results: ScanResult[];
  totalCreated: number;
  totalUpdated: number;
}