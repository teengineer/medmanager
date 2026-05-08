import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLogout, useMe, useUpdateLocale } from "../auth/hooks";
import { displayInitial, displayName } from "../../lib/api/client";

export function AppHeader() {
  const { t } = useTranslation();
  const me = useMe();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = displayInitial(me.data);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-md supports-[backdrop-filter]:bg-white/65">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-lg font-bold tracking-tight text-transparent">
            MedManager
          </span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
          <NavLink to="/medicines" active={pathname.startsWith("/medicines")} icon={<MedicinesIcon />}>
            {t("medicine.my_medicines")}
          </NavLink>
          <NavLink to="/check" active={pathname.startsWith("/check")} icon={<CheckIcon />}>
            {t("check.title")}
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-semibold text-white shadow-brand transition hover:scale-105 hover:shadow-[0_10px_24px_rgba(227,10,23,0.28)]"
            aria-label={t("profile.title")}
            aria-expanded={menuOpen}
          >
            {initial}
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 md:hidden">
        <NavLink to="/medicines" active={pathname.startsWith("/medicines")} icon={<MedicinesIcon />}>
          {t("medicine.my_medicines")}
        </NavLink>
        <NavLink to="/check" active={pathname.startsWith("/check")} icon={<CheckIcon />}>
          {t("check.title")}
        </NavLink>
      </nav>

      {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

function NavLink({
  to,
  active,
  icon,
  children,
}: {
  to: string;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-brand-light text-brand-dark shadow-[inset_0_0_0_1px_rgba(227,10,23,0.15)]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function ProfileMenu({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const me = useMe();
  const logout = useLogout();
  const updateLocale = useUpdateLocale();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const toggleLang = () => {
    const next = i18n.language.startsWith("tr") ? "en" : "tr";
    updateLocale.mutate(next);
  };

  return (
    <div className="absolute inset-x-0 top-14 animate-pop">
      <div className="mx-auto flex max-w-5xl justify-end px-4">
        <div
          ref={ref}
          className="w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop"
        >
          {me.data && (
            <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50 to-white p-4 text-sm">
              <p className="font-semibold text-slate-900">{displayName(me.data)}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{me.data.email}</p>
              {!me.data.hasPassword && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-brand-dark shadow-soft">
                  <svg viewBox="0 0 24 24" className="size-3" aria-hidden>
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
                  Google
                </span>
              )}
            </div>
          )}
          <div className="py-1">
            <MenuItem to="/profile" onClick={onClose} icon={<UserIcon />}>
              {t("profile.title")}
            </MenuItem>
            <MenuItem to="/settings" onClick={onClose} icon={<ShieldIcon />}>
              {t("profile.data_and_privacy")}
            </MenuItem>
            <MenuItem to="/about" onClick={onClose} icon={<InfoIcon />}>
              {t("about.title")}
            </MenuItem>
            <button
              type="button"
              onClick={() => {
                toggleLang();
                onClose();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <GlobeIcon />
              <span className="flex-1">{t("profile.language")}</span>
              <span className="text-xs font-medium text-slate-500">{t("toggle_language")}</span>
            </button>
          </div>
          <div className="border-t border-slate-100" />
          <button
            type="button"
            onClick={() => {
              logout.mutate();
              onClose();
            }}
            disabled={logout.isPending}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            <LogoutIcon />
            {t("auth.sign_out")}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  to,
  onClick,
  icon,
  children,
}: {
  to: string;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
    >
      {icon}
      {children}
    </Link>
  );
}

function LogoMark() {
  return <img src="/favicon.png" alt="" className="size-8" />;
}

function MedicinesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
