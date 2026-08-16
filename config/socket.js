const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('[SOCKET] Client connected:', socket.id);

    // Securely join admin room only after JWT verification
    socket.on('join_admin_room', async (data) => {
      try {
        // Token may be in data.token or socket.handshake.auth.token
        const token =
          (data && data.token) ||
          (socket.handshake && socket.handshake.auth && socket.handshake.auth.token);

        if (!token) {
          socket.emit('admin_room_error', { message: 'No authentication token provided' });
          console.warn('[SOCKET] join_admin_room denied — no token. Socket:', socket.id);
          return;
        }

        // Verify JWT
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
          socket.emit('admin_room_error', { message: 'Invalid or expired token' });
          console.warn('[SOCKET] join_admin_room denied — JWT invalid. Socket:', socket.id, jwtErr.message);
          return;
        }

        // Check user role from MongoDB (source of truth)
        const user = await User.findById(decoded.id || decoded._id).select('role');
        if (!user || user.role !== 'admin') {
          socket.emit('admin_room_error', { message: 'Access denied — not an approved admin' });
          console.warn('[SOCKET] join_admin_room denied — not an admin. Socket:', socket.id, decoded.id);
          return;
        }

        socket.join('admins');
        socket.emit('admin_room_joined', { message: 'Joined admin notification room' });
        console.log('[SOCKET] Admin joined admin room:', socket.id, '— user:', user._id);
      } catch (err) {
        console.error('[SOCKET] join_admin_room error:', err.message);
        socket.emit('admin_room_error', { message: 'Server error during room join' });
      }
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
