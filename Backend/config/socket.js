const jwt = require("jsonwebtoken");

let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://192.168.0.104:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch {
        next(new Error("Invalid token"));
      }
    } else {
      // Backward-compatible: allow without token (log warning)
      console.warn(`[Socket] Unauthenticated connection: ${socket.id}`);
      socket.user = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    console.log("Client connected:", socket.id, userId ? `(user ${userId})` : "(unauthenticated)");

    socket.on("join", (targetUserId) => {
      if (targetUserId) {
        // Authenticated users can only join their own room
        if (socket.user && Number(targetUserId) === Number(socket.user.id)) {
          socket.join(`user_${targetUserId}`);
          console.log(`User ${targetUserId} joined room user_${targetUserId}`);
        } else if (!socket.user) {
          console.warn(`[Socket] Unauthenticated user attempted to join room ${targetUserId}`);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initSocket, getIO };
