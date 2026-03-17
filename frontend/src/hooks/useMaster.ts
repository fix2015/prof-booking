import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalsApi, mastersApi } from "@/api/masters";

export function useMyProfessionalProfile() {
  return useQuery({
    queryKey: ["professional", "me"],
    queryFn: () => professionalsApi.getMe(),
  });
}

export function useUpdateProfessionalProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof professionalsApi.updateMe>[0]) =>
      professionalsApi.updateMe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional", "me"] }),
  });
}

export function useProviderProfessionals(providerId: number, status?: string) {
  return useQuery({
    queryKey: ["professionals", "provider", providerId, status],
    queryFn: () => professionalsApi.getProviderProfessionals(providerId, status),
    enabled: !!providerId,
  });
}

export function useProviderProfessionalsPublic(providerId: number) {
  return useQuery({
    queryKey: ["professionals", "provider", providerId, "public"],
    queryFn: () => professionalsApi.getProviderProfessionalsPublic(providerId),
    enabled: !!providerId,
  });
}

export function useApproveProfessional(providerId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      professionalId,
      status,
      paymentAmount,
    }: {
      professionalId: number;
      status: string;
      paymentAmount?: number;
    }) => professionalsApi.approveProfessional(providerId, professionalId, status, paymentAmount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professionals", "provider", providerId] }),
  });
}

export function useAttachToProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: number) => professionalsApi.attachToProvider(providerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional", "me"] }),
  });
}

export function useDetachFromProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: number) => professionalsApi.detachFromProvider(providerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional", "me"] }),
  });
}

// Backward-compat aliases
export const useMyMasterProfile = useMyProfessionalProfile;
export const useUpdateMasterProfile = useUpdateProfessionalProfile;

export function useSalonMasters(salonId: number, status?: string) {
  return useProviderProfessionals(salonId, status);
}

export function useSalonMastersPublic(salonId: number) {
  return useProviderProfessionalsPublic(salonId);
}

export function useApproveMaster(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      masterId,
      status,
      paymentAmount,
    }: {
      masterId: number;
      status: string;
      paymentAmount?: number;
    }) => mastersApi.approveMaster(salonId, masterId, status, paymentAmount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professionals", "provider", salonId] }),
  });
}
