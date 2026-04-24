import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api/client";

interface VapidResponse {
  publicKey: string | null;
  configured: boolean;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) buf[i] = raw.charCodeAt(i);
  return buf;
}

export function useNotifications() {
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    supported && "Notification" in window ? Notification.permission : "default",
  );
  const [subscribed, setSubscribed] = useState(false);

  const vapid = useQuery<VapidResponse>({
    queryKey: ["push-vapid"],
    queryFn: () => api<VapidResponse>("/push/vapid-public-key"),
    enabled: supported,
  });

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => undefined);
  }, [supported]);

  const enable = useCallback(async () => {
    if (!supported) return { ok: false, reason: "unsupported" as const };
    if (!vapid.data?.configured || !vapid.data.publicKey)
      return { ok: false, reason: "not_configured" as const };

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return { ok: false, reason: "denied" as const };

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.data.publicKey) as unknown as BufferSource,
      }));

    const json = sub.toJSON();
    await api<void>("/me/push-subscriptions", {
      method: "POST",
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      }),
    });
    setSubscribed(true);
    return { ok: true };
  }, [supported, vapid.data]);

  const disable = useCallback(async () => {
    if (!supported) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      setSubscribed(false);
      return;
    }
    await api<void>("/me/push-subscriptions", {
      method: "DELETE",
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
    setSubscribed(false);
  }, [supported]);

  return {
    supported,
    configured: Boolean(vapid.data?.configured),
    permission,
    subscribed,
    enable,
    disable,
  };
}
