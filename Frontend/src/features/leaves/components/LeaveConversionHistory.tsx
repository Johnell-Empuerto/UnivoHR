import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { historyLeaveService } from "@/services/historyLeaveService";
import type {
  LeaveConversion,
  ConversionSummary,
  YearlySummary,
} from "@/services/historyLeaveService";
import { format } from "date-fns";

const LeaveConversionHistory = () => {
  const [conversions, setConversions] = useState<LeaveConversion[]>([]);
  const [summary, setSummary] = useState<ConversionSummary | null>(null);
  const [yearlySummary, setYearlySummary] = useState<YearlySummary[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [conversionsData, summaryData, yearlyData, yearsData] =
        await Promise.all([
          historyLeaveService.getAll(
            currentPage,
            rowsPerPage,
            search,
            selectedYear,
          ),
          historyLeaveService.getSummary(),
          historyLeaveService.getYearlySummary(),
          historyLeaveService.getAvailableYears(),
        ]);

      setConversions(conversionsData.data);
      setTotalPages(conversionsData.pagination.totalPages);
      setTotalRecords(conversionsData.pagination.total);
      setSummary(summaryData);
      setYearlySummary(yearlyData);
      setAvailableYears(yearsData);
    } catch (error) {
      console.error("Error fetching conversion history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, rowsPerPage, search, selectedYear]);

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSelectedYear("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setSearchInput("");
    setSearch("");
    setSelectedYear("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getFullName = (emp: LeaveConversion) => {
    const middle = emp.middle_name ? ` ${emp.middle_name}` : "";
    const suffix = emp.suffix ? ` ${emp.suffix}` : "";
    return `${emp.first_name}${middle} ${emp.last_name}${suffix}`;
  };

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalRecords);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Conversions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_conversions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.total_employees || 0} employees
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.total_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.total_years || 0} years
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Days Converted
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_days_converted || 0}
            </div>
            <p className="text-xs text-muted-foreground">Vacation leave days</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average per Employee
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_employees && summary.total_employees > 0
                ? formatCurrency(summary.total_amount / summary.total_employees)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per employee average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Summary Table */}
      {yearlySummary.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Yearly Summary</CardTitle>
            <p className="text-sm text-muted-foreground">
              Leave conversion breakdown by year
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Year</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Total Days</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlySummary.map((item) => (
                    <TableRow
                      key={item.year}
                      className="border-b border-gray-400/50 dark:border-gray-400/50"
                    >
                      <TableCell className="font-medium">{item.year}</TableCell>
                      <TableCell>{item.conversion_count}</TableCell>
                      <TableCell>{item.employees_count}</TableCell>
                      <TableCell>{item.total_days}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed History Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Conversion History</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed record of all leave conversions
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={selectedYear || "all"}
              onValueChange={(value) =>
                setSelectedYear(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {(searchInput || selectedYear) && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}

            <Button onClick={handleRefresh} variant="ghost">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading conversion history...
              </span>
            </div>
          )}

          {!loading && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Employee</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Daily Rate</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No conversion records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      conversions.map((conv) => (
                        <TableRow
                          key={conv.id}
                          className="border-b border-gray-400/50 dark:border-gray-400/50"
                        >
                          <TableCell className="font-medium">
                            {getFullName(conv)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {conv.employee_code}
                            </Badge>
                          </TableCell>
                          <TableCell>{conv.year}</TableCell>
                          <TableCell>
                            <Badge>{conv.leave_type}</Badge>
                          </TableCell>
                          <TableCell>{conv.days_converted}</TableCell>
                          <TableCell>
                            {formatCurrency(conv.daily_rate)}
                          </TableCell>
                          <TableCell>{conv.conversion_rate}x</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(conv.amount)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(conv.created_at), "MMM dd, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalRecords > 0 && (
                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Rows per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Rows per page:
                    </span>
                    <select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      className="border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Showing X to Y of Z */}
                  <div className="text-sm text-muted-foreground">
                    Showing {start} to {end} of {totalRecords} entries
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {getPageNumbers().map((page, index) => (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          typeof page === "number" && goToPage(page)
                        }
                        disabled={page === "..."}
                        className={`h-8 w-8 p-0 ${page === "..." ? "cursor-default" : ""}`}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveConversionHistory;
