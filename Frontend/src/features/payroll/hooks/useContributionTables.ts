import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSssTable, createSssRow, updateSssRow, deleteSssRow,
  getPhilHealthTable, createPhilHealthRow, updatePhilHealthRow, deletePhilHealthRow,
  getPagIbigTable, createPagIbigRow, updatePagIbigRow, deletePagIbigRow,
  getWithholdingTaxTable, createTaxRow, updateTaxRow, deleteTaxRow,
} from "@/services/contributionTableService";

export const useSssTable = () => useQuery({ queryKey: ["sss-table"], queryFn: getSssTable, staleTime: 10 * 60 * 1000 });
export const usePhilHealthTable = () => useQuery({ queryKey: ["philhealth-table"], queryFn: getPhilHealthTable, staleTime: 10 * 60 * 1000 });
export const usePagIbigTable = () => useQuery({ queryKey: ["pagibig-table"], queryFn: getPagIbigTable, staleTime: 10 * 60 * 1000 });
export const useWithholdingTaxTable = () => useQuery({ queryKey: ["withholding-tax-table"], queryFn: getWithholdingTaxTable, staleTime: 10 * 60 * 1000 });

const useMutateTable = (queryKey: string[], createFn: any, updateFn: any, deleteFn: any) => {
  const qc = useQueryClient();
  const create = useMutation({ mutationFn: createFn, onSuccess: () => qc.invalidateQueries({ queryKey }) });
  const update = useMutation({ mutationFn: (args: { id: number; data: Record<string, unknown> }) => updateFn(args.id, args.data), onSuccess: () => qc.invalidateQueries({ queryKey }) });
  const remove = useMutation({ mutationFn: deleteFn, onSuccess: () => qc.invalidateQueries({ queryKey }) });
  return { create, update, remove };
};

export const useSssMutations = () => useMutateTable(["sss-table"], createSssRow, updateSssRow, deleteSssRow);
export const usePhilHealthMutations = () => useMutateTable(["philhealth-table"], createPhilHealthRow, updatePhilHealthRow, deletePhilHealthRow);
export const usePagIbigMutations = () => useMutateTable(["pagibig-table"], createPagIbigRow, updatePagIbigRow, deletePagIbigRow);
export const useTaxMutations = () => useMutateTable(["withholding-tax-table"], createTaxRow, updateTaxRow, deleteTaxRow);
