import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'Detect Backend Threat | Cyber Intelligence Platform',
  description: 'Production-grade cyber intelligence and infrastructure defense platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cyber-black text-gray-100 font-mono antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-cyber-black">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
