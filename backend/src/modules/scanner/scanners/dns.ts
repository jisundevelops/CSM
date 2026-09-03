import * as dns from 'node:dns/promises';
import { Scanner, CanonicalFinding } from '../scanner.types';
import { makeFingerprint } from '../scanner.utils';

interface DnsRawEvidence {
  a: string[];
  aaaa: string[];
  mx: { exchange: string; priority: number }[];
  txt: string[][];
  errors: string[];
}

async function safeResolve<T>(
  resolver: () => Promise<T>,
  label: string,
  errors: string[]
): Promise<T | null> {
  try {
    return await resolver();
  } catch (err: any) {
    const code = err?.code;
    if (code === 'ENODATA' || code === 'ENOTFOUND' || code === 'ESERVFAIL') {
      return null;
    }
    errors.push(`${label}: ${err?.message || String(err)}`);
    return null;
  }
}

function hasSpfRecord(txtRecords: string[][]): boolean {
  return txtRecords.some(group =>
    group.some(record => record.trim().toLowerCase().startsWith('v=spf1'))
  );
}

function hasDmarcRecord(txtRecords: string[][]): boolean {
  return txtRecords.some(group =>
    group.some(record => record.trim().toLowerCase().startsWith('v=dmarc1'))
  );
}

export const dnsScanner: Scanner = {
  name: 'dns',
  supportedAssetTypes: ['domain'],

  async run(asset): Promise<CanonicalFinding[]> {
    const findings: CanonicalFinding[] = [];
    const errors: string[] = [];
    const domain = asset.identifier.trim().toLowerCase();

    const [a, aaaa, mx, txt] = await Promise.all([
      safeResolve(() => dns.resolve4(domain), 'A', errors),
      safeResolve(() => dns.resolve6(domain), 'AAAA', errors),
      safeResolve(() => dns.resolveMx(domain), 'MX', errors),
      safeResolve(() => dns.resolveTxt(domain), 'TXT', errors),
    ]);

    const dmarcTxt = await safeResolve(
      () => dns.resolveTxt(`_dmarc.${domain}`),
      'TXT(_dmarc)',
      errors
    );

    const rawEvidence: DnsRawEvidence = {
      a: a ?? [],
      aaaa: aaaa ?? [],
      mx: mx ?? [],
      txt: txt ?? [],
      errors,
    };

    if (!hasSpfRecord(txt ?? [])) {
      findings.push({
        asset_id: asset.id,
        scanner_source: this.name,
        fingerprint: makeFingerprint(['dns', 'missing_spf', asset.id]),
        title: 'Missing SPF record',
        description:
          `The domain "${domain}" does not publish an SPF (v=spf1) TXT record. ` +
          `This allows attackers to spoof email from this domain, enabling phishing.`,
        severity: 'high',
        confidence: 'confirmed',
        status: 'open',
        raw_evidence: rawEvidence,
      });
    }

    const allTxt = [...(txt ?? []), ...(dmarcTxt ?? [])];
    if (!hasDmarcRecord(allTxt)) {
      findings.push({
        asset_id: asset.id,
        scanner_source: this.name,
        fingerprint: makeFingerprint(['dns', 'missing_dmarc', asset.id]),
        title: 'Missing DMARC record',
        description:
          `The domain "${domain}" does not publish a DMARC (v=DMARC1) record at _dmarc.${domain}. ` +
          `Without DMARC, receivers have no policy for handling failed SPF/DKIM checks.`,
        severity: 'medium',
        confidence: 'confirmed',
        status: 'open',
        raw_evidence: { ...rawEvidence, dmarcTxt: dmarcTxt ?? [] },
      });
    }

    return findings;
  },
};