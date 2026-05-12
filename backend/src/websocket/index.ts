import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { redisSub } from '../services/redis';
import { generateMockAttack, generateMockThreatEvent } from '../services/mockData';

export function initWebSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on('subscribe', (channels: string[]) => {
      channels.forEach((ch) => socket.join(ch));
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  // Subscribe to Redis threat-events channel
  redisSub.subscribe('threat-events', 'attack-globe', (err) => {
    if (err) console.error('[RedisSub] Subscribe error:', err);
  });

  redisSub.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      io.emit(channel, data);
    } catch {}
  });

  // Mock data emitters for development
  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      io.emit('attack-globe', generateMockAttack());
    }, 2000);

    setInterval(() => {
      io.emit('threat-events', generateMockThreatEvent());
    }, 3000);
  }

  return io;
}
