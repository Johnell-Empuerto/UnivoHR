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
import { useLeaveCredits } from "@/hooks/useLeaveCredits";
import { useMyLeaveTransactions } from "@/hooks/useMyLeaveTransactions";
import { Loader2, CalendarDays, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import { getTypeColor, getTypeLabel, normalizeCode, getCardColor } from "../utils/leaveTypeUtils";

interface BalanceItem {
  code: string;
  name?: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  carried_over_days?: number;
  adjusted_days?: number;
  is_unlimited?: boolean;
  is_paid?: boolean;
  requires_balance?: boolean;
  include_in_credits?: boolean;
  sort_order?: number;
}

interface LeaveCredits {
  id: number;
  employee_id: number;
  balances?: BalanceItem[];
  sick_leave?: number;
  vacation_leave?: number;
  used_sick_leave?: number;
  used_vacation_leave?: number;
  sick_leave_remaining?: number;
  vacation_leave_remaining?: number;
  maternity_leave?: number;
  used_maternity_leave?: number;
  maternity_leave_remaining?: number;
  emergency_leave?: number;
  used_emergency_leave?: number;
  emergency_leave_remaining?: number;
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
  const { data: creditsData, isLoading: creditsLoading, error: creditsError } = useLeaveCredits();
  const { data: txData, isLoading: txLoading, error: txError } = useMyLeaveTransactions();
  const [error, setError] = useState<string | null>(null);

  const credits: LeaveCredits | null = creditsData ?? null;
  const transactions: LeaveTransaction[] = txData?.data ?? [];
  const loading = creditsLoading || txLoading;

  useEffect(() => {
    if (creditsError || txError) {
      console.error("Error fetching leave data:", creditsError || txError);
      setError("Failed to load leave credits");
    }
  }, [creditsError, txError]);

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
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            APPROVED
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            REJECTED
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            PENDING
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
            {status}
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    const code = normalizeCode(type);
    const c = getTypeColor(code);
    return (
      <Badge variant="outline" className={`${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText} ${c.darkBorder}`}>
        {getTypeLabel(code)}
      </Badge>
    );
  };

  const renderBalanceCards = () => {
    const balances = credits?.balances || [];
    if (balances.length > 0) {
      const sorted = [...balances].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
      return sorted.map((b) => {
        const cc = getCardColor(b.code);
        const total = b.total_days || 0;
        const used = b.used_days || 0;
        const remaining = b.remaining_days ?? (total - used);
        const pct = total > 0 ? (used / total) * 100 : 0;
        return (
          <Card key={b.code} className={`bg-linear-to-br ${cc.from} ${cc.to} ${cc.border} ${cc.darkFrom} ${cc.darkTo} ${cc.darkBorder}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className={`h-5 w-5 ${cc.icon}`} />
                {getTypeLabel(b.code, b.name)} Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              {b.is_unlimited ? (
                <div className="space-y-2">
                  <span className="text-2xl font-bold text-gray-700 dark:text-gray-400">Unlimited</span>
                  {b.is_paid === false && <p className="text-sm text-muted-foreground">This leave is unpaid</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold" style={{ color: 'inherit' }}>{remaining}</span>
                    <span className="text-sm text-muted-foreground">/ {total} days</span>
                  </div>
                  {total > 0 && (
                    <>
                      <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-2">
                        <div className="bg-current h-2 rounded-full transition-all opacity-60" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-sm text-muted-foreground">Used: {used} days</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      });
    }

    const flatCards = [
      { code: 'SL', label: 'Sick Leave', remaining: credits?.sick_leave_remaining, total: credits?.sick_leave, used: credits?.used_sick_leave },
      { code: 'VL', label: 'Vacation Leave', remaining: credits?.vacation_leave_remaining, total: credits?.vacation_leave, used: credits?.used_vacation_leave },
      { code: 'ML', label: 'Maternity Leave', remaining: credits?.maternity_leave_remaining, total: credits?.maternity_leave, used: credits?.used_maternity_leave },
      { code: 'EL', label: 'Emergency Leave', remaining: credits?.emergency_leave_remaining, total: credits?.emergency_leave, used: credits?.used_emergency_leave },
    ];

    return (
      <>
        {flatCards.map((card) => {
          const cc = getCardColor(card.code);
          const pct = (card.total || 0) > 0 ? ((card.used || 0) / (card.total || 1)) * 100 : 0;
          return (
            <Card key={card.code} className={`bg-linear-to-br ${cc.from} ${cc.to} ${cc.border} ${cc.darkFrom} ${cc.darkTo} ${cc.darkBorder}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className={`h-5 w-5 ${cc.icon}`} />
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold" style={{ color: 'inherit' }}>{card.remaining || 0}</span>
                    <span className="text-sm text-muted-foreground">/ {card.total || 0} days</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-2">
                    <div className="bg-current h-2 rounded-full transition-all opacity-60" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">Used: {card.used || 0} days</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {/* NP Card */}
        <Card className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-900/30 border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-600" />
              No Pay Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold text-gray-700 dark:text-gray-400">Unlimited</span>
              <p className="text-sm text-muted-foreground">This leave is unpaid</p>
            </div>
          </CardContent>
        </Card>
      </>
    );
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
        {renderBalanceCards()}
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
            <EmptyState message="No leave transactions found" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
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
                        <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                        <TableCell>
                          {formatDate(transaction.from_date)}
                        </TableCell>
                        <TableCell>{formatDate(transaction.to_date)}</TableCell>
                        <TableCell>
                          <span className="font-medium">{days}</span> days
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
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
