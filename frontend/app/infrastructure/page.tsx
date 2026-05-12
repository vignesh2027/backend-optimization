'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const InfraGraph = dynamic(() => import('../../components/InfraGraph'), { ssr: false });

export default function InfrastructurePage() {
  return (
    <div className="flex flex-col h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 border-b glass-panel"
        style={{ borderColor: 'rgba(0,245,255,0.1)' }}
      >
        <h1 className="text-neon-cyan text-lg font-bold tracking-widest text-glow-cyan cursor-blink">
          INFRASTRUCTURE HEATMAP
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">D3.js force graph · real-time risk scoring · Prometheus metrics</p>
      </motion.div>
      <div className="flex-1 relative overflow-hidden">
        <InfraGraph />
      </div>
    </div>
  );
}
