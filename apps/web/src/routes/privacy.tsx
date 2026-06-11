import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language.startsWith("tr");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-mute hover:text-brand">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Bundan Var
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-brand">{t("legal.privacy")}</h1>

      {isTr ? (
        <div className="prose mt-6 space-y-4 text-ink-soft">
          <p>
            Bundan Var ("biz") olarak gizliliğinize önem veriyoruz. Bu sayfa hangi verileri
            topladığımızı, nasıl kullandığımızı ve haklarınızı özetler.
          </p>
          <h2 className="text-xl font-semibold text-ink">Topladığımız veriler</h2>
          <ul className="list-disc pl-5">
            <li>Kayıt sırasında: e-posta adresi, parola (BCrypt ile hash'lenmiş), dil tercihi, zaman dilimi.</li>
            <li>İlaç envanteri: adı, son kullanma tarihi, açılma tarihi, kullanım alanları, notlar.</li>
            <li>Bildirim abonelikleri (yalnızca bildirimleri etkinleştirdiyseniz).</li>
          </ul>
          <h2 className="text-xl font-semibold text-ink">Nasıl kullanıyoruz</h2>
          <p>
            Veriler yalnızca size hizmet sunmak ve son kullanma bildirimleri göndermek için kullanılır.
            Üçüncü taraflarla paylaşılmaz; reklam veya analiz amacıyla işlenmez.
          </p>
          <h2 className="text-xl font-semibold text-ink">Haklarınız (KVKK / GDPR)</h2>
          <ul className="list-disc pl-5">
            <li>Verilerinizi her zaman dışa aktarabilirsiniz (Ayarlar → Verilerimi indir).</li>
            <li>Hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz (Ayarlar → Hesabımı sil).</li>
            <li>Soru veya talepleriniz için: iletisim@bundanvar.local.</li>
          </ul>
          <h2 className="text-xl font-semibold text-ink">Saklama</h2>
          <p>Veriler siz silene kadar saklanır; hesap silindiğinde tüm ilişkili veriler de silinir.</p>
        </div>
      ) : (
        <div className="prose mt-6 space-y-4 text-ink-soft">
          <p>
            Bundan Var ("we") respects your privacy. This page summarises what we collect, how we
            use it, and your rights.
          </p>
          <h2 className="text-xl font-semibold text-ink">What we collect</h2>
          <ul className="list-disc pl-5">
            <li>At registration: email address, password (BCrypt-hashed), locale, timezone.</li>
            <li>Medicine inventory: name, expiry, opened date, use-cases, notes.</li>
            <li>Push subscriptions (only if you enable notifications).</li>
          </ul>
          <h2 className="text-xl font-semibold text-ink">How we use it</h2>
          <p>
            Only to provide the service and send expiry reminders. Never shared with third parties,
            never used for advertising or analytics.
          </p>
          <h2 className="text-xl font-semibold text-ink">Your rights (KVKK / GDPR)</h2>
          <ul className="list-disc pl-5">
            <li>Export your data any time (Settings → Export my data).</li>
            <li>Delete your account and all data permanently (Settings → Delete my account).</li>
            <li>Questions: contact@bundanvar.local.</li>
          </ul>
          <h2 className="text-xl font-semibold text-ink">Retention</h2>
          <p>Data is kept until you delete it; deleting your account removes all related data.</p>
        </div>
      )}
    </main>
  );
}
