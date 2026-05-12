// Mock attack data for the globe when no real data is available
export const ATTACK_TYPES = ['DDoS', 'MALWARE', 'BRUTE_FORCE', 'PHISHING', 'PORT_SCAN', 'API_FLOOD'];

export const COUNTRIES = [
  { code: 'CN', lat: 35.86, lng: 104.19, name: 'China' },
  { code: 'RU', lat: 61.52, lng: 105.31, name: 'Russia' },
  { code: 'US', lat: 37.09, lng: -95.71, name: 'United States' },
  { code: 'DE', lat: 51.16, lng: 10.45, name: 'Germany' },
  { code: 'BR', lat: -14.23, lng: -51.92, name: 'Brazil' },
  { code: 'IN', lat: 20.59, lng: 78.96, name: 'India' },
  { code: 'KR', lat: 35.90, lng: 127.76, name: 'South Korea' },
  { code: 'IR', lat: 32.42, lng: 53.68, name: 'Iran' },
  { code: 'NG', lat: 9.08, lng: 8.67, name: 'Nigeria' },
  { code: 'UA', lat: 48.37, lng: 31.16, name: 'Ukraine' },
  { code: 'GB', lat: 55.37, lng: -3.43, name: 'United Kingdom' },
  { code: 'FR', lat: 46.22, lng: 2.21, name: 'France' },
];

export function generateMockAttack() {
  const src = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  let dst = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  while (dst.code === src.code) dst = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

  const type = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const severity = severities[Math.floor(Math.random() * severities.length)];

  return {
    id: Math.random().toString(36).substring(7),
    type,
    severity,
    sourceIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    sourceCountry: src.name,
    sourceCode: src.code,
    sourceLat: src.lat + (Math.random() - 0.5) * 10,
    sourceLng: src.lng + (Math.random() - 0.5) * 10,
    destLat: dst.lat + (Math.random() - 0.5) * 10,
    destLng: dst.lng + (Math.random() - 0.5) * 10,
    destCountry: dst.name,
    destCode: dst.code,
    timestamp: new Date().toISOString(),
    port: [22, 80, 443, 3306, 5432, 8080, 8443][Math.floor(Math.random() * 7)],
  };
}

export function generateMockThreatEvent() {
  const types = ['MALWARE_DETECTED', 'DDOS_SURGE', 'BRUTE_FORCE', 'API_FLOOD', 'SUSPICIOUS_IP', 'PORT_SCAN'];
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  const descriptions: Record<string, string> = {
    MALWARE_DETECTED: `Malware signature detected in uploaded file from ${ip}`,
    DDOS_SURGE: `DDoS traffic surge: 450k req/s from ${ip} targeting /api/users`,
    BRUTE_FORCE: `Brute force attempt: 847 failed login attempts from ${ip}`,
    API_FLOOD: `API flood detected: 1,200 req/min from ${ip} on /api/search`,
    SUSPICIOUS_IP: `Suspicious IP ${ip} flagged by AbuseIPDB (score: ${Math.floor(Math.random() * 100)}%)`,
    PORT_SCAN: `Port scan detected from ${ip}: probing ports 1-65535`,
  };

  return {
    id: Math.random().toString(36).substring(7),
    type,
    severity,
    sourceIp: ip,
    description: descriptions[type],
    timestamp: new Date().toISOString(),
  };
}
