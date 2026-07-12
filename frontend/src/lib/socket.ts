import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let mode: "authenticated" | "pending" | "disconnected" = "disconnected";

function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function connectAuthenticatedSocket(): Socket {
  const s = getSocket();
  if (mode === "authenticated" && s.connected) return s;
  if (s.connected) s.disconnect();
  s.auth = {};
  mode = "authenticated";
  s.connect();
  return s;
}

export function connectPendingSocket(pendingToken: string): Socket {
  const s = getSocket();
  // no-op if we're already in pending mode with this exact token and connected —
  // prevents redundant disconnect/reconnect churn from re-renders
  if (mode === "pending" && s.connected && s.auth && (s.auth as any).pendingToken === pendingToken) {
    return s;
  }
  if (s.connected) s.disconnect();
  s.auth = { pendingToken };
  mode = "pending";
  s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
  mode = "disconnected";
}

export function getSocketInstance(): Socket {
  return getSocket();
}

export function getSocketMode() {
  return mode;
}
