import * as net from 'node:net';
import * as dns from 'node:dns/promises';
import { Scanner, CanonicalFinding } from '../scanner.types';
import { makeFingerprint } from '../scanner.utils';

interface PortProbe {
  port: number;
  service: string;
  open: boolean;
  banner: string | null;
  error: string | null;
}

interface ExposureRawEvidence {
  host: string;
  resolvedIps: string[];
  probes: PortProbe[];
  errors: string[];
}

const PROBE_TARGETS: Array<{
  port: number;
  service: string;
  expectedPublic: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
}> = [
  { port: 21,  service: 'FTP',            expectedPublic: false, severity: 'high',     description: 'FTP is an insecure, unencrypted file transfer protocol. Use SFTP or SCP instead.' },
  { port: 22,  service: 'SSH',            expectedPublic: true,  severity: 'info',     description: 'SSH is exposed. Ensure key-based auth is enforced and password auth is disabled.' },
  { port: 23,  service: 'Telnet',         expectedPublic: false, severity: 'high',     description: 'Telnet transmits data (including credentials) in plaintext. Disable it immediately.' },
  { port: 25,  service: 'SMTP',           expectedPublic: true,  severity: 'info',     description: 'SMTP is exposed. Ensure it requires authentication and is not an open relay.' },
  { port: 80,  service: 'HTTP',           expectedPublic: true,  severity: 'info',     description: 'HTTP is exposed. Ensure it redirects to HTTPS.' },
  { port: 443, service: 'HTTPS',          expectedPublic: true,  severity: 'info',     description: 'HTTPS is exposed (expected).' },
  { port: 3306, service: 'MySQL',         expectedPublic: false, severity: 'critical', description: 'MySQL database port is publicly accessible. Databases should never be exposed to the internet — restrict access via firewall/VPC.' },
  { port: 5432, service: 'PostgreSQL',    expectedPublic: false, severity: 'critical', description: 'PostgreSQL database port is publicly accessible. Databases should never be exposed to the internet — restrict access via firewall/VPC.' },
  { port: 6379, service: 'Redis',         expectedPublic: false, severity: 'critical', description: 'Redis port is publicly accessible. Redis has no auth by default and should never be exposed to the internet.' },
  { port: 27017, service: 'MongoDB',      expectedPublic: false, severity: 'critical', description: 'MongoDB port is publicly accessible. MongoDB instances without auth are routinely exploited — restrict access immediately.' },
  { port: 9200, service: 'Elasticsearch', expectedPublic: false, severity: 'high',     description: 'Elasticsearch is publicly accessible. This can lead to data exposure and ransomware attacks — restrict access via firewall.' },
  { port: 8080, service: 'HTTP-Alt',      expectedPublic: false, severity: 'medium',   description: 'An HTTP service is running on a non-standard port (8080). This is often a dev/admin interface and should not be publicly accessible.' },
];

async function probePort(
  host: string,
  port: number,
  connectTimeoutMs: number = 3000,
  bannerTimeoutMs: number = 2000
): Promise<{ open: boolean; banner: string | null; error: string | null }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let banner = '';
    let settled = false;

    const settle = (result: { open: boolean; banner: string | null; error: string | null }) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch {}
      resolve(result);
    };

    const connectTimer = setTimeout(() => {
      settle({ open: false, banner: null, error: 'connect timeout' });
    }, connectTimeoutMs);

    socket.on('connect', () => {
      clearTimeout(connectTimer);
      const bannerTimer = setTimeout(() => {
        settle({ open: true, banner: banner || null, error: null });
      }, bannerTimeoutMs);

      socket.on('data', (chunk) => {
        banner += chunk.toString('utf8').slice(0, 512);
      });

      socket.on('end', () => {
        clearTimeout(bannerTimer);
        settle({ open: true, banner: banner || null, error: null });
      });

      socket.on('error', (err) => {
        clearTimeout(bannerTimer);
        settle({ open: true, banner: banner || null, error: `banner read error: ${err.message}` });
      });
    });

    socket.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(connectTimer);
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'EHOSTUNREACH') {
        settle({ open: false, banner: null, error: null });
      } else {
        settle({ open: false, banner: null, error: err.message });
      }
    });

    socket.connect(port, host);
  });
}

export const exposureScanner: Scanner = {
  name: 'exposure',
  supportedAssetTypes: ['domain'],

  async run(asset): Promise<CanonicalFinding[]> {
    const findings: CanonicalFinding[] = [];
    const errors: string[] = [];
    const host = asset.identifier.trim().toLowerCase();

    let resolvedIps: string[] = [];
    try {
      const [a, aaaa] = await Promise.all([
        dns.resolve4(host).catch(() => [] as string[]),
        dns.resolve6(host).catch(() => [] as string[]),
      ]);
      resolvedIps = [...a, ...aaaa];
    } catch (err: any) {
      errors.push(`DNS resolution failed: ${err?.message || String(err)}`);
      return findings;
    }

    if (resolvedIps.length === 0) {
      errors.push(`No A/AAAA records found for ${host}`);
      return findings;
    }

    const targetIp = resolvedIps[0];
    const probes: PortProbe[] = [];

    for (const target of PROBE_TARGETS) {
      const result = await probePort(targetIp, target.port);
      probes.push({
        port: target.port,
        service: target.service,
        open: result.open,
        banner: result.banner,
        error: result.error,
      });
      if (result.error && !result.open) {
        if (!['connect timeout'].includes(result.error)) {
          errors.push(`${target.port}/${target.service}: ${result.error}`);
        }
      }
    }

    const rawEvidence: ExposureRawEvidence = {
      host,
      resolvedIps,
      probes,
      errors,
    };

    for (const target of PROBE_TARGETS) {
      if (target.expectedPublic) continue;

      const probe = probes.find(p => p.port === target.port);
      if (!probe || !probe.open) continue;

      findings.push({
        asset_id: asset.id,
        scanner_source: this.name,
        fingerprint: makeFingerprint(['exposure', 'open_port', asset.id, String(target.port)]),
        title: `Publicly exposed service: ${target.service} (port ${target.port})`,
        description:
          `The host "${host}" (resolved to ${targetIp}) has ${target.service} listening on port ${target.port}, ` +
          `which is accessible from the public internet. ${target.description}` +
          (probe.banner ? `\n\nBanner: ${probe.banner.trim().slice(0, 200)}` : ''),
        severity: target.severity,
        confidence: 'confirmed',
        status: 'open',
        raw_evidence: rawEvidence,
      });
    }

    return findings;
  },
};