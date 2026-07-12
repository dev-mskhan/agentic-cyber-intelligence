import pino from "pino";
import env from "./env.js";

const isProduction = env.nodeEnv === "production";

const logger = pino({
  level: isProduction ? "info" : "debug",
  ...(!isProduction && {
    transport: { target: "pino-pretty" },
  }),
});

export default logger;
