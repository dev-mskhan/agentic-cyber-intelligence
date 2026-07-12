import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useGetCurrentSessionQuery } from "../api/authApi";
import { connectAuthenticatedSocket, connectPendingSocket, disconnectSocket, getSocketMode } from "../lib/socket";

export function useSocketConnectionManager(pendingToken?: string) {
  const { data, isSuccess, isError } = useGetCurrentSessionQuery();
  const location = useLocation();

  useEffect(() => {
    if (isSuccess && data?.data) {
      connectAuthenticatedSocket();
      return;
    }

    if (isError && pendingToken) {
      connectPendingSocket(pendingToken);
      return;
    }

    if (isError && !pendingToken && getSocketMode() !== "disconnected") {
      disconnectSocket();
    }
  }, [isSuccess, isError, data, pendingToken, location.pathname]);
}
