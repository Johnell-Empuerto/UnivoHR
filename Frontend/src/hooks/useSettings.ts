import { useQuery } from "@tanstack/react-query";
import { getSetting, getAllSettings } from "@/services/settingsService";

export const useSetting = (key: string, enabled = true) => {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: () => getSetting(key),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: enabled && !!key,
  });
};

export const useAllSettings = (enabled = true) => {
  return useQuery({
    queryKey: ["settings", "all"],
    queryFn: getAllSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled,
  });
};
