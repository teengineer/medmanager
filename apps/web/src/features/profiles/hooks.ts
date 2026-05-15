import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";

export interface Profile {
  id: string;
  userId: string;
  name: string;
  relation: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInput {
  name: string;
  relation?: string | null;
  color?: string | null;
}

const PROFILES_KEY = ["profiles"] as const;

export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: PROFILES_KEY,
    queryFn: async () => {
      const res = await api<{ items: Profile[]; total: number }>("/profiles/");
      return res.items;
    },
    staleTime: 2 * 60_000,
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) =>
      api<Profile>("/profiles/", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}

export function useUpdateProfile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProfileInput>) =>
      api<Profile>(`/profiles/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/profiles/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}
