"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSssTable, usePhilHealthTable, usePagIbigTable, useWithholdingTaxTable } from "../hooks/useContributionTables";
import { formatCurrency } from "@/utils/formatCurrency";

const ContributionTablesPanel = () => {
  const { data: sssData = [], isLoading: sssLoading } = useSssTable();
  const { data: philHealthData = [], isLoading: philHealthLoading } = usePhilHealthTable();
  const { data: pagIbigData = [], isLoading: pagIbigLoading } = usePagIbigTable();
  const { data: taxData = [], isLoading: taxLoading } = useWithholdingTaxTable();

  const renderLoader = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const renderEmpty = () => (
    <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
      No data available
    </div>
  );

  type SssRow = { salary_from: number; salary_to: number; employer_share: number; employee_share: number; total_contribution: number };
  type PhilHealthRow = { salary_from: number; salary_to: number; employee_rate: number; employer_rate: number; monthly_premium: number };
  type PagIbigRow = { salary_from: number; salary_to: number; employee_share: number; employer_share: number };
  type TaxRow = { salary_from: number; salary_to: number; tax_base: number; percentage_over_base: number };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Government Contribution Tables</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sss">
          <TabsList>
            <TabsTrigger value="sss">SSS</TabsTrigger>
            <TabsTrigger value="philhealth">PhilHealth</TabsTrigger>
            <TabsTrigger value="pagibig">Pag-IBIG</TabsTrigger>
            <TabsTrigger value="tax">BIR Tax</TabsTrigger>
          </TabsList>

          <TabsContent value="sss">
            {sssLoading ? renderLoader() : sssData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead>
                    <TableHead>Salary To</TableHead>
                    <TableHead>Employer Share</TableHead>
                    <TableHead>Employee Share</TableHead>
                    <TableHead>Total Contribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sssData.map((row: SssRow, i: number) => (
                    <TableRow key={i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>₱{formatCurrency(row.employer_share)}</TableCell>
                      <TableCell>₱{formatCurrency(row.employee_share)}</TableCell>
                      <TableCell>₱{formatCurrency(row.total_contribution)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="philhealth">
            {philHealthLoading ? renderLoader() : philHealthData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead>
                    <TableHead>Salary To</TableHead>
                    <TableHead>Employee Rate (%)</TableHead>
                    <TableHead>Employer Rate (%)</TableHead>
                    <TableHead>Monthly Premium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {philHealthData.map((row: PhilHealthRow, i: number) => (
                    <TableRow key={i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>{row.employee_rate}%</TableCell>
                      <TableCell>{row.employer_rate}%</TableCell>
                      <TableCell>₱{formatCurrency(row.monthly_premium)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="pagibig">
            {pagIbigLoading ? renderLoader() : pagIbigData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead>
                    <TableHead>Salary To</TableHead>
                    <TableHead>Employee Share (%)</TableHead>
                    <TableHead>Employer Share (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagIbigData.map((row: PagIbigRow, i: number) => (
                    <TableRow key={i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>{row.employee_share}%</TableCell>
                      <TableCell>{row.employer_share}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="tax">
            {taxLoading ? renderLoader() : taxData.length === 0 ? renderEmpty() : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salary From</TableHead>
                    <TableHead>Salary To</TableHead>
                    <TableHead>Tax Base</TableHead>
                    <TableHead>% Over Base</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxData.map((row: TaxRow, i: number) => (
                    <TableRow key={i}>
                      <TableCell>₱{formatCurrency(row.salary_from)}</TableCell>
                      <TableCell>₱{formatCurrency(row.salary_to)}</TableCell>
                      <TableCell>₱{formatCurrency(row.tax_base)}</TableCell>
                      <TableCell>{row.percentage_over_base}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContributionTablesPanel;
