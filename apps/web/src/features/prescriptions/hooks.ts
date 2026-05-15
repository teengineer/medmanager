import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api/client";

export interface PrescriptionMedicine {
  name: string;
  activeIngredient?: string | null;
  strength?: string | null;
  form?: string | null;
}

export interface PrescriptionDto {
  id: string;
  profileId: string | null;
  profileName: string | null;
  doctorName: string | null;
  prescriptionDate: string;
  notes: string | null;
  medicines: PrescriptionMedicine[];
  createdAt: string;
}

export interface PrescriptionInput {
  profileId?: string | null;
  doctorName?: string | null;
  prescriptionDate: string;
  notes?: string | null;
  medicines?: PrescriptionMedicine[];
}

const PRESCRIPTIONS_KEY = ["prescriptions"] as const;

export function usePrescriptions(profileId?: string) {
  const suffix = profileId ? `?profile_id=${profileId}` : "";
  return useQuery<PrescriptionDto[]>({
    queryKey: [...PRESCRIPTIONS_KEY, profileId],
    queryFn: async () => {
      const res = await api<{ items: PrescriptionDto[]; total: number }>(`/prescriptions/${suffix}`);
      return res.items;
    },
  });
}

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PrescriptionInput) =>
      api<PrescriptionDto>("/prescriptions/", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY }),
  });
}

export function useDeletePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/prescriptions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRESCRIPTIONS_KEY }),
  });
}
