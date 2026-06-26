import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/utils/statusBadge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  History,
  UserPlus,
} from "lucide-react";
import {
  downloadEmployeeImportTemplate,
  validateEmployeeImport,
  commitEmployeeImport,
  getEmployeeImportHistory,
  downloadEmployeeImportErrors,
} from "@/services/employeeService";

type PreviewRow = {
  rowNumber: number;
  status: "valid" | "invalid";
  employeeCode: string;
  firstName: string;
  lastName: string;
  branch: string;
  errors: string[];
};

type ValidationSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
};

type ImportHistoryItem = {
  batchId: number;
  originalFilename: string | null;
  filename?: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedCount: number;
  failedCount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
};

type BulkImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
};

const BulkImportDialog = ({ open, onClose, onImportComplete }: BulkImportDialogProps) => {
  const [activeTab, setActiveTab] = useState("import");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setSelectedFile(null);
    setValidating(false);
    setImporting(false);
    setBatchId(null);
    setSummary(null);
    setPreviewRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    setActiveTab("import");
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadEmployeeImportTemplate();
      toast.success("Template downloaded");
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setStep("upload");
    setSummary(null);
    setPreviewRows([]);
    setBatchId(null);
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    const validExts = [".xlsx", ".xls", ".csv"];
    const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      toast.error("Please select an Excel file (.xlsx, .xls) or CSV file");
      return;
    }

    setValidating(true);
    try {
      const result = await validateEmployeeImport(selectedFile);
      setBatchId(result.batchId);
      setSummary(result.summary);
      setPreviewRows(result.previewRows);
      setStep("preview");
      toast.success(`Validated: ${result.summary.validRows} valid, ${result.summary.invalidRows} invalid`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const handleCommit = async () => {
    if (!batchId) return;
    setImporting(true);
    try {
      const result = await commitEmployeeImport(batchId);
      setStep("done");
      toast.success(result.message || "Import completed successfully");
      onImportComplete();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (!batchId) return;
    try {
      await downloadEmployeeImportErrors(batchId);
      toast.success("Error report downloaded");
    } catch {
      toast.error("Failed to download error report");
    }
  };

  const handleLoadHistory = async () => {
    setLoadingHistory(true);
    try {
      const result = await getEmployeeImportHistory();
      setHistory(result.history || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "history") {
      handleLoadHistory();
    }
  };

  const canCommit = batchId && summary && summary.validRows > 0 && !importing;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className={getStatusBadgeClass("success")}>Valid</Badge>;
      case "invalid":
        return <Badge className={getStatusBadgeClass("danger")}>Invalid</Badge>;
      case "completed":
        return <Badge className={getStatusBadgeClass("success")}>Completed</Badge>;
      case "failed":
        return <Badge className={getStatusBadgeClass("danger")}>Failed</Badge>;
      case "validated":
        return <Badge variant="secondary">Validated</Badge>;
      case "importing":
        return <Badge variant="outline" className="text-blue-600">Importing...</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Employee Bulk Import
          </DialogTitle>
          <DialogDescription>
            Import multiple employees from an Excel or CSV file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4 pt-4">
            {step === "upload" && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <Button onClick={handleDownloadTemplate} variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download Template
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        (.xlsx format with 28 columns and instructions)
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Upload File</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 cursor-pointer"
                      />
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={handleValidate}
                    disabled={!selectedFile || validating}
                    className="flex items-center gap-2"
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {validating ? "Validating..." : "Upload & Validate"}
                  </Button>
                </div>
              </div>
            )}

            {step === "preview" && summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{summary.totalRows}</p>
                      <p className="text-xs text-muted-foreground">Total Rows</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{summary.validRows}</p>
                      <p className="text-xs text-muted-foreground">Valid Rows</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{summary.invalidRows}</p>
                      <p className="text-xs text-muted-foreground">Invalid Rows</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-amber-600">{summary.duplicateRows}</p>
                      <p className="text-xs text-muted-foreground">Duplicate Rows</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Preview</CardTitle>
                    {batchId && summary.invalidRows > 0 && (
                      <Button variant="outline" size="sm" onClick={handleDownloadErrors} className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        Error Report
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-3 py-2 text-left font-medium">Row</th>
                            <th className="px-3 py-2 text-left font-medium">Code</th>
                            <th className="px-3 py-2 text-left font-medium">Name</th>
                            <th className="px-3 py-2 text-left font-medium">Branch</th>
                            <th className="px-3 py-2 text-left font-medium">Status</th>
                            <th className="px-3 py-2 text-left font-medium">Errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row) => (
                            <tr key={row.rowNumber} className="border-b">
                              <td className="px-3 py-2">{row.rowNumber}</td>
                              <td className="px-3 py-2 font-mono text-xs">{row.employeeCode}</td>
                              <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                              <td className="px-3 py-2">{row.branch}</td>
                              <td className="px-3 py-2">{getStatusBadge(row.status)}</td>
                              <td className="px-3 py-2">
                                {row.errors.length > 0 ? (
                                  <div className="flex flex-col gap-0.5">
                                    {row.errors.map((err, idx) => (
                                      <span key={idx} className="text-xs text-red-600 flex items-center gap-1">
                                        <XCircle className="h-3 w-3 shrink-0" />
                                        {err}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    No errors
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetState} disabled={importing}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    {summary.invalidRows > 0 && batchId && (
                      <Button variant="outline" onClick={handleDownloadErrors} className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        Download Error Report
                      </Button>
                    )}
                    <Button
                      onClick={handleCommit}
                      disabled={!canCommit}
                      className="flex items-center gap-2"
                    >
                      {importing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {importing ? "Importing..." : "Confirm Import"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === "done" && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Import Complete</h3>
                    <p className="text-sm text-muted-foreground">
                      {summary?.validRows || 0} employees have been imported successfully.
                    </p>
                    {batchId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Accounts created if Username/Password/Role columns were provided in the template.
                      </p>
                    )}
                    {summary && summary.invalidRows > 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        {summary.invalidRows} rows had errors and were skipped.
                        {batchId && (
                          <button
                            onClick={handleDownloadErrors}
                            className="ml-1 underline text-blue-600 hover:text-blue-800"
                          >
                            Download error report
                          </button>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button onClick={handleClose}>Close</Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 pt-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-muted-foreground">No import history found</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-80 w-full rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Batch</th>
                      <th className="px-3 py-2 text-left font-medium">File</th>
                      <th className="px-3 py-2 text-center font-medium">Total</th>
                      <th className="px-3 py-2 text-center font-medium">Valid</th>
                      <th className="px-3 py-2 text-center font-medium">Invalid</th>
                      <th className="px-3 py-2 text-center font-medium">Imported</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2 text-left font-medium">By</th>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.batchId} className="border-b hover:bg-muted/25">
                        <td className="px-3 py-2 font-mono text-xs">{item.batchId}</td>
                        <td className="px-3 py-2">{item.originalFilename || item.filename || "-"}</td>
                        <td className="px-3 py-2 text-center">{item.totalRows}</td>
                        <td className="px-3 py-2 text-center text-green-600">{item.validRows}</td>
                        <td className="px-3 py-2 text-center text-red-600">{item.invalidRows}</td>
                        <td className="px-3 py-2 text-center">{item.importedCount}</td>
                        <td className="px-3 py-2">{getStatusBadge(item.status)}</td>
                        <td className="px-3 py-2">{item.createdBy || "-"}</td>
                        <td className="px-3 py-2 text-xs">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
