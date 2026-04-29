import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGIN, methods: ["GET", "POST"] },
});

interface UserData {
  socketId: string;
  userId: string;
  nickname: string;
  gender: string;
  skinColor: string;
  buildingId?: string;
}

const users = new Map<string, UserData>();
const userSocketMap = new Map<string, string>(); // userId → socketId

io.on("connection", (socket: Socket) => {
  console.log(`[+] ${socket.id}`);

  // ── User register (lobby / DM) ─────────────────────────────────────
  socket.on("user:register", ({ userId }: { userId: string }) => {
    userSocketMap.set(userId, socket.id);
  });

  // ── DM ────────────────────────────────────────────────────────────
  socket.on(
    "dm:send",
    ({ toUserId, message }: { toUserId: string; message: { id: string; content: string; createdAt: string; sender: { id: string; nickname: string | null; avatarUrl: string } } }) => {
      const targetSocketId = userSocketMap.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("dm:message", message);
      }
    },
  );

  // ── Friend notify ──────────────────────────────────────────────────
  socket.on(
    "friend:notify",
    ({ toUserId, from }: { toUserId: string; from: { id: string; nickname: string | null; username: string; avatarUrl: string } }) => {
      const targetSocketId = userSocketMap.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:request", { from });
      }
    },
  );

  socket.on(
    "friend:accepted:notify",
    ({ toUserId, by }: { toUserId: string; by: { id: string; nickname: string | null; username: string } }) => {
      const targetSocketId = userSocketMap.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:accepted", { by });
      }
    },
  );

  // ── World ──────────────────────────────────────────────────────────
  socket.on(
    "player:join",
    (data: { userId: string; nickname: string; gender: string; skinColor: string; x: number; y: number }) => {
      users.set(socket.id, { socketId: socket.id, ...data });
      socket.join("world");

      // Send current players to newcomer
      const present = [...users.entries()]
        .filter(([sid]) => sid !== socket.id)
        .map(([, u]) => u)
        .filter((u) => !u.buildingId);
      socket.emit("world:players", present);

      // Notify others about newcomer
      socket.to("world").emit("player:joined", { ...data });
    },
  );

  socket.on(
    "player:move",
    ({ x, y, direction }: { x: number; y: number; direction: string }) => {
      const user = users.get(socket.id);
      if (!user) return;
      socket.to("world").emit("player:moved", { userId: user.userId, x, y, direction });
    },
  );

  // ── World chat ─────────────────────────────────────────────────────
  socket.on("world:chat:send", ({ content }: { content: string }) => {
    const user = users.get(socket.id);
    if (!user || !content.trim()) return;
    socket.to("world").emit("world:chat:message", {
      userId: user.userId,
      nickname: user.nickname,
      content: content.trim(),
    });
  });

  // ── Building movement ──────────────────────────────────────────────
  socket.on(
    "building:player_move",
    ({ buildingId, x, y }: { buildingId: string; x: number; y: number }) => {
      const user = users.get(socket.id);
      if (!user) return;
      socket.to(`building:${buildingId}`).emit("building:player_moved", {
        userId: user.userId,
        x,
        y,
      });
    },
  );

  // ── Building enter ─────────────────────────────────────────────────
  socket.on(
    "building:enter",
    (data: {
      buildingId: string;
      userId: string;
      nickname: string;
      gender: string;
      skinColor: string;
    }) => {
      const { buildingId, userId, nickname, gender, skinColor } = data;

      // Upsert user record
      const existing = users.get(socket.id);
      const user: UserData = existing
        ? { ...existing, buildingId }
        : { socketId: socket.id, userId, nickname, gender, skinColor, buildingId };
      users.set(socket.id, user);

      const room = `building:${buildingId}`;
      socket.join(room);

      // Tell newcomer who is already here (excluding themselves)
      const roomSockets = io.sockets.adapter.rooms.get(room) ?? new Set<string>();
      const presentUsers = [...roomSockets]
        .filter((sid) => sid !== socket.id)
        .map((sid) => {
          const u = users.get(sid);
          return u
            ? { userId: u.userId, nickname: u.nickname, gender: u.gender, skinColor: u.skinColor }
            : null;
        })
        .filter(Boolean);

      socket.emit("building:users", { users: presentUsers });

      // Notify existing users about the newcomer
      socket.to(room).emit("building:user_joined", {
        userId,
        nickname,
        gender,
        skinColor,
      });

      console.log(`[enter] ${nickname} → ${buildingId} (${presentUsers.length} already here)`);
    },
  );

  // ── Building leave ─────────────────────────────────────────────────
  socket.on("building:leave", ({ buildingId }: { buildingId: string }) => {
    const user = users.get(socket.id);
    const room = `building:${buildingId}`;
    socket.leave(room);
    if (user) {
      user.buildingId = undefined;
      socket.to(room).emit("building:user_left", { userId: user.userId });
    }
    console.log(`[leave] ${user?.nickname ?? socket.id} ← ${buildingId}`);
  });

  // ── Chat ────────────────────────────────────────────────────────────
  socket.on(
    "chat:send",
    ({ buildingId, content }: { buildingId: string; content: string }) => {
      const user = users.get(socket.id);
      if (!user || !content.trim()) return;

      const room = `building:${buildingId}`;
      const payload = {
        userId: user.userId,
        nickname: user.nickname,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      // Broadcast to everyone ELSE (sender shows bubble immediately via local dispatch)
      socket.to(room).emit("chat:message", payload);
      console.log(`[chat] [${buildingId}] ${user.nickname}: ${content.slice(0, 50)}`);
    },
  );

  // ── Disconnect ─────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      if (user.buildingId) {
        socket.to(`building:${user.buildingId}`).emit("building:user_left", { userId: user.userId });
      }
      socket.to("world").emit("player:leave", { userId: user.userId });
      if (userSocketMap.get(user.userId) === socket.id) {
        userSocketMap.delete(user.userId);
      }
    }
    users.delete(socket.id);
    console.log(`[-] ${socket.id} (${user?.nickname ?? "unknown"})`);
  });
});

const PORT = process.env.PORT ?? 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server → http://localhost:${PORT}`);
});
