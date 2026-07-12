// hooks/useSocket.ts
import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const { socket, isConnected } = useSocket();
  console.log("Socket connected?", isConnected);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrapped = (payload: T) => handlerRef.current(payload);
    socket.on(event, wrapped);
    return () => {
      socket.off(event, wrapped);
    };
  }, [socket, event]);
}
