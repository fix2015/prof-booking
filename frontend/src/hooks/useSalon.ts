import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salonsApi } from "@/api/salons";

export function usePublicSalons() {
  return useQuery({
    queryKey: ["salons", "public"],
    queryFn: () => salonsApi.listPublic(),
  });
}

export function usePublicSalon(id: number) {
  return useQuery({
    queryKey: ["salons", "public", id],
    queryFn: () => salonsApi.getPublic(id),
    enabled: !!id,
  });
}

export function useSalon(id: number) {
  return useQuery({
    queryKey: ["salons", id],
    queryFn: () => salonsApi.getById(id),
    enabled: !!id,
  });
}

export function useUpdateSalon(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof salonsApi.update>[1]) => salonsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salons", id] });
    },
  });
}
