import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { api, auth, type AuthResponse } from "../../lib/api/client";
import { useQueryClient } from "@tanstack/react-query";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignInButton() {
  if (!CLIENT_ID) return null;
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <InnerButton />
    </GoogleOAuthProvider>
  );
}

function InnerButton() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const body = await api<AuthResponse>("/auth/google", {
          method: "POST",
          body: JSON.stringify({ accessToken: response.access_token }),
        });
        auth.token = body.accessToken;
        qc.setQueryData(["me"], body.user);
        if (body.user.locale !== i18n.language) {
          await i18n.changeLanguage(body.user.locale);
        }
        await navigate({ to: "/" });
      } catch {
        // ignore; upstream forms show errors
      }
    },
    flow: "implicit",
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
        />
      </svg>
      {t("auth.sign_in_with_google")}
    </button>
  );
}
