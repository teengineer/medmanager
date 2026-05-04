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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight text-brand">MedManager</span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
          <NavLink to="/medicines" active={pathname.startsWith("/medicines")}>
            {t("medicine.my_medicines")}
          </NavLink>
          <NavLink to="/check" active={pathname.startsWith("/check")}>
            {t("check.title")}
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand-dark"
            aria-label={t("profile.title")}
            aria-expanded={menuOpen}
          >
            {initial}
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1 md:hidden">
        <NavLink to="/medicines" active={pathname.startsWith("/medicines")}>
          {t("medicine.my_medicines")}
        </NavLink>
        <NavLink to="/check" active={pathname.startsWith("/check")}>
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
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand-light text-brand-dark" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
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
    <div className="absolute inset-x-0 top-14 flex justify-end px-4">
      <div
        ref={ref}
        className="w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
      >
        {me.data && (
          <div className="border-b border-slate-100 p-3 text-sm">
            <p className="font-medium text-slate-900">{displayName(me.data)}</p>
            <p className="text-xs text-slate-500">{me.data.email}</p>
            {!me.data.hasPassword && (
              <span className="mt-1 inline-block rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark">
                Google
              </span>
            )}
          </div>
        )}
        <MenuItem to="/profile" onClick={onClose}>
          {t("profile.title")}
        </MenuItem>
        <MenuItem to="/settings" onClick={onClose}>
          {t("profile.data_and_privacy")}
        </MenuItem>
        <MenuItem to="/about" onClick={onClose}>
          {t("about.title")}
        </MenuItem>
        <button
          type="button"
          onClick={() => {
            toggleLang();
            onClose();
          }}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
        >
          <span>{t("profile.language")}</span>
          <span className="text-xs text-slate-500">{t("toggle_language")}</span>
        </button>
        <div className="border-t border-slate-100" />
        <button
          type="button"
          onClick={() => {
            logout.mutate();
            onClose();
          }}
          disabled={logout.isPending}
          className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {t("auth.sign_out")}
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function LogoMark() {
  return <img src="/favicon.png" alt="" className="size-8" />;
}
