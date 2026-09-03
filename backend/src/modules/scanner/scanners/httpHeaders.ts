import { Scanner, CanonicalFinding } from '../scanner.types';
import { makeFingerprint } from '../scanner.utils';

interface HttpRawEvidence {
  url: string;
  finalUrl: string;
  statusCode: number | null;
  headers: Record<string, string>;
  presentHeaders: string[];
  missingHeaders: string[];
  errors: string[];
}

const EXPECTED_HEADERS: Array<[string, 'critical' | 'high' | 'medium' | 'low' | 'info', string]> = [
  [
    'content-security-policy',
    'high',
    'Content-Security-Policy (CSP) mitigates XSS and data-injection attacks by restricting which resources the browser may load.',
  ],
  [
    'strict-transport-security',
    'high',
    'Strict-Transport-Security (HSTS) forces browsers to always use HTTPS for this domain, preventing protocol-downgrade attacks.',
  ],
  [
    'x-frame-options',
    'medium',
    'X-Frame-Options prevents the page from being embedded in iframes on other sites, mitigating clickjacking attacks.',
  ],
  [
    'x-content-type-options',
    'medium',
    'X-Content-Type-Options: nosniff prevents browsers from MIME-sniffing responses away from the declared content-type.',
  ],
  [
    'referrer-policy',
    'low',
    'Referrer-Policy controls how much referrer information is sent with requests. A restrictive policy (e.g. strict-origin-when-cross-origin) reduces data leakage.',
  ],
  [
    'permissions-policy',
    'low',
    'Permissions-Policy (formerly Feature-Policy) restricts which browser features (camera, microphone, geolocation, etc.) the page may use.',
  ],
];

export const httpHeadersScanner: Scanner = {
  name: 'http_headers',
  supportedAssetTypes: ['domain'],

  async run(asset): Promise<CanonicalFinding[]> {
    const findings: CanonicalFinding[] = [];
    const errors: string[] = [];
    const host = asset.identifier.trim().toLowerCase();
    const url = `https://${host}`;

    const rawEvidence: HttpRawEvidence = {
      url,
      finalUrl: '',
      statusCode: null,
      headers: {},
      presentHeaders: [],
      missingHeaders: [],
      errors,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });
    } catch (err: any) {
      errors.push(`HTTP fetch failed: ${err?.message || String(err)}`);
      return findings;
    }

    rawEvidence.finalUrl = response.url || url;
    rawEvidence.statusCode = response.status;

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    rawEvidence.headers = headers;

    for (const [headerName, severity, description] of EXPECTED_HEADERS) {
      if (headers[headerName] !== undefined) {
        rawEvidence.presentHeaders.push(headerName);
        continue;
      }

      rawEvidence.missingHeaders.push(headerName);

      const prettyName = headerName
        .split('-')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join('-');

      findings.push({
        asset_id: asset.id,
        scanner_source: this.name,
        fingerprint: makeFingerprint(['http_headers', 'missing', headerName, asset.id]),
        title: `Missing security header: ${prettyName}`,
        description:
          `The HTTPS response from "${host}" (final URL: ${rawEvidence.finalUrl}) ` +
          `does not include the "${prettyName}" header. ${description}`,
        severity,
        confidence: 'confirmed',
        status: 'open',
        raw_evidence: rawEvidence,
      });
    }

    return findings;
  },
};