import { and, eq, isNull, lte } from "drizzle-orm";
import webpush from "web-push";
import { db } from "~/db";
import { medicines, pushSubscriptions, user as userTable } from "~/db/schema";
import { effectiveExpiryOf } from "~/lib/medicines";

const NOTIFY_DAYS = [30, 7, 1, 0];

function configureWebPush() {
  const subject = process.env.PUSH_SUBJECT ?? "mailto:admin@medmanager.local";
  const publicKey = process.env.PUSH_PUBLIC_KEY ?? "";
  const privateKey = process.env.PUSH_PRIVATE_KEY ?? "";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function runExpiryTick(now = new Date()): Promise<{ sent: number; pruned: number }> {
  if (!configureWebPush()) return { sent: 0, pruned: 0 };

  const todayIso = now.toISOString().slice(0, 10);
  const upperBound = new Date(now.getTime() + Math.max(...NOTIFY_DAYS) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const candidates = await db
    .select({ medicine: medicines, user: userTable })
    .from(medicines)
    .innerJoin(userTable, eq(userTable.id, medicines.userId))
    .where(and(lte(medicines.expiryDate, upperBound), isNull(medicines.archivedAt)));

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
