import "dotenv/config";

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5080),
  database: {
    url: process.env.DATABASE_URL ?? "file:./medmanager.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  jwt: {
    issuer: process.env.JWT_ISSUER ?? "medmanager",
    audience: process.env.JWT_AUDIENCE ?? "medmanager-web",
    signingKey: required("JWT_SIGNING_KEY", "dev-only-replace-with-a-long-random-string-min-32-chars"),
    accessMinutes: Number(process.env.JWT_ACCESS_MINUTES ?? 15),
    refreshDays: Number(process.env.JWT_REFRESH_DAYS ?? 7),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim()),
  },
  push: {
    subject: process.env.PUSH_SUBJECT ?? "mailto:admin@medmanager.local",
    publicKey: process.env.PUSH_PUBLIC_KEY ?? "",
    privateKey: process.env.PUSH_PRIVATE_KEY ?? "",
    get configured() {
      return Boolean(this.publicKey && this.privateKey);
    },
  },
} as const;

export const isTest = () => config.env === "test";
export const isDev = () => config.env === "development";
export const isProd = () => config.env === "production";
