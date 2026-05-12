'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TimelineEvent { timestamp: string; description: string; }
interface Incident {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'DETECTED' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  attackType: string;
  sourceIps: string[];
  affectedSystems: string[];
  timelineEvents: TimelineEvent[];
  summary?: string;
  detectedAt: string;
  investigatedAt?: string;
  containedAt?: string;
  resolvedAt?: string;
}

const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#ff2d55',
  HIGH: '#ff9500',
  MEDIUM: '#ffcc00',
  LOW: '#39ff14',
};

const STATUS_FLOW = ['DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'] as const;

const STATUS_COLORS: Record<string, string> = {
  DETECTED: '#ff2d55',
  INVESTIGATING: '#ff9500',
  CONTAINED: '#ffcc00',
  RESOLVED: '#39ff14',
};

const ATTACK_ICONS: Record<string, string> = {
  DDOS: '⚡',
  RANSOMWARE: '💀',
  PHISHING: '🎣',
  BRUTE_FORCE: '🔨',
  DATA_EXFILTRATION: '📤',
  INSIDER_THREAT: '👤',
  MALWARE: '☣',
  PORT_SCAN: '🔍',
  API_FLOOD: '🌊',
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    severity: 'HIGH',
    attackType: 'DDOS',
    sourceIps: '',
    affectedSystems: '',
  });

  async function fetchIncidents() {
    const res = await axios.get(`${API}/api/incidents`).catch(() => ({ data: [] }));
    setIncidents(res.data);
  }

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, status: string) {
    await axios.patch(`${API}/api/incidents/${id}/status`, { status });
    fetchIncidents();
    if (selected?.id === id) {
      const res = await axios.get(`${API}/api/incidents/${id}`);
      setSelected(res.data);
    }
  }

  async function summarize(id: string) {
    setSummarizing(true);
    try {
      const res = await axios.post(`${API}/api/incidents/${id}/summarize`);
      setSelected((prev) => prev ? { ...prev, summary: res.data.summary } : prev);
      fetchIncidents();
    } catch {}
    setSummarizing(false);
  }

  async function seedData() {
    setSeeding(true);
    await axios.post(`${API}/api/incidents/seed`).catch(() => {});
    fetchIncidents();
    setSeeding(false);
  }

  async function createIncident() {
    if (!newIncident.title) return;
    const payload = {
      ...newIncident,
      sourceIps: newIncident.sourceIps.split(',').map((s) => s.trim()).filter(Boolean),
      affectedSystems: newIncident.affectedSystems.split(',').map((s) => s.trim()).filter(Boolean),
      timelineEvents: [{ timestamp: new Date().toISOString(), description: 'Incident created' }],
    };
    await axios.post(`${API}/api/incidents`, payload).catch(() => {});
    setCreating(false);
    setNewIncident({ title: '', severity: 'HIGH', attackType: 'DDOS', sourceIps: '', affectedSystems: '' });
    fetchIncidents();
  }

  const criticalFirst = [...incidents].sort((a, b) => {
    const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (sevOrder[a.severity] || 3) - (sevOrder[b.severity] || 3);
  });

  return (
    <div className="flex h-screen">
      {/* Incident list */}
      <div className="w-96 flex-shrink-0 border-r flex flex-col" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-neon-cyan text-sm font-bold tracking-widest text-glow-cyan">INCIDENT CENTER</h1>
              <p className="text-gray-600 text-xs">SOC command · Gemini AI · priority queue</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setCreating(true)}
              className="flex-1 px-2 py-1.5 rounded border border-neon-cyan text-neon-cyan text-xs font-mono hover:bg-neon-cyan/10"
            >
              + NEW
            </button>
            <button
              onClick={seedData}
              disabled={seeding}
              className="flex-1 px-2 py-1.5 rounded border border-gray-600 text-gray-400 text-xs font-mono hover:border-gray-400 disabled:opacity-40"
            >
              {seeding ? '⟳ SEEDING' : '⚡ SEED DEMO'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto terminal-scroll p-2 space-y-1.5">
          {criticalFirst.length === 0 && (
            <div className="text-gray-600 text-xs text-center py-8">
              No incidents. Click "SEED DEMO" to load samples.
            </div>
          )}
          {criticalFirst.map((inc) => (
            <motion.div
              key={inc.id}
              whileHover={{ x: 3 }}
              onClick={() => setSelected(inc)}
              className={`p-3 rounded cursor-pointer border transition-all ${
                selected?.id === inc.id
                  ? 'border-neon-cyan/40 bg-neon-cyan/5'
                  : 'border-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">{ATTACK_ICONS[inc.attackType] || '⚠'}</span>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-200 truncate">{inc.title}</div>
                    <div className="text-xs text-gray-600">{inc.attackType}</div>
                  </div>
                </div>
                <span
                  className="text-xs px-1.5 py-0.5 rounded border flex-shrink-0"
                  style={{ color: SEV_COLORS[inc.severity], borderColor: `${SEV_COLORS[inc.severity]}40`, background: `${SEV_COLORS[inc.severity]}10` }}
                >
                  {inc.severity}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: STATUS_COLORS[inc.status], background: `${STATUS_COLORS[inc.status]}15` }}
                >
                  {inc.status}
                </span>
                <span className="text-xs text-gray-600">{new Date(inc.detectedAt).toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-6 terminal-scroll">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm font-mono">
            ← Select an incident to view details
          </div>
        ) : (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Title */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{ATTACK_ICONS[selected.attackType] || '⚠'}</span>
                  <h2 className="text-white text-lg font-bold">{selected.title}</h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: SEV_COLORS[selected.severity] }}>{selected.severity}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400">{selected.attackType}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-600">ID: {selected.id.slice(0, 8)}</span>
                </div>
              </div>
              <button
                onClick={() => summarize(selected.id)}
                disabled={summarizing}
                className="px-4 py-2 rounded border border-neon-cyan text-neon-cyan text-xs font-mono hover:bg-neon-cyan/10 disabled:opacity-40 flex items-center gap-2"
              >
                {summarizing ? '⟳ Generating...' : '✦ AI SUMMARY'}
              </button>
            </div>

            {/* AI Summary */}
            {selected.summary && (
              <div className="glass-panel rounded-lg p-4 border" style={{ borderColor: 'rgba(191,90,242,0.3)', background: 'rgba(191,90,242,0.05)' }}>
                <div className="text-xs text-gray-500 mb-2 tracking-wider">✦ GEMINI AI ANALYSIS</div>
                <p className="text-gray-200 text-sm leading-relaxed">{selected.summary}</p>
              </div>
            )}

            {/* Status workflow */}
            <div className="glass-panel rounded-lg p-4">
              <div className="text-xs text-gray-500 tracking-wider mb-3">STATUS WORKFLOW</div>
              <div className="flex items-center gap-2">
                {STATUS_FLOW.map((status, i) => {
                  const isCurrent = selected.status === status;
                  const isPast = STATUS_FLOW.indexOf(selected.status) > i;
                  return (
                    <div key={status} className="flex items-center gap-2">
                      <button
                        onClick={() => !isCurrent && updateStatus(selected.id, status)}
                        className="px-3 py-1.5 rounded text-xs font-mono border transition-all"
                        style={
                          isCurrent
                            ? { color: STATUS_COLORS[status], borderColor: `${STATUS_COLORS[status]}60`, background: `${STATUS_COLORS[status]}15` }
                            : isPast
                            ? { color: '#4a5568', borderColor: '#2d3748' }
                            : { color: '#64748b', borderColor: '#374151', cursor: 'pointer' }
                        }
                      >
                        {isCurrent && '▶ '}{status}
                      </button>
                      {i < STATUS_FLOW.length - 1 && <span className="text-gray-700">→</span>}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono text-gray-600">
                {selected.detectedAt && <div>Detected: {new Date(selected.detectedAt).toLocaleString()}</div>}
                {selected.investigatedAt && <div>Investigated: {new Date(selected.investigatedAt).toLocaleString()}</div>}
                {selected.containedAt && <div>Contained: {new Date(selected.containedAt).toLocaleString()}</div>}
                {selected.resolvedAt && <div>Resolved: {new Date(selected.resolvedAt).toLocaleString()}</div>}
              </div>
            </div>

            {/* Source IPs + Affected systems */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-lg p-4">
                <div className="text-xs text-gray-500 tracking-wider mb-3">SOURCE IPs</div>
                <div className="space-y-1">
                  {selected.sourceIps.map((ip) => (
                    <div key={ip} className="text-xs font-mono text-threat-red bg-threat-red/5 border border-threat-red/20 px-2 py-1 rounded">{ip}</div>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <div className="text-xs text-gray-500 tracking-wider mb-3">AFFECTED SYSTEMS</div>
                <div className="space-y-1">
                  {selected.affectedSystems.map((sys) => (
                    <div key={sys} className="text-xs font-mono text-threat-amber bg-threat-amber/5 border border-threat-amber/20 px-2 py-1 rounded">{sys}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-panel rounded-lg p-4">
              <div className="text-xs text-gray-500 tracking-wider mb-3">INCIDENT TIMELINE</div>
              <div className="space-y-3">
                {selected.timelineEvents.map((ev: TimelineEvent, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-neon-cyan" style={{ boxShadow: '0 0 6px #00f5ff' }} />
                      {i < selected.timelineEvents.length - 1 && <div className="w-px flex-1 bg-neon-cyan/20 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <div className="text-xs text-gray-600">{new Date(ev.timestamp).toLocaleString()}</div>
                      <div className="text-xs text-gray-300 mt-0.5">{ev.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create incident modal */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel rounded-lg p-6 w-full max-w-md neon-border-cyan"
            >
              <h3 className="text-neon-cyan text-sm font-bold tracking-wider mb-4">CREATE INCIDENT</h3>
              <div className="space-y-3">
                {[
                  { key: 'title', label: 'TITLE', placeholder: 'Describe the incident...' },
                  { key: 'sourceIps', label: 'SOURCE IPs (comma-separated)', placeholder: '1.2.3.4, 5.6.7.8' },
                  { key: 'affectedSystems', label: 'AFFECTED SYSTEMS (comma-separated)', placeholder: 'api-server, db-01' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                    <input
                      type="text"
                      value={(newIncident as any)[f.key]}
                      onChange={(e) => setNewIncident((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-transparent border border-cyber-border rounded px-3 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-neon-cyan/60"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'severity', label: 'SEVERITY', opts: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                    { key: 'attackType', label: 'ATTACK TYPE', opts: ['DDOS', 'RANSOMWARE', 'PHISHING', 'BRUTE_FORCE', 'DATA_EXFILTRATION', 'INSIDER_THREAT', 'MALWARE', 'PORT_SCAN', 'API_FLOOD'] },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                      <select
                        value={(newIncident as any)[f.key]}
                        onChange={(e) => setNewIncident((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full bg-cyber-dark border border-cyber-border rounded px-2 py-1.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-neon-cyan/60"
                      >
                        {f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={createIncident} className="flex-1 py-2 rounded border border-neon-cyan text-neon-cyan text-xs font-mono hover:bg-neon-cyan/10">
                  CREATE
                </button>
                <button onClick={() => setCreating(false)} className="flex-1 py-2 rounded border border-gray-600 text-gray-400 text-xs font-mono hover:border-gray-400">
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
