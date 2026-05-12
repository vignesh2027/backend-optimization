import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const redisSub = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('[Redis] Error:', err.message));
redisSub.on('error', (err) => console.error('[RedisSub] Error:', err.message));

export async function connectRedis() {
  await redis.connect();
  await redisSub.connect();
  console.log('[Redis] Connected');
}
