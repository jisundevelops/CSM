import { riskRepository } from './risk.repository';

const SEVERITY_WEIGHTS: Record<string, number> = {
  info: 0, low: 1, medium: 2, high: 3, critical: 4
};

const CRITICALITY_WEIGHTS: Record<string, number> = {
  low: 1, medium: 2, high: 3
};

export const riskService = {
  calculateAndCreate: async (
    orgId: string,
    findingId: string,
    severity: string,
    criticality: string
  ) => {
    const sevWeight = SEVERITY_WEIGHTS[severity.toLowerCase()] ?? 0;
    const critWeight = CRITICALITY_WEIGHTS[criticality.toLowerCase()] ?? 1;

    const score = sevWeight * critWeight * 10;
    const factors = { severity, criticality, sevWeight, critWeight };

    return riskRepository.create({
      organizationId: orgId,
      findingId,
      score,
      factorsJson: factors
    });
  },

  getByFindingId: async (findingId: string, orgId: string) => {
    return riskRepository.findByFindingId(findingId, orgId);
  }
};