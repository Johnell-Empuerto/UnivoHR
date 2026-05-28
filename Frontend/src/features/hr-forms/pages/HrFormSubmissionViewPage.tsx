import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHrSubmissionById, reviewHrSubmission } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

const AnswerDisplay = ({ field, answer }: { field: any; answer: any }) => {
  const val = answer?.answer || "";
  return (
    <div className="py-3 border-b last:border-b-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium">{field.label}</span>
        {field.required && <span className="text-xs text-red-500">*</span>}
        <span className="text-xs text-muted-foreground ml-auto">{field.field_type}</span>
      </div>
      {field.field_type === "checkbox" ? (
        <div className="flex flex-wrap gap-2 mt-1">
          {(field.options || "").split(",").map((o: string) => {
            const checked = val.split(",").map((v: string) => v.trim()).includes(o.trim());
            return (
              <span key={o} className={`text-sm px-3 py-1 rounded border ${checked ? "bg-primary/10 border-primary text-primary" : "bg-muted text-muted-foreground"}`}>
                {checked ? "☑" : "☐"} {o.trim()}
              </span>
            );
          })}
        </div>
      ) : field.field_type === "rating" ? (
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`text-lg ${Number(val) >= n ? "text-amber-400" : "text-muted-foreground"}`}>★</span>
          ))}
          <span className="text-sm ml-2">{val}</span>
        </div>
      ) : (
        <p className="text-sm bg-muted p-2 rounded mt-1">{val || <span className="italic text-muted-foreground">No answer</span>}</p>
      )}
    </div>
  );
};

const HrFormSubmissionViewPage = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!submissionId) return;
    const load = async () => {
      try {
        const s = await getHrSubmissionById(Number(submissionId));
        setSubmission(s);
        setRemarks(s.remarks || "");
        setLoading(false);
      } catch {
        toast.error("Failed to load submission");
        navigate("/hr-forms/submissions");
      }
    };
    load();
  }, [submissionId]);

  const handleReview = async () => {
    if (!submission) return;
    try {
      setSaving(true);
      await reviewHrSubmission(submission.id, { remarks });
      toast.success("Submission reviewed");
      setSubmission({ ...submission, status: "Reviewed" });
    } catch (err: any) { toast.error(err.message || "Review failed"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <Loader message="Loading submission..." fullPage />;
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/hr-forms/submissions")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">{submission?.form_title}</h1>
            <p className="text-sm text-muted-foreground">
              Submitted by {submission?.employee_name} | Status: {submission?.status && <Badge className={submission.status === "Reviewed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>{submission.status}</Badge>}
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Answers</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {(submission?.fields || []).length === 0 ? (
            <EmptyState message="No fields found" />
          ) : (
            submission.fields.map((field: any) => {
              const answer = (submission.answers || []).find((a: any) => Number(a.field_id) === Number(field.id));
              return <AnswerDisplay key={field.id} field={field} answer={answer} />;
            })
          )}
        </CardContent>
      </Card>

      {submission?.status !== "Reviewed" && (
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Review Remarks</p>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
                className="w-full border rounded px-2 py-1 bg-background min-h-[80px]" placeholder="Add review remarks..." />
            </div>
            <Button onClick={handleReview} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-1" /> Mark as Reviewed
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HrFormSubmissionViewPage;
