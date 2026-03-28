import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "@/api/salons";

export interface ProviderSearchParams {
  q?: string;
  category?: string;
  sort?: string;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
  nationality?: string;
  minExperience?: number;
  bounds?: { latMin: number; latMax: number; lngMin: number; lngMax: number };
}

export function useProviderCategories() {
  return useQuery({
    queryKey: ["providers", "categories"],
    queryFn: () => providersApi.getCategories(),
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });
}

export function useSearchProviders(params: ProviderSearchParams) {
  return useQuery({
    queryKey: ["providers", "search", params],
    queryFn: () =>
      providersApi.search({
        q: params.q || undefined,
        category: params.category && params.category !== "All" ? params.category : undefined,
        sort: params.sort || undefined,
        available_date: params.date || undefined,
        min_price: params.minPrice || undefined,
        max_price: params.maxPrice || undefined,
        nationality: params.nationality || undefined,
        min_experience: params.minExperience || undefined,
        lat_min: params.bounds?.latMin,
        lat_max: params.bounds?.latMax,
        lng_min: params.bounds?.lngMin,
        lng_max: params.bounds?.lngMax,
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
