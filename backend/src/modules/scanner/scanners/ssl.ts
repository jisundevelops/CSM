import * as tls from 'node:tls';
import { Scanner, CanonicalFinding } from '../scanner.types';
import { makeFingerprint } from '../scanner.utils';

interface SslRawEvidence {
  host: string;
  port: number;
  certificate: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    fingerprint: string;
    serialNumber: string;
  } | null;
  protocol: string | null;
  cipher: string | null;
  errors: string[];
}

interface CertSubject {
  C?: string;
  ST?: string;
  L?: string;
  O?: string;
  OU?: string;
  CN?: string;
}

const WEAK_PROTOCOLS = ['TLSv1', 'TLSv1.1'];
const WEAK_CIPHERS = [
  'RC4', 'DES', '3DES', 'ECDHE-RSA-DES-CBC3-SHA', 'EDH-RSA-DES-CBC3-SHA',
  'DES-CBC3-SHA', 'EXP', 'EXPORT', 'NULL', 'anon', 'aNULL', 'eNULL'
];

function isWeakCipher(cipher: string): boolean {
  const upper = cipher.toUpperCase();
  return WEAK_CIPHERS.some(weak => upper.includes(weak));
}

function formatDn(dn: CertSubject | undefined): string {
  if (!dn) return 'unknown';
  const parts: string[] = [];
  if (dn.CN) parts.push(`CN=${dn.CN}`);
  if (dn.O) parts.push(`O=${dn.O}`);
  if (dn.OU) parts.push(`OU=${dn.OU}`);
  if (dn.C) parts.push(`C=${dn.C}`);
  return parts.join(', ') || 'unknown';
}

async function connectWithProtocol(
  host: string,
  port: number,
  minVersion: tls.SecureVersion,
  maxVersion: tls.SecureVersion,
  timeoutMs: number = 5000
): Promise<{ success: boolean; protocol: string | null; cipher: string | null }> {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host,
      port,
      minVersion,
      maxVersion,
      rejectUnauthorized: false,
    });

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ success: false, protocol: null, cipher: null });
    }, timeoutMs);

    socket.on('secureConnect', () => {
      clearTimeout(timeout);
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();
      socket.destroy();
      resolve({
        success: true,
        protocol: protocol || null,
        cipher: cipher?.name || null
      });
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ success: false, protocol: null, cipher: null });
    });
  });
}

export const sslScanner: Scanner = {
  name: 'ssl',
  supportedAssetTypes: ['domain'],

  async run(asset): Promise<CanonicalFinding[]> {
    const findings: CanonicalFinding[] = [];
    const errors: string[] = [];
    const host = asset.identifier.trim().toLowerCase();
    const port = 443;

    const rawEvidence: SslRawEvidence = {
      host,
      port,
      certificate: null,
      protocol: null,
      cipher: null,
      errors,
    };

    try {
      const result = await connectWithProtocol(host, port, 'TLSv1.2', 'TLSv1.3');

      if (!result.success) {
        errors.push(`Failed to connect to ${host}:${port}`);
        return findings;
      }

      rawEvidence.protocol = result.protocol;
      rawEvidence.cipher = result.cipher;

      const certSocket = tls.connect({
        host,
        port,
        rejectUnauthorized: false,
      });

      const certInfo = await new Promise<{ cert: tls.PeerCertificate | null }>((resolve) => {
        const timeout = setTimeout(() => {
          certSocket.destroy();
          resolve({ cert: null });
        }, 5000);

        certSocket.on('secureConnect', () => {
          clearTimeout(timeout);
          const cert = certSocket.getPeerCertificate();
          certSocket.destroy();
          resolve({ cert });
        });

        certSocket.on('error', () => {
          clearTimeout(timeout);
          certSocket.destroy();
          resolve({ cert: null });
        });
      });

      if (certInfo.cert) {
        rawEvidence.certificate = {
          subject: formatDn(certInfo.cert.subject as CertSubject),
          issuer: formatDn(certInfo.cert.issuer as CertSubject),
          validFrom: certInfo.cert.valid_from,
          validTo: certInfo.cert.valid_to,
          fingerprint: certInfo.cert.fingerprint || 'unknown',
          serialNumber: certInfo.cert.serialNumber || 'unknown',
        };

        const validTo = new Date(certInfo.cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 30) {
          findings.push({
            asset_id: asset.id,
            scanner_source: this.name,
            fingerprint: makeFingerprint(['ssl', 'expiring_soon', asset.id]),
            title: 'SSL certificate expiring soon',
            description:
              `The SSL certificate for "${host}" expires on ${validTo.toISOString()} ` +
              `(${daysUntilExpiry} days from now). Renew it before expiration to avoid service disruption.`,
            severity: daysUntilExpiry <= 7 ? 'critical' : 'high',
            confidence: 'confirmed',
            status: 'open',
            raw_evidence: rawEvidence,
          });
        }
      }
    } catch (err: any) {
      errors.push(`Connection error: ${err?.message || String(err)}`);
      return findings;
    }

    for (const weakProto of WEAK_PROTOCOLS) {
      try {
        const result = await connectWithProtocol(
          host,
          port,
          weakProto as tls.SecureVersion,
          weakProto as tls.SecureVersion
        );

        if (result.success) {
          findings.push({
            asset_id: asset.id,
            scanner_source: this.name,
            fingerprint: makeFingerprint(['ssl', 'weak_protocol', asset.id, weakProto]),
            title: `Weak protocol supported: ${weakProto}`,
            description:
              `The server at "${host}" supports ${weakProto}, which is deprecated and has known vulnerabilities. ` +
              `Disable support for ${weakProto} and require TLSv1.2 or higher.`,
            severity: 'high',
            confidence: 'confirmed',
            status: 'open',
            raw_evidence: { ...rawEvidence, testedProtocol: weakProto },
          });
        }
      } catch (err: any) {
        errors.push(`Protocol check error for ${weakProto}: ${err?.message || String(err)}`);
      }
    }

    if (rawEvidence.cipher && isWeakCipher(rawEvidence.cipher)) {
      findings.push({
        asset_id: asset.id,
        scanner_source: this.name,
        fingerprint: makeFingerprint(['ssl', 'weak_cipher', asset.id, rawEvidence.cipher]),
        title: `Weak cipher suite in use: ${rawEvidence.cipher}`,
        description:
          `The server at "${host}" negotiated the weak cipher suite "${rawEvidence.cipher}". ` +
          `Configure the server to prefer strong cipher suites (e.g., AES-GCM, ChaCha20).`,
        severity: 'medium',
        confidence: 'confirmed',
        status: 'open',
        raw_evidence: rawEvidence,
      });
    }

    return findings;
  },
};