import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, auth, refreshTokens, type AuthResponse, type MeDto } from "../../lib/api/client";

const ME_KEY = ["me"] as const;

export function useMe() {
  return useQuery<MeDto | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      if (!auth.token) {
        const refreshed = await refreshTokens();
        if (!refreshed) return null;
      }
      try {
        return await api<MeDto>("/me");
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

interface LoginInput {
  email: string;
  password: string;
}

export function useLogin() {
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
      auth.token = res.accessToken;
      return res;
    },
    onSuccess: async (res) => {
      qc.setQueryData(ME_KEY, res.user);
      if (res.user.locale !== i18n.language) {
        await i18n.changeLanguage(res.user.locale);
      }
    },
  });
}

interface RegisterInput {
  email: string;
  password: string;
  locale: "tr" | "en";
  firstName?: string;
  lastName?: string;
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const res = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      auth.token = res.accessToken;
      return res;
    },
    onSuccess: (res) => {
      qc.setQueryData(ME_KEY, res.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await api<void>("/auth/logout", { method: "POST" });
      } finally {
        auth.token = null;
      }
    },
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });
}

export function useUpdateLocale() {
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  return useMutation({
    mutationFn: async (locale: "tr" | "en") => {
      const res = await api<MeDto>("/me", {
        method: "PATCH",
        body: JSON.stringify({ locale }),
      });
      await i18n.changeLanguage(locale);
      return res;
    },
    onSuccess: (me) => {
      qc.setQueryData(ME_KEY, me);
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      locale?: "tr" | "en";
      timeZone?: string;
      firstName?: string | null;
      lastName?: string | null;
    }) => api<MeDto>("/me", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (me) => qc.setQueryData(ME_KEY, me),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword?: string; newPassword: string }) =>
      api<void>("/me/password", { method: "POST", body: JSON.stringify(input) }),
  });
}
