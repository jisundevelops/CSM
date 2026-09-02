export interface CreateAssetInput {
  type: string;
  identifier: string;
  criticality: string;
}

export interface UpdateAssetInput {
  type?: string;
  identifier?: string;
  criticality?: string;
}