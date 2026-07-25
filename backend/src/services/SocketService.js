import { Server } from 'socket.io';
import MarketDataService from './MarketDataService.js';

import { checkCorsOrigin } from '../config/cors.js';

class SocketService {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: checkCorsOrigin,
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Socket client connected: ${socket.id}`);

      socket.on('register_user', (userId) => {
        socket.userId = userId;
        socket.join(`user:${userId}`);
        console.log(`👤 Socket client ${socket.id} registered as user ${userId}`);
      });

      socket.on('subscribe_ticker', (symbol) => {
        socket.join(`ticker:${symbol.toUpperCase()}`);
        console.log(`Socket client ${socket.id} subscribed to ticker ${symbol}`);
      });

      socket.on('unsubscribe_ticker', (symbol) => {
        socket.leave(`ticker:${symbol.toUpperCase()}`);
        console.log(`Socket client ${socket.id} unsubscribed from ticker ${symbol}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Socket client disconnected: ${socket.id}`);
      });
    });

    // Wire Socket.io to MarketDataService for quote broadcasts
    MarketDataService.setSocketServer(this.io);
    console.log('⚡ Socket.io Server successfully bound to HTTP port listener.');
  }

  getActiveUserIds() {
    const userIds = new Set();
    if (this.io) {
      for (const [id, socket] of this.io.of("/").sockets) {
        if (socket.userId) {
          userIds.add(socket.userId);
        }
      }
    }
    return Array.from(userIds);
  }

  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  broadcastToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

export default new SocketService();
