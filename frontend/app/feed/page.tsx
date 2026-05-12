'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

interface ThreatEvent {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceIp: string;
  description: string;
  timestamp: string;
}

const TYPE_ICONS: Record<string, string> = {
  MALWARE_DETECTED: '☣',
  DDOS_SURGE: '⚡',
  BRUTE_FORCE: '🔨',
  API_FLOOD: '🌊',
  SUSPICIOUS_IP: '👁',
  PORT_SCAN: '🔍',
};

const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#ff2d55',
  HIGH: '#ff9500',
  MEDIUM: '#ffcc00',
  LOW: '#39ff14',
};

const SEV_CLASSES: Record<string, string> = {
  CRITICAL: 'badge-critical',
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
};

export default function FeedPage() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [soundOn, setSoundOn] = useState(false);
  const [paused, setPaused] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const soundRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  pausedRef.current = paused;
  soundRef.current = soundOn;

  function playAlert() {
    if (!soundRef.current) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000');
    socket.on('threat-events', (event: ThreatEvent) => {
      if (pausedRef.current) return;
      setEvents((prev) => [event, ...prev].slice(0, 200));
      if (event.severity === 'CRITICAL') playAlert();
    });
    return () => { socket.disconnect(); };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!paused && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events, paused]);

  const filtered = events.filter((e) => {
    if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
    if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    CRITICAL: events.filter((e) => e.severity === 'CRITICAL').length,
    HIGH: events.filter((e) => e.severity === 'HIGH').length,
    total: events.length,
  };

  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-neon-cyan text-lg font-bold tracking-widest text-glow-cyan cursor-blink">
              LIVE THREAT FEED
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">Redis pub/sub · Socket.io · real-time event stream</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="glass-panel px-3 py-1.5 rounded">
              <span className="text-gray-500">EVENTS</span>
              <span className="text-neon-cyan ml-2">{stats.total}</span>
            </div>
            <div className="glass-panel px-3 py-1.5 rounded">
              <span className="text-gray-500">CRITICAL</span>
              <span className="text-threat-red ml-2">{stats.CRITICAL}</span>
            </div>
            <button
              onClick={() => setPaused((p) => !p)}
              className={`px-3 py-1.5 rounded border text-xs font-mono ${paused ? 'border-neon-green text-neon-green' : 'border-threat-amber text-threat-amber'}`}
            >
              {paused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
            <button
              onClick={() => setSoundOn((s) => !s)}
              className={`px-3 py-1.5 rounded border text-xs font-mono ${soundOn ? 'border-neon-cyan text-neon-cyan' : 'border-gray-600 text-gray-600'}`}
            >
              {soundOn ? '🔔 SOUND ON' : '🔕 MUTED'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
                severityFilter === sev
                  ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['ALL', 'MALWARE_DETECTED', 'DDOS_SURGE', 'BRUTE_FORCE', 'API_FLOOD', 'SUSPICIOUS_IP', 'PORT_SCAN'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 rounded text-xs font-mono border transition-all ${
                typeFilter === t
                  ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'ALL' ? 'ALL TYPES' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="flex-1 glass-panel rounded-lg overflow-y-auto terminal-scroll p-3 neon-border-cyan"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {filtered.length === 0 && (
          <div className="text-gray-600 text-xs text-center py-8">
            <div className="text-2xl mb-2">📡</div>
            <div>Waiting for threat events...</div>
            <div className="text-gray-700 mt-1">WebSocket connected · Redis subscribed</div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {filtered.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="threat-item mb-1"
              style={{ borderColor: SEV_COLORS[event.severity] }}
            >
              <div className="flex items-start gap-3">
                <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICONS[event.type] || '⚠'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-600 text-xs">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    <span className={SEV_CLASSES[event.severity]}>{event.severity}</span>
                    <span className="text-neon-cyan text-xs">{event.sourceIp}</span>
                    <span className="text-gray-500 text-xs">{event.type}</span>
                  </div>
                  <div className="text-gray-300 text-xs mt-0.5">{event.description}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2">
        {Object.entries(SEV_COLORS).map(([sev, color]) => {
          const count = events.filter((e) => e.severity === sev).length;
          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
          return (
            <div key={sev} className="flex-1 glass-panel rounded p-2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span style={{ color }}>{sev}</span>
                <span className="text-gray-400">{count}</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
