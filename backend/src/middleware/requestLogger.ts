import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/redis';
import { prisma } from '../db/prisma';

const FLOOD_THRESHOLD = 100; // req/min
const BRUTE_THRESHOLD = 20;  // failed auths/window

export async function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';

  res.on('finish', async () => {
    const responseTime = Date.now() - start;
    const key = `req:${ip}:${Math.floor(Date.now() / 60000)}`;

    try {
      const count = await redis.incr(key);
      await redis.expire(key, 120);

      let flagged = false;
      let flagReason: string | undefined;

      if (count > FLOOD_THRESHOLD) {
        flagged = true;
        flagReason = 'API_FLOOD';
        await redis.sadd('blocked:ips', ip);
        await redis.publish('threat-events', JSON.stringify({
          id: Math.random().toString(36).substring(7),
          type: 'API_FLOOD',
          severity: 'HIGH',
          sourceIp: ip,
          description: `API flood detected: ${count} req/min from ${ip} on ${req.path}`,
          timestamp: new Date().toISOString(),
        }));
      }

      if (res.statusCode === 401 || res.statusCode === 403) {
        const authKey = `auth:fail:${ip}:${Math.floor(Date.now() / 300000)}`;
        const failCount = await redis.incr(authKey);
        await redis.expire(authKey, 600);
        if (failCount > BRUTE_THRESHOLD) {
          flagged = true;
          flagReason = 'BRUTE_FORCE';
          await redis.sadd('blocked:ips', ip);
          await redis.publish('threat-events', JSON.stringify({
            id: Math.random().toString(36).substring(7),
            type: 'BRUTE_FORCE',
            severity: 'CRITICAL',
            sourceIp: ip,
            description: `Brute force: ${failCount} failed auth attempts from ${ip}`,
            timestamp: new Date().toISOString(),
          }));
        }
      }

      await prisma.requestLog.create({
        data: {
          ip,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          flagged,
          flagReason,
        },
      });
    } catch {
      // non-blocking — never crash the request for logging errors
    }
  });

  next();
}

export async function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
  const blocked = await redis.sismember('blocked:ips', ip).catch(() => 0);
  if (blocked) {
    return res.status(429).json({ error: 'Too many requests. Your IP has been blocked.' });
  }
  next();
}
