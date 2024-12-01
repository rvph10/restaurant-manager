import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from './index';

export const configureSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};
