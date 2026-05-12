'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TimelineBucket { minute: string; count: number; }
interface TopIp { ip: string; _count: { ip: number }; }
interface AbuseResult { ip: string; abuseScore: number; country: string; isp: string; totalReports: number; lastReported: string; }

export default function AbusePage() {
  const timelineRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);
  const [ipInput, setIpInput] = useState('');
  const [abuseResult, setAbuseResult] = useState<AbuseResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [stats, setStats] = useState<{ timeline: TimelineBucket[]; topIps: TopIp[] } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, blockedRes] = await Promise.all([
        axios.get(`${API}/api/abuse/stats`),
        axios.get(`${API}/api/abuse/blocked`),
      ]);
      setStats(statsRes.data);
      setBlocked(blockedRes.data.redisSet || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // D3 Timeline chart
  useEffect(() => {
    if (!timelineRef.current || !stats) return;
    const data = stats.timeline.slice(-30);
    const W = timelineRef.current.parentElement?.clientWidth || 600;
    const H = 160;
    const margin = { top: 10, right: 20, bottom: 30, left: 40 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(timelineRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map((_, i) => String(i))).range([0, iW]).padding(0.2);
    const maxY = Math.max(d3.max(data, (d) => d.count) || 0, 10);
    const y = d3.scaleLinear().domain([0, maxY * 1.2]).range([iH, 0]);

    // Threshold line (100 req/min = flood)
    const threshold = 100;
    if (threshold < maxY * 1.2) {
      g.append('line')
        .attr('x1', 0).attr('y1', y(threshold))
        .attr('x2', iW).attr('y2', y(threshold))
        .attr('stroke', '#ff2d55')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 1);
      g.append('text')
        .attr('x', iW - 4).attr('y', y(threshold) - 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#ff2d55')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text('FLOOD THRESHOLD');
    }

    // Area fill
    const area = d3.area<TimelineBucket>()
      .x((_, i) => x(String(i))! + x.bandwidth() / 2)
      .y0(iH)
      .y1((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('defs').append('linearGradient')
      .attr('id', 'area-grad')
      .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
      .selectAll('stop')
      .data([
        { offset: '0%', color: '#00f5ff', opacity: 0.3 },
        { offset: '100%', color: '#00f5ff', opacity: 0 },
      ])
      .join('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color)
      .attr('stop-opacity', (d) => d.opacity);

    g.append('path').datum(data).attr('d', area).attr('fill', 'url(#area-grad)');

    // Line
    const line = d3.line<TimelineBucket>()
      .x((_, i) => x(String(i))! + x.bandwidth() / 2)
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#00f5ff')
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0 0 4px #00f5ff)');

    // Axes
    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 5 === 0)).tickFormat((d) => {
        const bucket = data[parseInt(d)];
        return bucket ? new Date(bucket.minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      }))
      .call((ax) => ax.select('.domain').attr('stroke', 'rgba(0,245,255,0.2)'))
      .call((ax) => ax.selectAll('text').attr('fill', '#64748b').attr('font-size', '8px').attr('font-family', 'JetBrains Mono, monospace'))
      .call((ax) => ax.selectAll('line').attr('stroke', 'rgba(0,245,255,0.1)'));

    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call((ax) => ax.select('.domain').attr('stroke', 'rgba(0,245,255,0.2)'))
      .call((ax) => ax.selectAll('text').attr('fill', '#64748b').attr('font-size', '8px').attr('font-family', 'JetBrains Mono, monospace'))
      .call((ax) => ax.selectAll('line').attr('stroke', 'rgba(0,245,255,0.05)'));
  }, [stats]);

  // D3 Bar chart — top IPs
  useEffect(() => {
    if (!barRef.current || !stats?.topIps?.length) return;
    const data = stats.topIps.slice(0, 10);
    const W = barRef.current.parentElement?.clientWidth || 400;
    const H = 200;
    const margin = { top: 10, right: 20, bottom: 10, left: 130 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select(barRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(data.map((d) => d.ip)).range([0, iH]).padding(0.3);
    const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d._count.ip) || 1]).range([0, iW]);

    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('y', (d) => y(d.ip) || 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d._count.ip))
      .attr('fill', '#ff2d55')
      .attr('fill-opacity', 0.7)
      .attr('rx', 2)
      .attr('filter', 'drop-shadow(0 0 4px #ff2d55)');

    g.selectAll('.count-label')
      .data(data)
      .join('text')
      .attr('class', 'count-label')
      .attr('x', (d) => x(d._count.ip) + 4)
      .attr('y', (d) => (y(d.ip) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#ff2d55')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => d._count.ip);

    g.append('g')
      .call(d3.axisLeft(y))
      .call((ax) => ax.select('.domain').remove())
      .call((ax) => ax.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '9px').attr('font-family', 'JetBrains Mono, monospace'))
      .call((ax) => ax.selectAll('line').remove());
  }, [stats]);

  async function checkIp() {
    if (!ipInput.trim()) return;
    setChecking(true);
    setAbuseResult(null);
    try {
      const res = await axios.post(`${API}/api/abuse/check-ip`, { ip: ipInput.trim() });
      setAbuseResult(res.data);
    } catch {}
    setChecking(false);
  }

  async function unblockIp(ip: string) {
    await axios.delete(`${API}/api/abuse/blocked/${ip}`).catch(() => {});
    fetchStats();
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-neon-cyan text-lg font-bold tracking-widest text-glow-cyan cursor-blink">
          API ABUSE DETECTOR
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">Rate tracking · AbuseIPDB · auto-block · D3 analytics</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="glass-panel rounded-lg p-4 neon-border-cyan">
          <div className="text-xs text-gray-500 tracking-wider mb-3">REQUESTS / MINUTE (LAST 30 MIN)</div>
          <svg ref={timelineRef} className="w-full" />
        </div>

        {/* Top IPs */}
        <div className="glass-panel rounded-lg p-4 neon-border-red">
          <div className="text-xs text-gray-500 tracking-wider mb-3">TOP ABUSIVE IPs</div>
          {stats?.topIps?.length ? (
            <svg ref={barRef} className="w-full" />
          ) : (
            <div className="text-gray-600 text-xs py-8 text-center">No flagged IPs yet</div>
          )}
        </div>

        {/* IP Check */}
        <div className="glass-panel rounded-lg p-4 neon-border-cyan">
          <div className="text-xs text-gray-500 tracking-wider mb-3">ABUSEIPDB IP LOOKUP</div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkIp()}
              placeholder="Enter IP address..."
              className="flex-1 bg-transparent border border-cyber-border rounded px-3 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-neon-cyan/60"
            />
            <button
              onClick={checkIp}
              disabled={checking}
              className="px-4 py-1.5 rounded border border-neon-cyan text-neon-cyan text-xs font-mono hover:bg-neon-cyan/10 disabled:opacity-40"
            >
              {checking ? '⟳' : 'CHECK'}
            </button>
          </div>

          {abuseResult && (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: abuseResult.abuseScore > 70 ? '#ff2d55' : abuseResult.abuseScore > 30 ? '#ff9500' : '#39ff14',
                  }}
                >
                  {abuseResult.abuseScore}%
                </div>
                <div>
                  <div className="text-gray-300">ABUSE CONFIDENCE</div>
                  <div className="text-gray-600">{abuseResult.country} · {abuseResult.isp}</div>
                </div>
              </div>
              {[
                { k: 'Total Reports', v: abuseResult.totalReports },
                { k: 'Last Reported', v: abuseResult.lastReported ? new Date(abuseResult.lastReported).toLocaleDateString() : 'Never' },
                { k: 'Country', v: abuseResult.country },
                { k: 'ISP', v: abuseResult.isp },
              ].map((r) => (
                <div key={r.k} className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-500">{r.k}</span>
                  <span className="text-gray-200">{String(r.v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blocked IPs */}
        <div className="glass-panel rounded-lg p-4 neon-border-red">
          <div className="text-xs text-gray-500 tracking-wider mb-3">
            BLOCKED IPs ({blocked.length})
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto terminal-scroll">
            {blocked.length === 0 && <div className="text-gray-600 text-xs py-4 text-center">No blocked IPs</div>}
            {blocked.map((ip) => (
              <div key={ip} className="flex items-center justify-between px-2 py-1 rounded bg-threat-red/5 border border-threat-red/20 text-xs font-mono">
                <span className="text-threat-red">{ip}</span>
                <button
                  onClick={() => unblockIp(ip)}
                  className="text-gray-600 hover:text-neon-green text-xs transition-colors"
                >
                  UNBLOCK
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
