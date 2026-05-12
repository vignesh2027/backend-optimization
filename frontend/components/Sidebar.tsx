'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const NAV = [
  { href: '/', label: 'ATTACK GLOBE', icon: '🌐', color: 'neon-cyan' },
  { href: '/scanner', label: 'THREAT SCANNER', icon: '🔍', color: 'neon-green' },
  { href: '/infrastructure', label: 'INFRA HEATMAP', icon: '🗺', color: 'threat-amber' },
  { href: '/feed', label: 'LIVE FEED', icon: '📡', color: 'neon-cyan' },
  { href: '/abuse', label: 'ABUSE DETECTOR', icon: '🚫', color: 'threat-red' },
  { href: '/incidents', label: 'INCIDENT CENTER', icon: '⚠', color: 'threat-red' },
];

const COLOR_MAP: Record<string, string> = {
  'neon-cyan': 'rgba(0,245,255,',
  'neon-green': 'rgba(57,255,20,',
  'threat-amber': 'rgba(255,149,0,',
  'threat-red': 'rgba(255,45,85,',
};

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-64 bg-cyber-dark border-r border-cyber-border flex flex-col flex-shrink-0" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🛡</span>
          <span className="text-neon-cyan text-sm font-bold tracking-widest text-glow-cyan">DBT</span>
        </div>
        <div className="text-xs text-gray-500 tracking-wider">DETECT BACKEND THREAT</div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-glow" />
          <span className="text-neon-green text-xs">SYSTEM ACTIVE</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active = path === item.href;
          const color = COLOR_MAP[item.color] || COLOR_MAP['neon-cyan'];
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wider cursor-pointer transition-all duration-200 ${
                  active
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                style={
                  active
                    ? {
                        background: `${color}0.08)`,
                        borderLeft: `2px solid ${color}0.9)`,
                        boxShadow: `inset 0 0 20px ${color}0.05)`,
                      }
                    : { borderLeft: '2px solid transparent' }
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t text-xs text-gray-600 space-y-1" style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
        <div className="flex justify-between">
          <span>THREATS TODAY</span>
          <span className="text-threat-red">2,847</span>
        </div>
        <div className="flex justify-between">
          <span>BLOCKED IPs</span>
          <span className="text-neon-cyan">143</span>
        </div>
        <div className="flex justify-between">
          <span>SCANS RUN</span>
          <span className="text-neon-green">891</span>
        </div>
      </div>
    </aside>
  );
}
