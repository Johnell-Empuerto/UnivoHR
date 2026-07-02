import { useQuery } from "@tanstack/react-query";
import { getLatestForecasts } from "@/services/forecastService";

export const useLatestForecasts = () => {
  return useQuery({
    queryKey: ["latest-forecasts"],
    queryFn: () => getLatestForecasts(),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
