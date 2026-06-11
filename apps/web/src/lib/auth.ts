import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "~/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      },
    }),
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      locale: { type: "string", required: false, defaultValue: "tr" },
      timeZone: { type: "string", required: false, defaultValue: "Europe/Istanbul" },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3000",
    ...(process.env.WEB_ORIGIN ? [process.env.WEB_ORIGIN] : []),
  ],
  plugins: [tanstackStartCookies()],
});

export type Session = typeof auth.$Infer.Session;
