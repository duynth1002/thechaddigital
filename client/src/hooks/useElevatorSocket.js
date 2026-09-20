import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useElevatorSocket() {
  const socketRef = useRef(null);
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setLastError(null);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("state", (snapshot) => setState(snapshot));
    socket.on("error", (payload) => {
      setLastError(payload?.message ?? "Request failed");
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  function emit(event, payload) {
    setLastError(null);
    socketRef.current?.emit(event, payload);
  }

  return {
    state,
    connected,
    lastError,
    hallCall: (floor, direction) => emit("hallCall", { floor, direction }),
    carCall: (elevatorId, floor) => emit("carCall", { elevatorId, floor }),
    doorHold: (elevatorId) => emit("doorHold", { elevatorId }),
    doorClose: (elevatorId) => emit("doorClose", { elevatorId }),
  };
}
