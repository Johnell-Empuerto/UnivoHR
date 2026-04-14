// features/leaves/components/CreditLeaveTable.tsx
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
import { leaveService } from "@/services/leaveService";
import { Loader2, Calendar, Clock, CheckCircle } from "lucide-react";

interface LeaveCredits {
  id: number;
  employee_id: number;
  sick_leave: number;
  vacation_leave: number;
  used_sick_leave: number;
  used_vacation_leave: number;
  sick_leave_remaining: number;
  vacation_leave_remaining: number;
  maternity_leave: number;
  used_maternity_leave: number;
  maternity_leave_remaining: number;
  emergency_leave: number;
  used_emergency_leave: number;
  emergency_leave_remaining: number;
}

interface LeaveTransaction {
  id: number;
  type: string;
  from_date: string;
  to_date: string;
  status: string;
  reason: string;
  created_at: string;
}

const CreditLeaveTable = () => {
  const [credits, setCredits] = useState<LeaveCredits | null>(null);
  const [transactions, setTransactions] = useState<LeaveTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCreditsAndHistory();
  }, []);

  const fetchCreditsAndHistory = async () => {
    try {
      setLoading(true);
      // Get credits
      const creditsData = await leaveService.getLeaveCredits();
      setCredits(creditsData);

      // Get leave history
      const leavesData = await leaveService.getMyLeaves();
      setTransactions(leavesData);
    } catch (err) {
      console.error("Error fetching credits:", err);
      setError("Failed to load leave credits");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "SICK":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ANNUAL":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "MATERNITY":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
      case "EMERGENCY":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "NO_PAY":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credits Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sick Leave Card */}
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Sick Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {credits?.sick_leave_remaining || 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {credits?.sick_leave || 0} days
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800/50 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((credits?.used_sick_leave || 0) / (credits?.sick_leave || 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Used: {credits?.used_sick_leave || 0} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vacation Leave Card */}
        <Card className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Vacation Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {credits?.vacation_leave_remaining || 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {credits?.vacation_leave || 0} days
                </span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-800/50 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((credits?.used_vacation_leave || 0) / (credits?.vacation_leave || 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Used: {credits?.used_vacation_leave || 0} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/*  Maternity Leave Card */}
        <Card className="bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30 border-pink-200 dark:border-pink-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              👶 Maternity Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold text-pink-700 dark:text-pink-400">
                  {credits?.maternity_leave_remaining || 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {credits?.maternity_leave || 0} days
                </span>
              </div>
              <div className="w-full bg-pink-200 dark:bg-pink-800/50 rounded-full h-2">
                <div
                  className="bg-pink-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((credits?.used_maternity_leave || 0) / (credits?.maternity_leave || 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Used: {credits?.used_maternity_leave || 0} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/*  Emergency Leave Card */}
        <Card className="bg-linear-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              🚨 Emergency Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                  {credits?.emergency_leave_remaining || 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {credits?.emergency_leave || 0} days
                </span>
              </div>
              <div className="w-full bg-yellow-200 dark:bg-yellow-800/50 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((credits?.used_emergency_leave || 0) / (credits?.emergency_leave || 1)) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Used: {credits?.used_emergency_leave || 0} days
              </p>
            </div>
          </CardContent>
        </Card>

        {/*  No Pay Leave Card (Special - Unlimited) */}
        <Card className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-900/30 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              💸 No Pay Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold text-gray-700 dark:text-gray-400">
                Unlimited
              </span>
              <p className="text-sm text-muted-foreground">
                This leave is unpaid
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Leave Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leave transactions found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const days = Math.ceil(
                      (new Date(transaction.to_date).getTime() -
                        new Date(transaction.from_date).getTime()) /
                        (1000 * 60 * 60 * 24) +
                        1,
                    );

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getTypeBadge(
                              transaction.type,
                            )}`}
                          >
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.from_date)}
                        </TableCell>
                        <TableCell>{formatDate(transaction.to_date)}</TableCell>
                        <TableCell>
                          <span className="font-medium">{days}</span> days
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(
                              transaction.status,
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.reason || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditLeaveTable;
