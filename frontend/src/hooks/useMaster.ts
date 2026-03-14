import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mastersApi } from "@/api/masters";

export function useMyMasterProfile() {
  return useQuery({
    queryKey: ["master", "me"],
    queryFn: () => mastersApi.getMe(),
  });
}

export function useUpdateMasterProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof mastersApi.updateMe>[0]) => mastersApi.updateMe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["master", "me"] }),
  });
}

export function useSalonMasters(salonId: number, status?: string) {
  return useQuery({
    queryKey: ["masters", "salon", salonId, status],
    queryFn: () => mastersApi.getSalonMasters(salonId, status),
    enabled: !!salonId,
  });
}

export function useSalonMastersPublic(salonId: number) {
  return useQuery({
    queryKey: ["masters", "salon", salonId, "public"],
    queryFn: () => mastersApi.getSalonMastersPublic(salonId),
    enabled: !!salonId,
  });
}

export function useApproveMaster(salonId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ masterId, status, paymentAmount }: { masterId: number; status: string; paymentAmount?: number }) =>
      mastersApi.approveMaster(salonId, masterId, status, paymentAmount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["masters", "salon", salonId] }),
  });
}
