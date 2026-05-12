import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { summarizeIncident } from '../services/gemini';

const router = Router();

// GET /api/incidents
router.get('/', async (_req: Request, res: Response) => {
  const incidents = await prisma.incident.findMany({
    orderBy: [
      { severity: 'desc' },
      { detectedAt: 'desc' },
    ],
  });
  return res.json(incidents);
});

// GET /api/incidents/:id
router.get('/:id', async (req: Request, res: Response) => {
  const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!incident) return res.status(404).json({ error: 'Not found' });
  return res.json(incident);
});

// POST /api/incidents
router.post('/', async (req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.create({ data: req.body });
    return res.status(201).json(incident);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PATCH /api/incidents/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  const now = new Date();
  const timestampField: Record<string, string> = {
    INVESTIGATING: 'investigatedAt',
    CONTAINED: 'containedAt',
    RESOLVED: 'resolvedAt',
  };

  const data: any = { status };
  if (timestampField[status]) data[timestampField[status]] = now;

  const updated = await prisma.incident.update({
    where: { id: req.params.id },
    data,
  });
  return res.json(updated);
});

// POST /api/incidents/:id/summarize — Gemini AI summary
router.post('/:id/summarize', async (req: Request, res: Response) => {
  const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!incident) return res.status(404).json({ error: 'Not found' });

  try {
    const summary = await summarizeIncident({
      title: incident.title,
      severity: incident.severity,
      attackType: incident.attackType,
      sourceIps: incident.sourceIps,
      affectedSystems: incident.affectedSystems,
      timelineEvents: incident.timelineEvents as any[],
    });

    const updated = await prisma.incident.update({
      where: { id: req.params.id },
      data: { summary },
    });
    return res.json({ summary, incident: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/incidents/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.incident.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

// POST /api/incidents/seed — seed demo data
router.post('/seed', async (_req: Request, res: Response) => {
  const demos = [
    {
      title: 'Mass DDoS Attack on Payment API',
      severity: 'CRITICAL' as const,
      attackType: 'DDOS' as const,
      sourceIps: ['185.220.101.45', '94.102.49.190', '23.129.64.131'],
      affectedSystems: ['payment-api', 'load-balancer-01', 'cdn-edge'],
      timelineEvents: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Traffic spike detected: 2.1M req/s' },
        { timestamp: new Date(Date.now() - 3000000).toISOString(), description: 'Rate limiting activated' },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), description: 'CDN DDoS protection enabled' },
      ],
    },
    {
      title: 'Ransomware Outbreak in Internal Network',
      severity: 'CRITICAL' as const,
      attackType: 'RANSOMWARE' as const,
      sourceIps: ['10.0.0.147'],
      affectedSystems: ['file-server-02', 'workstation-14', 'workstation-22'],
      timelineEvents: [
        { timestamp: new Date(Date.now() - 7200000).toISOString(), description: 'Suspicious file encryption detected on file-server-02' },
        { timestamp: new Date(Date.now() - 6900000).toISOString(), description: 'Network isolation initiated' },
      ],
    },
    {
      title: 'SSH Brute Force Campaign',
      severity: 'HIGH' as const,
      attackType: 'BRUTE_FORCE' as const,
      sourceIps: ['49.234.56.78', '103.21.244.0'],
      affectedSystems: ['bastion-host-01'],
      timelineEvents: [
        { timestamp: new Date(Date.now() - 1800000).toISOString(), description: '1,847 failed SSH login attempts detected' },
        { timestamp: new Date(Date.now() - 1500000).toISOString(), description: 'Source IPs blocked via firewall' },
      ],
    },
  ];

  const created = await Promise.all(demos.map((d) => prisma.incident.create({ data: d })));
  return res.json({ created: created.length, incidents: created });
});

export default router;
