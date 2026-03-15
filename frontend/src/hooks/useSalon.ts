import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "@/api/salons";

export function usePublicProviders() {
  return useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
  });
}

export function usePublicProvider(id: number) {
  return useQuery({
    queryKey: ["providers", "public", id],
    queryFn: () => providersApi.getPublic(id),
    enabled: !!id,
  });
}

export function useProvider(id: number) {
  return useQuery({
    queryKey: ["providers", id],
    queryFn: () => providersApi.getById(id),
    enabled: !!id,
  });
}

export function useUpdateProvider(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof providersApi.update>[1]) => providersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers", id] });
    },
  });
}

// Backward-compat aliases
export const usePublicSalons = usePublicProviders;
export const usePublicSalon = usePublicProvider;
export const useSalon = useProvider;
export const useUpdateSalon = useUpdateProvider;
