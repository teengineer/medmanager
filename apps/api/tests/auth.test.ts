import { describe, expect, it } from "vitest";
import "./setup.js";
import { createClient } from "./fixture.js";
import { randomEmail } from "./helpers.js";

describe("auth", () => {
  it("health responds ok", async () => {
    const { request } = createClient();
    const res = await request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("register creates user and returns tokens", async () => {
    const { request } = createClient();
    const email = randomEmail();
    const res = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string; user: { email: string } };
    expect(body.accessToken).toBeTruthy();
    expect(body.user.email).toBe(email);
    expect(res.headers.get("set-cookie")).toContain("medmanager.rt=");
  });

  it("register rejects duplicate email", async () => {
    const { request } = createClient();
    const email = randomEmail();
    const first = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    expect(first.status).toBe(200);
    const second = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    expect(second.status).toBe(409);
  });

  it("register rejects short password", async () => {
    const { request } = createClient();
    const res = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "short@example.com", password: "short", locale: "tr" }),
    });
    expect(res.status).toBe(400);
  });

  it("login succeeds with valid credentials", async () => {
    const { request } = createClient();
    const email = randomEmail();
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string };
    expect(body.accessToken).toBeTruthy();
  });

  it("login 401 on bad password", async () => {
    const { request } = createClient();
    const email = randomEmail();
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "wrong-password" }),
    });
    expect(res.status).toBe(401);
  });

  it("me requires authentication", async () => {
    const { request } = createClient();
    const res = await request("/me");
    expect(res.status).toBe(401);
  });

  it("me returns profile with access token", async () => {
    const { request } = createClient();
    const email = randomEmail();
    const reg = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    const { accessToken } = (await reg.json()) as { accessToken: string };
    const res = await request("/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { email: string; locale: string };
    expect(body.email).toBe(email);
    expect(body.locale).toBe("tr");
  });

  it("refresh rotates tokens", async () => {
    const { request } = createClient();
    const email = randomEmail();
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    const res = await request("/auth/refresh", { method: "POST" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string };
    expect(body.accessToken).toBeTruthy();
  });

  it("refresh without cookie returns 401", async () => {
    const { request } = createClient();
    const res = await request("/auth/refresh", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("update me changes locale", async () => {
    const { request } = createClient();
    const email = randomEmail();
    const reg = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password: "password123", locale: "tr" }),
    });
    const { accessToken } = (await reg.json()) as { accessToken: string };
    const res = await request("/me", {
      method: "PATCH",
      body: JSON.stringify({ locale: "en" }),
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { locale: string };
    expect(body.locale).toBe("en");
  });
});
