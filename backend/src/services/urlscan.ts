import axios from 'axios';

const BASE = 'https://urlscan.io/api/v1';
const API_KEY = process.env.URLSCAN_API_KEY!;

const client = axios.create({
  baseURL: BASE,
  headers: { 'API-Key': API_KEY, 'Content-Type': 'application/json' },
});

export async function submitUrlScan(url: string) {
  const res = await client.post('/scan/', { url, visibility: 'public' });
  return res.data;
}

export async function getUrlScanResult(uuid: string): Promise<any> {
  await new Promise((r) => setTimeout(r, 10000));
  for (let i = 0; i < 12; i++) {
    try {
      const res = await client.get(`/result/${uuid}/`);
      const d = res.data;
      return {
        uuid,
        url: d.page?.url,
        domain: d.page?.domain,
        ip: d.page?.ip,
        country: d.page?.country,
        verdict: d.verdicts?.overall,
        screenshot: `https://urlscan.io/screenshots/${uuid}.png`,
        report: `https://urlscan.io/result/${uuid}/`,
        score: d.verdicts?.overall?.score || 0,
        malicious: d.verdicts?.overall?.malicious || false,
        tags: d.verdicts?.overall?.tags || [],
        categories: d.verdicts?.overall?.categories || [],
      };
    } catch {
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error('URLScan result timeout');
}
