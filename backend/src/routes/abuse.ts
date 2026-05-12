import { Router, Request, Response } from 'express';
import { checkIp } from '../services/abuseipdb';
import { prisma } from '../db/prisma';
import { redis } from '../services/redis';

const router = Router();

// GET /api/abuse/stats — request stats for the last 60 minutes
router.get('/stats', async (_req: Request, res: Response) => {
  const now = Date.now();
  const buckets = [];

  for (let i = 59; i >= 0; i--) {
    const bucketKey = Math.floor((now - i * 60000) / 60000);
    const label = new Date(bucketKey * 60000).toISOString();
    buckets.push({ minute: label, key: bucketKey });
  }

  // Get request counts from Redis for each minute bucket
  const pipeline = redis.pipeline();
  buckets.forEach((b) => {
    // We'd need to scan all IPs — approximate with total count key
    pipeline.get(`req:total:${b.key}`);
  });
  const results = await pipeline.exec();

  const timeline = buckets.map((b, i) => ({
    minute: b.minute,
    count: parseInt((results?.[i]?.[1] as string) || '0', 10),
  }));

  // Top abusive IPs from request logs
  const topIps = await prisma.requestLog.groupBy({
    by: ['ip'],
    where: {
      timestamp: { gte: new Date(now - 3600000) },
      flagged: true,
    },
    _count: { ip: true },
    orderBy: { _count: { ip: 'desc' } },
    take: 10,
  });

  // Recent flagged requests
  const recent = await prisma.requestLog.findMany({
    where: { flagged: true },
    orderBy: { timestamp: 'desc' },
    take: 20,
  });

  return res.json({ timeline, topIps, recent });
});

// POST /api/abuse/check-ip
router.post('/check-ip', async (req: Request, res: Response) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });

  try {
    const result = await checkIp(ip);

    if (result.abuseScore > 50) {
      await redis.sadd('blocked:ips', ip);
      await prisma.blockedIp.upsert({
        where: { ip },
        create: {
          ip,
          reason: 'High AbuseIPDB score',
          country: result.country,
          isp: result.isp,
          score: result.abuseScore,
        },
        update: { score: result.abuseScore },
      });
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/abuse/blocked
router.get('/blocked', async (_req: Request, res: Response) => {
  const [dbBlocked, redisBlocked] = await Promise.all([
    prisma.blockedIp.findMany({ orderBy: { score: 'desc' } }),
    redis.smembers('blocked:ips'),
  ]);
  return res.json({ blocked: dbBlocked, redisSet: redisBlocked });
});

// DELETE /api/abuse/blocked/:ip — unblock IP
router.delete('/blocked/:ip', async (req: Request, res: Response) => {
  const { ip } = req.params;
  await Promise.all([
    redis.srem('blocked:ips', ip),
    prisma.blockedIp.deleteMany({ where: { ip } }),
  ]);
  return res.json({ unblocked: ip });
});

export default router;
