import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";

export function makeTempDbUrl(): { url: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "medmanager-test-"));
  const url = `file:${join(dir, "test.db").replace(/\\/g, "/")}`;
  return {
    url,
    cleanup: () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    },
  };
}

export function randomEmail(): string {
  return `u-${Math.random().toString(36).slice(2, 10)}@example.com`;
}

export function asCookieJar() {
  const jar = new Map<string, string>();
  return {
    captureFrom(res: Response) {
      const header = res.headers.get("set-cookie");
      if (!header) return;
      const parts = header.split(/,(?=\s*[A-Za-z0-9_.-]+=)/);
      for (const part of parts) {
        const [kv] = part.split(";");
        if (!kv) continue;
        const eq = kv.indexOf("=");
        if (eq < 0) continue;
        const name = kv.slice(0, eq).trim();
        const value = kv.slice(eq + 1).trim();
        if (value === "" || /expires=Thu, 01 Jan 1970/i.test(part)) jar.delete(name);
        else jar.set(name, value);
      }
    },
    header(): string {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    clear() {
      jar.clear();
    },
  };
}
