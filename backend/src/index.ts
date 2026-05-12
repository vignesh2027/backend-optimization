import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

import { connectRedis } from './services/redis';
import { initWebSocket } from './websocket';
import { requestLogger, ipBlockMiddleware } from './middleware/requestLogger';
import scanRouter from './routes/scan';
import incidentRouter from './routes/incidents';
import abuseRouter from './routes/abuse';
import infraRouter from './routes/infrastructure';

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Prometheus metrics
const register = new Registry();
collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Prometheus request tracking
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

app.use(ipBlockMiddleware);
app.use(requestLogger);

// Routes
app.use('/api/scan', scanRouter);
app.use('/api/incidents', incidentRouter);
app.use('/api/abuse', abuseRouter);
app.use('/api/infrastructure', infraRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await connectRedis();
  initWebSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Metrics] Available at http://localhost:${PORT}/metrics`);
  });
}

start().catch((err) => {
  console.error('[Startup] Fatal error:', err);
  process.exit(1);
});
