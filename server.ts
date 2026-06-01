import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "BrModelo-R Server is running" });
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
      res.json({ success: true, token: "fake-jwt-token-123", user: { email } });
    } else {
      res.status(400).json({ success: false, message: "E-mail e senha são obrigatórios" });
    }
  });

  // Socket.io Collaboration Logic
  const roomsData = new Map(); // Store latest diagram state per room

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      // Send current state to the new user if it exists
      if (roomsData.has(roomId)) {
        socket.emit("sync-full-state", roomsData.get(roomId));
      }
    });

    socket.on("update-state", ({ roomId, elements, connections }) => {
      roomsData.set(roomId, { elements, connections });
      // Broadcast to everyone else in the room
      socket.to(roomId).emit("state-updated", { elements, connections });
    });

    socket.on("cursor-move", ({ roomId, cursor }) => {
      socket.to(roomId).emit("cursor-moved", { id: socket.id, ...cursor });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      io.emit("cursor-removed", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`BrModelo-R Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
