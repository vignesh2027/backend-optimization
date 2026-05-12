import axios from 'axios';

const VT_BASE = 'https://www.virustotal.com/api/v3';
const API_KEY = process.env.VIRUSTOTAL_API_KEY!;

const vt = axios.create({
  baseURL: VT_BASE,
  headers: { 'x-apikey': API_KEY },
});

export async function lookupHash(hash: string) {
  const res = await vt.get(`/files/${hash}`);
  const data = res.data.data.attributes;
  const stats = data.last_analysis_stats;
  const engines = data.last_analysis_results;

  const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0);
  const malicious = stats.malicious + stats.suspicious;

  const engineResults = Object.entries(engines).map(([engine, result]: [string, any]) => ({
    engine,
    category: result.category,
    result: result.result,
  }));

  return {
    hash,
    name: data.meaningful_name || hash,
    type: data.type_description,
    size: data.size,
    stats,
    total,
    malicious,
    score: (malicious / Math.max(total, 1)) * 100,
    engines: engineResults,
    tags: data.tags || [],
    firstSeen: data.first_submission_date,
    lastSeen: data.last_submission_date,
  };
}

export async function scanUrl(url: string) {
  const encoded = btoa(url).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  try {
    const res = await vt.get(`/urls/${encoded}`);
    const data = res.data.data.attributes;
    const stats = data.last_analysis_stats;
    const malicious = stats.malicious + stats.suspicious;
    const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0);
    return { url, stats, score: (malicious / Math.max(total, 1)) * 100 };
  } catch {
    const body = new URLSearchParams({ url });
    const submit = await vt.post('/urls', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { url, submitted: true, id: submit.data.data.id };
  }
}
