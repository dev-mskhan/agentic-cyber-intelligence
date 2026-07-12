import { Server, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { parseCookie } from "cookie";
import { unsign } from "cookie-signature";
import {
  verifyAccessToken,
  verifyScopedSocketToken,
  type JwtPayload,
  type SocketAuthScope,
} from "../utils/generateToken.js";
import env from "./env.js";
import logger from "./logger.js";

let io: Server;

function unsignCookieValue(value: string, secret: string): string | false {
  if (!value.startsWith("s:")) return false;
  return unsign(value.slice(2), secret);
}

type SocketAuthState =
  | { type: "authenticated"; user: JwtPayload }
  | { type: "pending"; userId: string; scope: SocketAuthScope };
export interface SocketData {
  auth: SocketAuthState;
}
declare module "socket.io" {
  interface Socket {
    // @ts-ignore
    data: SocketData;
  }
}

const PENDING_SCOPES: SocketAuthScope[] = [
  "pending_verification",
  "pending_password_reset",
];

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      // Path 1: full session — signed access_token cookie (normal authenticated users)
      const rawCookieHeader = socket.handshake.headers.cookie;
      if (rawCookieHeader) {
        const parsed = parseCookie(rawCookieHeader);
        const signedToken = parsed.access_token;
        if (signedToken) {
          const unsignedToken = unsignCookieValue(signedToken, env.cookieSecret);
          if (unsignedToken) {
            const user = verifyAccessToken(unsignedToken) as JwtPayload;
            socket.data.auth = { type: "authenticated", user };
            return next();
          }
        }
      }

      // Path 2: short-lived, purpose-scoped token — pre-auth screens
      // (email verification pending, password reset pending). Sent via
      // handshake.auth, not query params or cookies.
      const pendingToken = socket.handshake.auth?.pendingToken as string | undefined;
      if (pendingToken) {
        for (const scope of PENDING_SCOPES) {
          try {
            const payload = verifyScopedSocketToken(pendingToken, scope);
            socket.data.auth = { type: "pending", userId: payload.id, scope };
            return next();
          } catch {
            continue; // wrong scope for this token, try the next one
          }
        }
      }

      return next(new Error("Unauthorized"));
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "Socket auth rejected");
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const auth = socket.data.auth;

    if (auth.type === "authenticated") {
      socket.join(`org:${auth.user.organizationId}`);
      socket.join(`user:${auth.user.id}`);
      logger.info(
        { userId: auth.user.id, organizationId: auth.user.organizationId },
        "Socket connected",
      );
    } else {
      socket.join(`user:${auth.userId}`);
      logger.info(
        { userId: auth.userId, scope: auth.scope },
        "Socket connected (pending)",
      );
    }

    socket.on("disconnect", () => {
      logger.info({ auth }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO server has not been initialized yet");
  return io;
}
