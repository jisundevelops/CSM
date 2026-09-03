import { Scanner } from '../scanner.types';
import { dnsScanner } from './dns';
import { sslScanner } from './ssl';
import { httpHeadersScanner } from './httpHeaders';
import { exposureScanner } from './exposure';

export const scanners: Scanner[] = [
  dnsScanner,
  sslScanner,
  httpHeadersScanner,
  exposureScanner,
];