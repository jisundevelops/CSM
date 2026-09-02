export interface CreateFindingInput {
  assetId: string;
  scannerSource?: string;
  fingerprint?: string;
  title: string;
  description?: string;
  severity: string;
  confidence: string;
  status?: string;
  rawEvidence?: any;
}

export interface UpdateFindingInput {
  title?: string;
  description?: string;
  severity?: string;
  confidence?: string;
  status?: string;
}