export interface CreateRiskInput {
  organizationId: string;
  findingId: string;
  score: number;
  factorsJson?: any;
}