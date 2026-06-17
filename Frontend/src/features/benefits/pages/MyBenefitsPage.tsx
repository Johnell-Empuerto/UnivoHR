import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/shared/EmptyState";
import Loader from "@/components/shared/Loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMyBenefits } from "@/services/payrollService";
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "sonner";
import {
  HeartHandshake,
  BadgeInfo,
  Hash,
  Shield,
  FileText,
  CreditCard,
  PiggyBank,
  ListChecks,
  CircleDollarSign,
} from "lucide-react";

const formatDeductionLabel = (type: string) => {
  switch (type.toUpperCase()) {
    case "SSS":
      return "SSS (Social Security System)";
    case "PHILHEALTH":
      return "PhilHealth (Philippine Health Insurance)";
    case "PAGIBIG":
      return "Pag-IBIG (Home Development Mutual Fund)";
    case "TAX":
      return "Withholding Tax";
    case "LOAN":
      return "Loan";
    case "OTHER":
      return "Other";
    default:
      return type;
  }
};

const getDeductionIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case "SSS":
      return <Shield className="h-5 w-5" />;
    case "PHILHEALTH":
      return <HeartHandshake className="h-5 w-5" />;
    case "PAGIBIG":
      return <CreditCard className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const getDeductionColor = (type: string) => {
  switch (type.toUpperCase()) {
    case "SSS":
      return "from-blue-50/50 to-transparent dark:from-blue-950/20";
    case "PHILHEALTH":
      return "from-green-50/50 to-transparent dark:from-green-950/20";
    case "PAGIBIG":
      return "from-purple-50/50 to-transparent dark:from-purple-950/20";
    case "TAX":
      return "from-orange-50/50 to-transparent dark:from-orange-950/20";
    default:
      return "from-slate-50/50 to-transparent dark:from-slate-950/20";
  }
};

const formatCurrency = (value: number) => {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const MyBenefitsPage = () => {
  const [benefits, setBenefits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        setLoading(true);
        const data = await getMyBenefits();
        setBenefits(data);
      } catch (error) {
        console.error("Failed to load benefits:", error);
        toast.error("Failed to load your benefits. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchBenefits();
  }, []);

  const govIds = benefits?.government_ids || {};
  const deductions = benefits?.deductions || [];

  const hasIds = govIds.sss_number || govIds.philhealth_number || govIds.hdmf_number || govIds.tin_number;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <HeartHandshake className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            My Benefits
          </h1>
          <p className="text-sm text-muted-foreground">
            View your government-mandated benefits and contributions
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading benefits..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Benefits
                </CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{deductions.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Monthly Contribution
                </CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₱{formatCurrency(deductions.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0))}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Government IDs
                </CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{hasIds ? Object.values(govIds).filter(Boolean).length : 0}</p>
                <p className="text-xs text-muted-foreground mt-1">linked to your profile</p>
              </CardContent>
            </Card>
          </div>

          {hasIds && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {govIds.sss_number && (
                <Card className="border-border/50 shadow-sm bg-linear-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" /> SSS Number
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-mono font-bold">{govIds.sss_number}</p>
                  </CardContent>
                </Card>
              )}
              {govIds.philhealth_number && (
                <Card className="border-border/50 shadow-sm bg-linear-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" /> PhilHealth Number
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-mono font-bold">{govIds.philhealth_number}</p>
                  </CardContent>
                </Card>
              )}
              {govIds.hdmf_number && (
                <Card className="border-border/50 shadow-sm bg-linear-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" /> Pag-IBIG Number
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-mono font-bold">{govIds.hdmf_number}</p>
                  </CardContent>
                </Card>
              )}
              {govIds.tin_number && (
                <Card className="border-border/50 shadow-sm bg-linear-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" /> TIN Number
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-mono font-bold">{govIds.tin_number}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BadgeInfo className="h-5 w-5" />
                Active Contributions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your current government-mandated contribution amounts
              </p>
            </CardHeader>
            <CardContent>
              {deductions.length === 0 ? (
                <EmptyState message="No active contributions found" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deductions.map((ded: any) => (
                    <Card
                      key={ded.id}
                      className={`border-border/50 shadow-sm bg-linear-to-br ${getDeductionColor(ded.type)}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-muted-foreground">
                              {getDeductionIcon(ded.type)}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {formatDeductionLabel(ded.type)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Monthly contribution
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-primary/10 text-primary dark:text-black text-sm px-3 py-1">
                            ₱{formatCurrency(Number(ded.amount))}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contribution Summary
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed breakdown of all active deductions
              </p>
            </CardHeader>
            <CardContent>
              {deductions.length === 0 ? (
                <EmptyState message="No deductions to display" />
              ) : (
                <div className="rounded-md border shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deductions.map((ded: any) => (
                        <TableRow key={ded.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getDeductionIcon(ded.type)}
                              {formatDeductionLabel(ded.type)}
                            </div>
                          </TableCell>
                          <TableCell>
                            ₱{formatCurrency(Number(ded.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MyBenefitsPage;
