import dotenv from "dotenv";
dotenv.config();

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing env variable: ${key}`);
  }
  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5003,
  mongodbUri: requiredEnv("MONGODB_URI"),
  redisUrl: requiredEnv("REDIS_URL"),
  jwtAccessSecret: requiredEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requiredEnv("JWT_REFRESH_SECRET"),
  jwtScopedSocketSecret: requiredEnv("JWT_SCOPED_SOCKET_SECRET"),
  cookieSecret: requiredEnv("COOKIE_SECRET"),
  clientUrl: requiredEnv("CLIENT_URL"),

  // Nodemailer
  smtpHost: requiredEnv("SMTP_HOST"),
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: requiredEnv("SMTP_USER"),
  smtpPass: requiredEnv("SMTP_PASS"),
  smtpSecure: process.env.SMTP_SECURE == "true" ? true : false,
  smtpFrom: requiredEnv("SMTP_FROM"),

  // Google Auth
  googleClientId: requiredEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),

  // Stripe
  stripeSecretKey: requiredEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: requiredEnv("STRIPE_WEBHOOK_SECRET"),
  stripePriceStarter: requiredEnv("STRIPE_PRICE_STARTER"),
  stripePricePro: requiredEnv("STRIPE_PRICE_PRO"),
  stripePriceEnterprise: requiredEnv("STRIPE_PRICE_ENTERPRISE"),

  // NVD
  nvdApiKey: requiredEnv("NVD_API_KEY"),
  // gemini
  geminiApiKey: requiredEnv("GEMINI_API_KEY"),

  //tools
  exaApiKey: requiredEnv("EXA_API_KEY"),
  otxApiKey: requiredEnv("OTX_API_KEY"),
};

export default env;
