import { describe, expect, it } from "vitest";
import "./setup.js";
import { createClient } from "./fixture.js";
import { randomEmail } from "./helpers.js";

async function authenticate() {
  const { request } = createClient();
  const email = randomEmail();
  const res = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "password123", locale: "tr" }),
  });
  const { accessToken } = (await res.json()) as { accessToken: string };
  return {
    token: accessToken,
    auth: (init: RequestInit = {}) => ({
      ...init,
      headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${accessToken}` },
    }),
    request,
  };
}

describe("use-cases + medicines", () => {
  it("use-cases list is seeded and localized (tr)", async () => {
    const { request } = createClient();
    const res = await request("/use-cases", { headers: { "Accept-Language": "tr" } });
    expect(res.status).toBe(200);
    const items = (await res.json()) as { slug: string; name: string }[];
    expect(items.length).toBeGreaterThan(30);
    expect(items.some((u) => u.slug === "headache" && u.name === "Baş ağrısı")).toBe(true);
  });

  it("use-cases return english when requested", async () => {
    const { request } = createClient();
    const res = await request("/use-cases", { headers: { "Accept-Language": "en" } });
    const items = (await res.json()) as { slug: string; name: string }[];
    expect(items.some((u) => u.slug === "headache" && u.name === "Headache")).toBe(true);
  });

  it("create medicine returns 201 and persists use-cases", async () => {
    const { request, auth } = await authenticate();
    const uc = await request("/use-cases", auth());
    const all = (await uc.json()) as { id: string; slug: string }[];
    const fever = all.find((u) => u.slug === "fever");
    expect(fever).toBeTruthy();

    const res = await request(
      "/medicines",
      auth({
        method: "POST",
        body: JSON.stringify({
          name: "Paracetamol",
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
          quantity: 20,
          unit: "tablet",
          useCaseIds: [fever!.id],
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { name: string; useCases: { slug: string }[]; isExpired: boolean };
    expect(body.name).toBe("Paracetamol");
    expect(body.useCases.some((t) => t.slug === "fever")).toBe(true);
    expect(body.isExpired).toBe(false);
  });

  it("list only returns own medicines", async () => {
    const a = await authenticate();
    const b = await authenticate();
    await a.request(
      "/medicines",
      a.auth({
        method: "POST",
        body: JSON.stringify({
          name: "OnlyMine",
          expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          quantity: 1,
          unit: "unit",
        }),
      }),
    );
    const res = await b.request("/medicines", b.auth());
    const body = (await res.json()) as { items: { name: string }[] };
    expect(body.items.some((m) => m.name === "OnlyMine")).toBe(false);
  });

  it("open lid computes effective expiry", async () => {
    const { request, auth } = await authenticate();
    const expiry = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
    const create = await request(
      "/medicines",
      auth({
        method: "POST",
        body: JSON.stringify({
          name: "Syrup",
          expiryDate: expiry,
          quantity: 1,
          unit: "bottle",
          openedShelfLifeDays: 30,
        }),
      }),
    );
    const created = (await create.json()) as { id: string };
    const res = await request(
      `/medicines/${created.id}/open`,
      auth({ method: "POST", body: JSON.stringify({ openedShelfLifeDays: 30 }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { isOpened: boolean; effectiveExpiry: string };
    expect(body.isOpened).toBe(true);
    expect(body.effectiveExpiry < expiry).toBe(true);
  });

  it("delete removes medicine", async () => {
    const { request, auth } = await authenticate();
    const create = await request(
      "/medicines",
      auth({
        method: "POST",
        body: JSON.stringify({
          name: "ToDelete",
          expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          quantity: 1,
          unit: "u",
        }),
      }),
    );
    const { id } = (await create.json()) as { id: string };
    const del = await request(`/medicines/${id}`, auth({ method: "DELETE" }));
    expect(del.status).toBe(204);
    const get = await request(`/medicines/${id}`, auth());
    expect(get.status).toBe(404);
  });

  it("medicines require authentication", async () => {
    const { request } = createClient();
    const res = await request("/medicines");
    expect(res.status).toBe(401);
  });

  it("user can create custom use-case", async () => {
    const { request, auth } = await authenticate();
    const res = await request("/use-cases", auth({ method: "POST", body: JSON.stringify({ name: "Özel rahatsızlık" }) }));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; name: string };
    expect(body.name).toBe("Özel rahatsızlık");
  });
});
