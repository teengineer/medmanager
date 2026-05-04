import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ZodError } from "zod";
import { config, isDev } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { medicinesRouter } from "./routes/medicines.js";
import { pushRouter } from "./routes/push.js";
import { searchRouter } from "./routes/search.js";
import { useCasesRouter } from "./routes/useCases.js";

export function buildApp() {
  const app = new Hono();

  if (isDev()) app.use("*", logger());

  app.use(
    "*",
    cors({
      origin: config.cors.origins,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "Accept-Language"],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  app.onError((err, c) => {
    if (err instanceof ZodError) {
      return c.json(
        {
          errors: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        400,
      );
    }
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  app.route("/", healthRouter);
  app.route("/", authRouter);
  app.route("/", meRouter);
  app.route("/", medicinesRouter);
  app.route("/", useCasesRouter);
  app.route("/", searchRouter);
  app.route("/", pushRouter);

  return app;
}

export type App = ReturnType<typeof buildApp>;
