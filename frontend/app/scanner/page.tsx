'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import axios from 'axios';

const ThreatRadar = dynamic(() => import('../../components/ThreatRadar'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Verdict = 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'CRITICAL';
type ScanMode = 'file' | 'url' | 'hash';

interface ScanResult {
  verdict: Verdict;
  score?: number;
  stats?: Record<string, number>;
  engines?: { engine: string; category: string; result: string }[];
  screenshot?: string;
  report?: string;
  clean?: boolean;
  virus?: string;
  malicious?: boolean;
  tags?: string[];
  categories?: string[];
  [key: string]: any;
}

const VERDICT_STYLES: Record<Verdict, { label: string; cls: string; glow: string }> = {
  CLEAN: { label: '✓ CLEAN', cls: 'badge-clean', glow: '0 0 20px rgba(57,255,20,0.4)' },
  SUSPICIOUS: { label: '⚠ SUSPICIOUS', cls: 'badge-suspicious', glow: '0 0 20px rgba(255,204,0,0.4)' },
  MALICIOUS: { label: '✗ MALICIOUS', cls: 'badge-malicious', glow: '0 0 20px rgba(255,149,0,0.4)' },
  CRITICAL: { label: '☠ CRITICAL', cls: 'badge-malicious-crit', glow: '0 0 30px rgba(255,45,85,0.6)' },
};

function buildRadarData(result: ScanResult, mode: ScanMode) {
  const stats = result.stats || {};
  const total = Object.values(stats).reduce((a: number, b) => a + (b as number), 0) || 1;
  const mal = ((stats.malicious || 0) / total) * 100;
  const sus = ((stats.suspicious || 0) / total) * 100;

  if (mode === 'file') {
    return {
      Malware: result.clean ? 0 : 100,
      Phishing: 0,
      Spam: 0,
      Botnet: 0,
      Reputation: result.clean ? 5 : 80,
      Behavioral: result.clean ? 0 : 70,
    };
  }
  return {
    Malware: mal,
    Phishing: result.malicious ? 60 : sus * 0.3,
    Spam: sus * 0.4,
    Botnet: mal * 0.5,
    Reputation: result.score || 0,
    Behavioral: (mal + sus) / 2,
  };
}

export default function ScannerPage() {
  const [mode, setMode] = useState<ScanMode>('hash');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function runScan() {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      let res;
      if (mode === 'hash') {
        res = await axios.post(`${API}/api/scan/hash`, { hash: input.trim() });
      } else if (mode === 'url') {
        res = await axios.post(`${API}/api/scan/url`, { url: input.trim() });
      } else {
        const file = fileRef.current?.files?.[0];
        if (!file) throw new Error('Select a file first');
        const fd = new FormData();
        fd.append('file', file);
        res = await axios.post(`${API}/api/scan/file`, fd);
      }
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  }

  const radarData = result ? buildRadarData(result, mode) : null;
  const verdict = result?.verdict as Verdict | undefined;

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-neon-cyan text-lg font-bold tracking-widest text-glow-cyan cursor-blink">
          THREAT SCANNER
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">ClamAV · VirusTotal · URLScan.io · D3 radar analysis</p>
      </motion.div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {(['hash', 'url', 'file'] as ScanMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setError(''); }}
            className={`px-4 py-2 rounded text-xs font-mono tracking-wider border transition-all ${
              mode === m
                ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                : 'border-cyber-border text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            {m === 'hash' ? '# HASH LOOKUP' : m === 'url' ? '🔗 URL SCAN' : '📁 FILE SCAN'}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="glass-panel rounded-lg p-4 neon-border-cyan space-y-3">
        {mode === 'file' ? (
          <div>
            <label className="block text-xs text-gray-500 mb-2">SELECT FILE FOR CLAMAV SCAN</label>
            <input
              ref={fileRef}
              type="file"
              className="text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-neon-cyan/40 file:bg-neon-cyan/10 file:text-neon-cyan file:text-xs file:font-mono file:cursor-pointer"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs text-gray-500 mb-2">
              {mode === 'hash' ? 'MD5 / SHA-1 / SHA-256 HASH' : 'URL TO SCAN'}
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runScan()}
              placeholder={mode === 'hash' ? '44d88612fea8a8f36de82e1278abb02f' : 'https://example.com'}
              className="w-full bg-transparent border border-cyber-border rounded px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-neon-cyan/60 transition-colors"
            />
          </div>
        )}
        <button
          onClick={runScan}
          disabled={loading}
          className="px-6 py-2 rounded text-xs font-mono tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ boxShadow: loading ? 'none' : '0 0 15px rgba(0,245,255,0.2)' }}
        >
          {loading ? '⟳ SCANNING...' : '▶ RUN SCAN'}
        </button>
        {error && <div className="text-threat-red text-xs font-mono">⚠ {error}</div>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && verdict && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Verdict + details */}
            <div className="glass-panel rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 tracking-wider">VERDICT</span>
                <span
                  className={`text-lg font-bold font-mono px-4 py-1 rounded ${VERDICT_STYLES[verdict].cls}`}
                  style={{ boxShadow: VERDICT_STYLES[verdict].glow }}
                >
                  {VERDICT_STYLES[verdict].label}
                </span>
              </div>

              {result.score !== undefined && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">THREAT SCORE</span>
                    <span className="text-neon-cyan">{result.score.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.score}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: result.score > 70 ? '#ff2d55' : result.score > 30 ? '#ff9500' : '#39ff14',
                      }}
                    />
                  </div>
                </div>
              )}

              {result.stats && (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {Object.entries(result.stats).map(([k, v]) => (
                    <div key={k} className="flex justify-between glass-panel px-2 py-1 rounded">
                      <span className="text-gray-500">{k.toUpperCase()}</span>
                      <span className={k === 'malicious' ? 'text-threat-red' : k === 'suspicious' ? 'text-threat-amber' : 'text-gray-300'}>
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.screenshot && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">URLSCAN SCREENSHOT</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.screenshot} alt="URL scan" className="rounded border border-cyber-border w-full" />
                  <a href={result.report} target="_blank" rel="noopener noreferrer" className="text-neon-cyan text-xs mt-1 block hover:underline">
                    → Full Report
                  </a>
                </div>
              )}

              {result.virus && (
                <div className="border border-threat-red/30 rounded p-3 bg-threat-red/5">
                  <div className="text-xs text-gray-500 mb-1">DETECTED VIRUS</div>
                  <div className="text-threat-red text-sm font-mono">{result.virus}</div>
                </div>
              )}

              {result.tags && result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.tags.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* D3 Radar */}
            <div className="glass-panel rounded-lg p-5">
              <div className="text-xs text-gray-500 tracking-wider mb-4">THREAT DIMENSION ANALYSIS</div>
              {radarData && <ThreatRadar data={radarData} />}
            </div>

            {/* Engine results */}
            {result.engines && result.engines.length > 0 && (
              <div className="lg:col-span-2 glass-panel rounded-lg p-5">
                <div className="text-xs text-gray-500 tracking-wider mb-3">
                  ENGINE RESULTS ({result.positives || 0}/{result.engineCount || result.engines.length} detections)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto terminal-scroll">
                  {result.engines.map((e: any) => (
                    <div
                      key={e.engine}
                      className={`flex items-center gap-2 p-2 rounded text-xs font-mono ${
                        e.category === 'malicious' || e.category === 'suspicious'
                          ? 'bg-threat-red/10 border border-threat-red/20'
                          : 'bg-gray-900/50 border border-gray-800'
                      }`}
                    >
                      <span className={e.category === 'malicious' ? 'text-threat-red' : e.category === 'suspicious' ? 'text-threat-amber' : 'text-neon-green'}>
                        {e.category === 'malicious' ? '✗' : e.category === 'suspicious' ? '!' : '✓'}
                      </span>
                      <div>
                        <div className="text-gray-300 truncate max-w-[100px]">{e.engine}</div>
                        {e.result && <div className="text-gray-600 text-xs truncate max-w-[100px]">{e.result}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
