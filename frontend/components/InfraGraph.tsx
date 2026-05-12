'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  cpu: number;
  memory: number;
  latencyP99: number;
  traffic: number;
  riskScore: number;
  openPorts: number[];
}

interface Link {
  source: string | Node;
  target: string | Node;
  load: number;
}

function riskColor(score: number): string {
  if (score < 20) return '#39ff14';
  if (score < 50) return '#ff9500';
  return '#ff2d55';
}

const TYPE_ICONS: Record<string, string> = {
  loadbalancer: 'LB',
  api: 'API',
  server: 'SRV',
  database: 'DB',
  cache: 'RD',
  cdn: 'CDN',
  worker: 'WRK',
  monitoring: 'MON',
};

export default function InfraGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<Node | null>(null);
  const [data, setData] = useState<{ nodes: Node[]; links: Link[] } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/infrastructure/topology`);
      setData(res.data);
    } catch {
      // Use mock data if API unreachable
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const container = svgRef.current.parentElement!;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    const g = svg.append('g');

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Simulation
    const sim = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.links).id((d) => d.id).distance(120).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Links
    const link = g.append('g').selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', (d) => d.load > 0.7 ? '#ff9500' : 'rgba(0,245,255,0.25)')
      .attr('stroke-width', (d) => d.load * 4 + 0.5)
      .attr('stroke-opacity', 0.7);

    // Pulse effect on high-load links
    function animateLinks() {
      link.filter((d) => d.load > 0.6)
        .transition().duration(800)
        .attr('stroke-opacity', 0.3)
        .transition().duration(800)
        .attr('stroke-opacity', 0.9)
        .on('end', function() { animateLinks(); });
    }
    animateLinks();

    // Nodes
    const nodeGroup = g.append('g').selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, Node>()
          .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (_event, d) => setSelected(d));

    // Node glow ring
    nodeGroup.append('circle')
      .attr('r', (d) => 20 + (d.traffic / 1000))
      .attr('fill', 'none')
      .attr('stroke', (d) => riskColor(d.riskScore))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.3)
      .attr('filter', (d) => `drop-shadow(0 0 8px ${riskColor(d.riskScore)})`);

    // Node circle
    nodeGroup.append('circle')
      .attr('r', (d) => 16 + (d.traffic / 1500))
      .attr('fill', (d) => `${riskColor(d.riskScore)}18`)
      .attr('stroke', (d) => riskColor(d.riskScore))
      .attr('stroke-width', 2);

    // Node label
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', (d) => riskColor(d.riskScore))
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', 'bold')
      .text((d) => TYPE_ICONS[d.type] || d.type.slice(0, 3).toUpperCase());

    // Node name below
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => 28 + d.traffic / 1500)
      .attr('fill', '#94a3b8')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text((d) => d.label);

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as Node).x!)
        .attr('y1', (d) => (d.source as Node).y!)
        .attr('x2', (d) => (d.target as Node).x!)
        .attr('y2', (d) => (d.target as Node).y!);
      nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [data]);

  return (
    <div className="flex w-full h-full">
      <svg ref={svgRef} className="flex-1" style={{ background: 'transparent' }} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-panel rounded-lg p-3 text-xs font-mono space-y-1">
        <div className="text-gray-500 mb-2 tracking-wider">RISK LEVEL</div>
        {[{ color: '#39ff14', label: 'LOW (0–20)' }, { color: '#ff9500', label: 'MEDIUM (20–50)' }, { color: '#ff2d55', label: 'HIGH (50+)' }].map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
            <span className="text-gray-400">{r.label}</span>
          </div>
        ))}
        <div className="text-gray-600 pt-1 border-t border-gray-800">Node size = traffic volume</div>
      </div>

      {/* Selected node panel */}
      {selected && (
        <div className="w-72 glass-panel border-l flex-shrink-0 p-4 overflow-y-auto" style={{ borderColor: 'rgba(0,245,255,0.15)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-neon-cyan text-sm font-bold">{selected.label}</div>
              <div className="text-gray-500 text-xs">{selected.id}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
          </div>

          <div
            className="text-center py-2 rounded mb-4 text-sm font-bold font-mono"
            style={{
              color: riskColor(selected.riskScore),
              background: `${riskColor(selected.riskScore)}15`,
              border: `1px solid ${riskColor(selected.riskScore)}40`,
            }}
          >
            RISK SCORE: {selected.riskScore.toFixed(1)}
          </div>

          {[
            { label: 'CPU Usage', value: `${selected.cpu.toFixed(1)}%`, warn: selected.cpu > 80 },
            { label: 'Memory', value: `${selected.memory.toFixed(1)}%`, warn: selected.memory > 85 },
            { label: 'Latency P99', value: `${selected.latencyP99.toFixed(0)}ms`, warn: selected.latencyP99 > 200 },
            { label: 'Traffic/min', value: selected.traffic.toFixed(0), warn: false },
          ].map((m) => (
            <div key={m.label} className="flex justify-between items-center py-1.5 border-b border-gray-800 text-xs font-mono">
              <span className="text-gray-500">{m.label}</span>
              <span className={m.warn ? 'text-threat-red' : 'text-gray-200'}>{m.value}</span>
            </div>
          ))}

          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-2">OPEN PORTS</div>
            <div className="flex flex-wrap gap-1">
              {selected.openPorts.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan text-xs border border-neon-cyan/20">{p}</span>
              ))}
            </div>
          </div>

          {/* CPU bar */}
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">CPU LOAD</div>
            <div className="h-1.5 bg-gray-800 rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${selected.cpu}%`,
                  background: selected.cpu > 80 ? '#ff2d55' : selected.cpu > 60 ? '#ff9500' : '#39ff14',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
