import { eq, lte } from "drizzle-orm";
import webpush from "web-push";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { medicines, pushSubscriptions, users } from "../db/schema.js";
import { effectiveExpiryOf } from "../lib/medicines.js";

const NOTIFY_DAYS = [30, 7, 1, 0];

function configureWebPush() {
  if (!config.push.configured) return false;
  webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
  return true;
}

export async function runExpiryTick(now = new Date()): Promise<{ sent: number; pruned: number }> {
  if (!configureWebPush()) return { sent: 0, pruned: 0 };

  const todayIso = now.toISOString().slice(0, 10);
  const upperBound = new Date(now.getTime() + Math.max(...NOTIFY_DAYS) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const candidates = await db
    .select({ medicine: medicines, user: users })
    .from(medicines)
    .innerJoin(users, eq(users.id, medicines.userId))
    .where(lte(medicines.expiryDate, upperBound));

  let sent = 0;
  let pruned = 0;

  for (const { medicine, user } of candidates) {
    if (Number(medicine.quantity) <= 0) continue;
    const effective = effectiveExpiryOf(
      medicine.expiryDate,
      medicine.openedAt,
      medicine.openedShelfLifeDays,
    );
    const daysLeft = Math.round(
      (new Date(effective).getTime() - new Date(todayIso).getTime()) / (24 * 60 * 60 * 1000),
    );
    if (!NOTIFY_DAYS.includes(daysLeft)) continue;

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, medicine.userId));
    if (subs.length === 0) continue;

    const isEn = user.locale === "en";
    const payload = JSON.stringify({
      title: isEn ? "Medicine expiry reminder" : "İlaç son kullanma uyarısı",
      body: isEn
        ? `${medicine.name} — expires in ${daysLeft} days.`
        : `${medicine.name} — ${daysLeft} gün içinde sona eriyor.`,
      url: `/medicines/${medicine.id}`,
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number } | undefined)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          pruned += 1;
        }
      }
    }
  }

  return { sent, pruned };
}

export function startExpiryNotifier() {
  if (!config.push.configured) {
    console.log("[expiryNotifier] Skipped: PUSH_PUBLIC_KEY/PRIVATE_KEY not set.");
    return () => undefined;
  }

  const runAtHour = 9;
  let timer: NodeJS.Timeout | null = null;

  const schedule = () => {
    const now = new Date();
    const target = new Date(now);
    target.setUTCHours(runAtHour, 0, 0, 0);
    if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
    const delay = target.getTime() - now.getTime();
    timer = setTimeout(async () => {
      try {
        const result = await runExpiryTick();
        console.log(`[expiryNotifier] sent=${result.sent} pruned=${result.pruned}`);
      } catch (err) {
        console.error("[expiryNotifier] failed", err);
      }
      schedule();
    }, delay);
  };

  schedule();
  return () => {
    if (timer) clearTimeout(timer);
  };
}
