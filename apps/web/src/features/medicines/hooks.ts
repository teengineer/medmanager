import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";

export interface UseCaseTag {
  id: string;
  slug: string;
  name: string;
}

export interface Medicine {
  id: string;
  profileId?: string | null;
  name: string;
  activeIngredient?: string | null;
  strength?: string | null;
  form?: string | null;
  barcode?: string | null;
  expiryDate: string;
  openedAt?: string | null;
  openedShelfLifeDays?: number | null;
  effectiveExpiry: string;
  daysUntilExpiry: number;
  isExpired: boolean;
  isOpened: boolean;
  quantity: number;
  unit: string;
  notes?: string | null;
  image?: string | null;
  archivedAt?: string | null;
  useCases: UseCaseTag[];
}

export interface MedicineListResponse {
  items: Medicine[];
  total: number;
}

export interface UseCase {
  id: string;
  slug: string;
  name: string;
  icd10Code?: string | null;
}

export interface MedicineInput {
  name: string;
  profileId?: string | null;
  activeIngredient?: string;
  strength?: string;
  form?: string;
  barcode?: string;
  expiryDate: string;
  openedAt?: string | null;
  openedShelfLifeDays?: number | null;
  quantity: number;
  unit: string;
  notes?: string;
  image?: string | null;
  useCaseIds?: string[];
}

const MEDICINES_KEY = ["medicines"] as const;
const USE_CASES_KEY = ["use-cases"] as const;

export function useMedicines(params: { q?: string; useCase?: string; expired?: boolean; opened?: boolean; profileId?: string; archived?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.useCase) search.set("useCase", params.useCase);
  if (params.expired !== undefined) search.set("expired", String(params.expired));
  if (params.opened !== undefined) search.set("opened", String(params.opened));
  if (params.profileId) search.set("profileId", params.profileId);
  if (params.archived) search.set("archived", "true");
  const suffix = search.toString() ? `?${search}` : "";
  return useQuery<MedicineListResponse>({
    queryKey: [...MEDICINES_KEY, params],
    queryFn: () => api<MedicineListResponse>(`/medicines/${suffix}`),
  });
}

export function useMedicine(id: string | undefined) {
  return useQuery<Medicine>({
    queryKey: [...MEDICINES_KEY, "one", id],
    queryFn: () => api<Medicine>(`/medicines/${id}`),
    enabled: Boolean(id),
  });
}

export function useUseCases() {
  return useQuery<UseCase[]>({
    queryKey: USE_CASES_KEY,
    queryFn: () => api<UseCase[]>("/use-cases"),
    staleTime: 5 * 60_000,
  });
}

export function useCreateMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicineInput) =>
      api<Medicine>("/medicines", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  });
}

export function useUpdateMedicine(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<MedicineInput> & { clearOpenedAt?: boolean }) =>
      api<Medicine>(`/medicines/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  });
}

export function useDeleteMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/medicines/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  });
}

export function useCreateUseCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<UseCase>("/use-cases", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: (created) => {
      qc.setQueryData<UseCase[] | undefined>(USE_CASES_KEY, (prev) =>
        prev ? [...prev, created] : prev,
      );
    },
  });
}

export function useOpenMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, openedShelfLifeDays }: { id: string; openedShelfLifeDays?: number }) =>
      api<Medicine>(`/medicines/${id}/open`, {
        method: "POST",
        body: JSON.stringify({ openedShelfLifeDays }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  });
}

export function useArchiveMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      api<Medicine>(`/medicines/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ archive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: MEDICINES_KEY }),
  });
}

export interface UsageLog {
  id: string;
  medicineId: string;
  date: string;
  taken: boolean;
  notes: string | null;
  createdAt: string;
}

export function useUsageLogs(medicineId: string, days = 14) {
  return useQuery<UsageLog[]>({
    queryKey: ["usage-logs", medicineId, days],
    queryFn: () => api<UsageLog[]>(`/medicines/${medicineId}/usage-logs?days=${days}`),
    enabled: Boolean(medicineId),
  });
}

export function useLogUsage(medicineId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; taken: boolean; notes?: string }) =>
      api<UsageLog>(`/medicines/${medicineId}/log-usage`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usage-logs", medicineId] }),
  });
}
