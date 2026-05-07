import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { authClient } from "~/lib/auth-client";
import { api, type MeDto } from "~/lib/api/client";

const ME_KEY = ["me"] as const;

export function useMe() {
  return useQuery<MeDto | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
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
      const res = await authClient.signIn.email({
        email: input.email,
        password: input.password,
      });
      if (res.error) throw new Error(res.error.message ?? "Login failed");
      return res.data;
    },
    onSuccess: async () => {
      const me = await api<MeDto>("/me").catch(() => null);
      if (me) {
        qc.setQueryData(ME_KEY, me);
        if (me.locale && me.locale !== i18n.language) {
          await i18n.changeLanguage(me.locale);
        }
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
      const name = [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || input.email;
      const res = await authClient.signUp.email({
        email: input.email,
        password: input.password,
        name,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        locale: input.locale,
      });
      if (res.error) throw new Error(res.error.message ?? "Sign up failed");
      return res.data;
    },
    onSuccess: async () => {
      const me = await api<MeDto>("/me").catch(() => null);
      if (me) qc.setQueryData(ME_KEY, me);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
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
    mutationFn: async (input: { currentPassword?: string; newPassword: string }) => {
      const res = await authClient.changePassword({
        currentPassword: input.currentPassword ?? "",
        newPassword: input.newPassword,
      });
      if (res.error) throw new Error(res.error.message ?? "Password change failed");
      return res.data;
    },
  });
}
