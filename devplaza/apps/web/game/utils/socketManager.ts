import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
    _socket = io(url, { autoConnect: false });
  }
  return _socket;
}

export function connectSocket(userId: string, nickname: string, gender: string, skinColor: string): void {
  const s = getSocket();
  if (s.connected) return;
  s.connect();
  s.once("connect", () => {
    s.emit("player:join", { userId, nickname, gender, skinColor });
  });
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
