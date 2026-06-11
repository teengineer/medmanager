import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language.startsWith("tr");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-mute hover:text-brand">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        bundanvar
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-brand">{t("legal.terms")}</h1>

      {isTr ? (
        <div className="prose mt-6 space-y-4 text-ink-soft">
          <p>
            Bundan Var kişisel ilaç envanteri takibi amacıyla sunulan bir araçtır. Kullanmakla
            aşağıdaki koşulları kabul etmiş olursunuz.
          </p>
          <h2 className="text-xl font-semibold text-ink">Tıbbi tavsiye değildir</h2>
          <p>
            Uygulama tıbbi tavsiye, tanı veya tedavi sağlamaz. Her ilaç kullanımı için doktorunuza
            danışın. Uygulamadaki bilgilere dayanarak yapılan kararlardan sorumlu değiliz.
          </p>
          <h2 className="text-xl font-semibold text-ink">Hesap sorumluluğu</h2>
          <p>Parolanızı güvende tutmak ve hesabınızdaki işlemlerden sorumlu olmak size aittir.</p>
          <h2 className="text-xl font-semibold text-ink">Hizmetin kesintisi</h2>
          <p>Hizmet "olduğu gibi" sunulur; erişilebilirlik veya doğruluk garantisi verilmez.</p>
          <h2 className="text-xl font-semibold text-ink">Değişiklikler</h2>
          <p>Şartlarda yapılan değişiklikler bu sayfada yayımlanır.</p>
        </div>
      ) : (
        <div className="prose mt-6 space-y-4 text-ink-soft">
          <p>
            Bundan Var is a personal medicine-inventory tool. By using it you accept the terms
            below.
          </p>
          <h2 className="text-xl font-semibold text-ink">Not medical advice</h2>
          <p>
            The app does not provide medical advice, diagnosis, or treatment. Always consult your
            doctor before using a medicine. We are not liable for decisions made based on data in
            the app.
          </p>
          <h2 className="text-xl font-semibold text-ink">Account responsibility</h2>
          <p>You are responsible for keeping your password safe and for activity in your account.</p>
          <h2 className="text-xl font-semibold text-ink">Service availability</h2>
          <p>Service is provided "as is" with no warranty of uptime or accuracy.</p>
          <h2 className="text-xl font-semibold text-ink">Changes</h2>
          <p>Any changes to these terms will be posted on this page.</p>
        </div>
      )}
    </main>
  );
}
