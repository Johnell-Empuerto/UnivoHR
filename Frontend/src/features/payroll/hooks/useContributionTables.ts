import { useQuery } from "@tanstack/react-query";
import { getSssTable, getPhilHealthTable, getPagIbigTable, getWithholdingTaxTable } from "@/services/contributionTableService";

export const useSssTable = () => useQuery({ queryKey: ["sss-table"], queryFn: getSssTable, staleTime: 10 * 60 * 1000 });
export const usePhilHealthTable = () => useQuery({ queryKey: ["philhealth-table"], queryFn: getPhilHealthTable, staleTime: 10 * 60 * 1000 });
export const usePagIbigTable = () => useQuery({ queryKey: ["pagibig-table"], queryFn: getPagIbigTable, staleTime: 10 * 60 * 1000 });
export const useWithholdingTaxTable = () => useQuery({ queryKey: ["withholding-tax-table"], queryFn: getWithholdingTaxTable, staleTime: 10 * 60 * 1000 });
