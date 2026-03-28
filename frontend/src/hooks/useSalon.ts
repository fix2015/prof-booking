import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "@/api/salons";

export interface ProviderSearchParams {
  q?: string;
  sort?: string;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
  nationality?: string;
  minExperience?: number;
}

export function useSearchProviders(params: ProviderSearchParams) {
  return useQuery({
    queryKey: ["providers", "search", params],
    queryFn: () =>
      providersApi.search({
        q: params.q || undefined,
        sort: params.sort || undefined,
        available_date: params.date || undefined,
        min_price: params.minPrice || undefined,
        max_price: params.maxPrice || undefined,
        nationality: params.nationality || undefined,
        min_experience: params.minExperience || undefined,
      }),
  });
}

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
