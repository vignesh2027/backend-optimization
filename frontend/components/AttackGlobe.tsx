'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

interface AttackEvent {
  id: string;
  type: string;
  severity: string;
  sourceIp: string;
  sourceCountry: string;
  sourceLat: number;
  sourceLng: number;
  destLat: number;
  destLng: number;
  destCountry: string;
  timestamp: string;
}

const TYPE_COLORS: Record<string, number> = {
  DDoS: 0xff2d55,
  MALWARE: 0xff9500,
  BRUTE_FORCE: 0x00f5ff,
  PHISHING: 0xbf5af2,
  PORT_SCAN: 0x39ff14,
  API_FLOOD: 0xffcc00,
};

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

export default function AttackGlobe() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [tooltip, setTooltip] = useState<(AttackEvent & { x: number; y: number }) | null>(null);
  const [recentEvents, setRecentEvents] = useState<AttackEvent[]>([]);
  const pausedRef = useRef(false);
  const filterRef = useRef('ALL');
  const socketRef = useRef<Socket | null>(null);

  pausedRef.current = paused;
  filterRef.current = filter;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Globe
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a0a2a,
      emissive: 0x000520,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Wireframe grid overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const wireGeo = new THREE.SphereGeometry(1.001, 32, 32);
    scene.add(new THREE.Mesh(wireGeo, wireMat));

    // Glow halo
    const glowGeo = new THREE.SphereGeometry(1.08, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Atmosphere
    const atmGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x001133,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Lighting
    scene.add(new THREE.AmbientLight(0x223366, 2));
    const dirLight = new THREE.DirectionalLight(0x00f5ff, 1);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Particles (stars)
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 3000; i++) {
      starVerts.push((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.6 })));

    // Arc management
    const arcs: { line: THREE.Line; progress: number; speed: number; event: AttackEvent }[] = [];

    function addArc(event: AttackEvent) {
      if (filterRef.current !== 'ALL' && filterRef.current !== event.type) return;

      const src = latLngToVec3(event.sourceLat, event.sourceLng, 1.01);
      const dst = latLngToVec3(event.destLat, event.destLng, 1.01);
      const mid = src.clone().add(dst).multiplyScalar(0.5).normalize().multiplyScalar(1.4);

      const curve = new THREE.QuadraticBezierCurve3(src, mid, dst);
      const pts = curve.getPoints(60);
      const geo = new THREE.BufferGeometry().setFromPoints(pts.slice(0, 1));

      const color = TYPE_COLORS[event.type] || 0x00f5ff;
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const line = new THREE.Line(geo, mat);
      scene.add(line);

      // Origin dot
      const dotGeo = new THREE.SphereGeometry(0.015, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(src);
      scene.add(dot);
      setTimeout(() => scene.remove(dot), 4000);

      arcs.push({ line, progress: 0, speed: 0.012 + Math.random() * 0.008, event });
      setTimeout(() => {
        scene.remove(line);
        const idx = arcs.findIndex((a) => a.line === line);
        if (idx !== -1) arcs.splice(idx, 1);
      }, 5000);
    }

    // WebSocket
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000');
    socketRef.current = socket;
    socket.on('attack-globe', (event: AttackEvent) => {
      if (!pausedRef.current) {
        addArc(event);
        setRecentEvents((prev) => [event, ...prev].slice(0, 5));
      }
    });

    // Auto-rotate
    let rotY = 0;
    let isDragging = false;
    let prevX = 0;
    let angularVel = 0.003;

    container.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; });
    window.addEventListener('mouseup', () => { isDragging = false; });
    container.addEventListener('mousemove', (e) => {
      if (isDragging) {
        angularVel = (e.clientX - prevX) * 0.005;
        prevX = e.clientX;
      }
    });

    // Animation loop
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      if (!pausedRef.current) {
        rotY += angularVel;
        angularVel *= 0.97;
        if (Math.abs(angularVel) < 0.001) angularVel = 0.003;
        globe.rotation.y = rotY;
      }

      // Grow arcs
      arcs.forEach((arc) => {
        if (pausedRef.current) return;
        arc.progress = Math.min(arc.progress + arc.speed, 1);
        const src = latLngToVec3(arc.event.sourceLat, arc.event.sourceLng, 1.01);
        const dst = latLngToVec3(arc.event.destLat, arc.event.destLng, 1.01);
        const mid = src.clone().add(dst).multiplyScalar(0.5).normalize().multiplyScalar(1.4);
        const curve = new THREE.QuadraticBezierCurve3(src, mid, dst);
        const count = Math.floor(arc.progress * 60) + 1;
        const pts = curve.getPoints(count);
        arc.line.geometry.setFromPoints(pts);
      });

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      socket.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', () => {});
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-4 left-4 glass-panel rounded-lg p-3 space-y-2">
        <button
          onClick={() => setPaused((p) => !p)}
          className={`w-full px-3 py-1.5 rounded text-xs font-mono border transition-all ${
            paused
              ? 'border-neon-green text-neon-green hover:bg-neon-green/10'
              : 'border-threat-red text-threat-red hover:bg-threat-red/10'
          }`}
        >
          {paused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>
        <div className="text-xs text-gray-500">FILTER:</div>
        {['ALL', 'DDoS', 'MALWARE', 'BRUTE_FORCE', 'PHISHING', 'PORT_SCAN'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`w-full px-2 py-1 rounded text-xs font-mono transition-all text-left ${
              filter === t ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Recent events */}
      <div className="absolute top-4 right-4 glass-panel rounded-lg p-3 w-72 space-y-1">
        <div className="text-xs text-neon-cyan mb-2 tracking-wider">RECENT ATTACKS</div>
        {recentEvents.length === 0 && (
          <div className="text-xs text-gray-600">Waiting for events...</div>
        )}
        {recentEvents.map((e) => (
          <div key={e.id} className="text-xs font-mono border-l-2 pl-2 py-0.5" style={{ borderColor: `#${(TYPE_COLORS[e.type] || 0x00f5ff).toString(16).padStart(6, '0')}` }}>
            <div className="text-gray-300">{e.sourceCountry} → {e.destCountry}</div>
            <div className="text-gray-500">{e.type} · {e.sourceIp}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-panel rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-2 tracking-wider">ATTACK TYPES</div>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-1">
            <div className="w-3 h-0.5 rounded" style={{ background: `#${color.toString(16).padStart(6, '0')}` }} />
            {type}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          className="absolute glass-panel rounded-lg p-3 text-xs font-mono pointer-events-none z-50"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
        >
          <div className="text-neon-cyan">{tooltip.sourceIp}</div>
          <div className="text-gray-400">{tooltip.sourceCountry} → {tooltip.destCountry}</div>
          <div className="text-threat-red">{tooltip.type}</div>
          <div className="text-gray-500">{tooltip.severity}</div>
        </div>
      )}
    </div>
  );
}
