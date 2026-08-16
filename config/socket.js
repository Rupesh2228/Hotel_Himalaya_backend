const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true, // Allow frontend origin
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('[SOCKET] Client connected:', socket.id);

    // Join room based on authenticated role if client requests
    socket.on('join_admin_room', (data) => {
      // In production, we'd verify admin status/token here, but for simplicity
      // let's join rooms based on role requested, or join an admin room
      socket.join('admins');
      console.log('[SOCKET] Admin joined admin room:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIo = () => {
  return io;
};

const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admins').emit(event, data);
    console.log('[SOCKET] Emitted event to admins:', event);
  } else {
    console.warn('[SOCKET] IO instance not initialized, skipped emit');
  }
};

module.exports = {
  initSocket,
  getIo,
  emitToAdmins
};
