'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const AttackGlobe = dynamic(() => import('../components/AttackGlobe'), { ssr: false });

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 border-b glass-panel"
        style={{ borderColor: 'rgba(0,245,255,0.1)' }}
      >
        <div>
          <h1 className="text-neon-cyan text-lg font-bold tracking-widest text-glow-cyan cursor-blink">
            LIVE ATTACK GLOBE
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Real-time global threat visualization · WebSocket feed</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="glass-panel px-3 py-1.5 rounded neon-border-red">
            <span className="text-gray-500">ACTIVE THREATS</span>
            <span className="text-threat-red ml-2 text-glow-red">2,847</span>
          </div>
          <div className="glass-panel px-3 py-1.5 rounded neon-border-cyan">
            <span className="text-gray-500">COUNTRIES</span>
            <span className="text-neon-cyan ml-2">47</span>
          </div>
          <div className="glass-panel px-3 py-1.5 rounded neon-border-green">
            <span className="text-gray-500">BLOCKED</span>
            <span className="text-neon-green ml-2">143</span>
          </div>
        </div>
      </motion.div>

      {/* Globe */}
      <div className="flex-1 relative overflow-hidden">
        <AttackGlobe />
      </div>
    </div>
  );
}
