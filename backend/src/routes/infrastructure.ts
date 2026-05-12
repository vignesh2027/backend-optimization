import { Router, Request, Response } from 'express';

const router = Router();

// Mock infrastructure nodes for the D3 force graph
function generateInfrastructureData() {
  const nodes = [
    { id: 'lb-01', label: 'Load Balancer', type: 'loadbalancer', cpu: 45 + Math.random() * 30, memory: 60 + Math.random() * 20, latencyP99: 12 + Math.random() * 50, traffic: 8500 + Math.random() * 2000, riskScore: 0 },
    { id: 'api-01', label: 'API Gateway', type: 'api', cpu: 55 + Math.random() * 30, memory: 70 + Math.random() * 20, latencyP99: 25 + Math.random() * 100, traffic: 6200 + Math.random() * 2000, riskScore: 0 },
    { id: 'api-02', label: 'Auth Service', type: 'api', cpu: 30 + Math.random() * 40, memory: 45 + Math.random() * 25, latencyP99: 15 + Math.random() * 60, traffic: 3100 + Math.random() * 1000, riskScore: 0 },
    { id: 'app-01', label: 'App Server 1', type: 'server', cpu: 60 + Math.random() * 35, memory: 75 + Math.random() * 20, latencyP99: 45 + Math.random() * 200, traffic: 4200 + Math.random() * 1500, riskScore: 0 },
    { id: 'app-02', label: 'App Server 2', type: 'server', cpu: 40 + Math.random() * 30, memory: 55 + Math.random() * 20, latencyP99: 38 + Math.random() * 150, traffic: 3800 + Math.random() * 1200, riskScore: 0 },
    { id: 'db-01', label: 'PostgreSQL Primary', type: 'database', cpu: 25 + Math.random() * 20, memory: 80 + Math.random() * 15, latencyP99: 5 + Math.random() * 30, traffic: 2100 + Math.random() * 800, riskScore: 0 },
    { id: 'db-02', label: 'PostgreSQL Replica', type: 'database', cpu: 15 + Math.random() * 15, memory: 70 + Math.random() * 15, latencyP99: 4 + Math.random() * 25, traffic: 1200 + Math.random() * 500, riskScore: 0 },
    { id: 'cache-01', label: 'Redis Cluster', type: 'cache', cpu: 20 + Math.random() * 20, memory: 85 + Math.random() * 10, latencyP99: 1 + Math.random() * 5, traffic: 9500 + Math.random() * 2000, riskScore: 0 },
    { id: 'cdn-01', label: 'CDN Edge', type: 'cdn', cpu: 15 + Math.random() * 20, memory: 30 + Math.random() * 20, latencyP99: 8 + Math.random() * 20, traffic: 12000 + Math.random() * 3000, riskScore: 0 },
    { id: 'worker-01', label: 'Worker Queue', type: 'worker', cpu: 70 + Math.random() * 25, memory: 60 + Math.random() * 20, latencyP99: 200 + Math.random() * 500, traffic: 1500 + Math.random() * 500, riskScore: 0 },
    { id: 'monitor-01', label: 'Prometheus', type: 'monitoring', cpu: 10 + Math.random() * 15, memory: 40 + Math.random() * 20, latencyP99: 50 + Math.random() * 100, traffic: 800 + Math.random() * 300, riskScore: 0 },
  ];

  // Compute risk score: weight CPU spike, high latency, high memory
  const withRisk = nodes.map((n) => {
    const cpuRisk = n.cpu > 80 ? (n.cpu - 80) * 2 : 0;
    const latencyRisk = n.latencyP99 > 200 ? (n.latencyP99 - 200) * 0.1 : 0;
    const memRisk = n.memory > 90 ? (n.memory - 90) * 3 : 0;
    const riskScore = Math.min(100, cpuRisk + latencyRisk + memRisk + Math.random() * 10);
    return { ...n, riskScore: Math.round(riskScore * 10) / 10, openPorts: [80, 443, 22, 9100].slice(0, Math.floor(Math.random() * 4) + 1) };
  });

  const links = [
    { source: 'cdn-01', target: 'lb-01', load: 0.9 },
    { source: 'lb-01', target: 'api-01', load: 0.8 },
    { source: 'lb-01', target: 'api-02', load: 0.5 },
    { source: 'api-01', target: 'app-01', load: 0.7 },
    { source: 'api-01', target: 'app-02', load: 0.6 },
    { source: 'api-02', target: 'cache-01', load: 0.4 },
    { source: 'app-01', target: 'db-01', load: 0.6 },
    { source: 'app-02', target: 'db-01', load: 0.5 },
    { source: 'db-01', target: 'db-02', load: 0.3 },
    { source: 'app-01', target: 'cache-01', load: 0.8 },
    { source: 'app-02', target: 'cache-01', load: 0.7 },
    { source: 'app-01', target: 'worker-01', load: 0.4 },
    { source: 'monitor-01', target: 'app-01', load: 0.1 },
    { source: 'monitor-01', target: 'db-01', load: 0.1 },
  ];

  return { nodes: withRisk, links };
}

// GET /api/infrastructure/topology
router.get('/topology', (_req: Request, res: Response) => {
  return res.json(generateInfrastructureData());
});

// GET /api/infrastructure/metrics — Prometheus-style metrics summary
router.get('/metrics-summary', (_req: Request, res: Response) => {
  const data = generateInfrastructureData();
  const summary = data.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    cpu: Math.round(n.cpu),
    memory: Math.round(n.memory),
    latencyP99: Math.round(n.latencyP99),
    riskScore: n.riskScore,
  }));
  return res.json(summary);
});

export default router;
