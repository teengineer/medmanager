import { beforeAll, afterAll } from "vitest";
import { makeTempDbUrl } from "./helpers.js";

let cleanup: (() => void) | null = null;

beforeAll(() => {
  const { url, cleanup: c } = makeTempDbUrl();
  process.env.DATABASE_URL = url;
  process.env.JWT_SIGNING_KEY = "test-key-must-be-long-enough-for-hs256-signing-xxxxxxxxxxxxxxxxxx";
  process.env.JWT_ACCESS_MINUTES = "15";
  process.env.JWT_REFRESH_DAYS = "7";
  process.env.NODE_ENV = "test";
  cleanup = c;
});

afterAll(() => {
  if (cleanup) cleanup();
});
