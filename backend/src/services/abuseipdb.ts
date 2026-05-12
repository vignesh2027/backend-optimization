import axios from 'axios';

const BASE = 'https://api.abuseipdb.com/api/v2';
const API_KEY = process.env.ABUSEIPDB_API_KEY!;

const client = axios.create({
  baseURL: BASE,
  headers: { Key: API_KEY, Accept: 'application/json' },
});

export async function checkIp(ip: string) {
  const res = await client.get('/check', {
    params: { ipAddress: ip, maxAgeInDays: 90, verbose: true },
  });
  const d = res.data.data;
  return {
    ip: d.ipAddress,
    isPublic: d.isPublic,
    version: d.ipVersion,
    isWhitelisted: d.isWhitelisted,
    abuseScore: d.abuseConfidenceScore,
    country: d.countryCode,
    isp: d.isp,
    domain: d.domain,
    hostnames: d.hostnames,
    totalReports: d.totalReports,
    numDistinctUsers: d.numDistinctUsers,
    lastReported: d.lastReportedAt,
    reports: (d.reports || []).slice(0, 10),
  };
}

export async function reportIp(ip: string, categories: number[], comment: string) {
  const res = await client.post(
    '/report',
    new URLSearchParams({ ip, categories: categories.join(','), comment }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data;
}
