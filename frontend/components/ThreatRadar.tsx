'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  data: Record<string, number>;
}

export default function ThreatRadar({ data }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const W = 320;
    const H = 320;
    const cx = W / 2;
    const cy = H / 2;
    const R = 120;
    const levels = 5;

    const keys = Object.keys(data);
    const N = keys.length;
    const angleSlice = (Math.PI * 2) / N;

    const maxVal = 100;
    const rScale = d3.scaleLinear().range([0, R]).domain([0, maxVal]);

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    // Grid circles
    for (let l = 1; l <= levels; l++) {
      g.append('circle')
        .attr('r', (R / levels) * l)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(0,245,255,0.1)')
        .attr('stroke-dasharray', '3,3');
    }

    // Axis lines
    keys.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', R * Math.cos(angle))
        .attr('y2', R * Math.sin(angle))
        .attr('stroke', 'rgba(0,245,255,0.15)')
        .attr('stroke-width', 1);
    });

    // Labels
    keys.forEach((key, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const lx = (R + 24) * Math.cos(angle);
      const ly = (R + 24) * Math.sin(angle);
      g.append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(key.toUpperCase());
    });

    // Data polygon
    const points = keys.map((key, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const val = data[key] ?? 0;
      const r = rScale(Math.min(val, maxVal));
      return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number];
    });

    const avgScore = Object.values(data).reduce((a, b) => a + b, 0) / N;
    const fillColor = avgScore > 60 ? '#ff2d55' : avgScore > 30 ? '#ff9500' : '#39ff14';

    const lineGen = d3.line<[number, number]>().x((d) => d[0]).y((d) => d[1]).curve(d3.curveLinearClosed);

    g.append('path')
      .datum([...points, points[0]])
      .attr('d', lineGen as any)
      .attr('fill', fillColor)
      .attr('fill-opacity', 0.15)
      .attr('stroke', fillColor)
      .attr('stroke-width', 2)
      .attr('filter', `drop-shadow(0 0 6px ${fillColor})`);

    // Data dots
    points.forEach(([x, y], i) => {
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', fillColor)
        .attr('filter', `drop-shadow(0 0 4px ${fillColor})`);

      // Value label
      g.append('text')
        .attr('x', x * 1.15)
        .attr('y', y * 1.15)
        .attr('text-anchor', 'middle')
        .attr('fill', fillColor)
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .text(`${Math.round(data[keys[i]])}%`);
    });

    svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%').attr('height', '100%');
  }, [data]);

  return <svg ref={ref} className="w-full" style={{ maxHeight: 320 }} />;
}
