import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHrAssignmentById, submitHrForm } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

const MyFormFillPage = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!assignmentId) return;
    const load = async () => {
      try {
        const a = await getHrAssignmentById(Number(assignmentId));
        setTitle(a.form_title);
        setDescription(a.form_description || "");
        setSubmitted(a.status !== "Pending");
        if (a.answers && a.answers.length > 0) {
          const map: Record<number, string> = {};
          a.answers.forEach((ans: any) => { map[ans.field_id] = ans.answer || ""; });
          setAnswers(map);
        }
        setFields(Array.isArray(a.fields) ? a.fields : []);
        setLoading(false);
      } catch {
        toast.error("Failed to load form");
        navigate("/my-forms");
      }
    };
    load();
  }, [assignmentId]);

  const setAnswer = (fieldId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    if (!assignmentId) return;
    const missing = fields.filter((f) => f.required && !answers[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`Please answer required questions: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    try {
      setSaving(true);
      await submitHrForm(Number(assignmentId), {
        answers: fields.map((f) => ({ field_id: f.id, answer: answers[f.id] || "" })),
      });
      toast.success("Form submitted successfully");
      setSubmitted(true);
    } catch (err: any) { toast.error(err.message || "Submit failed"); }
    finally { setSaving(false); }
  };

  const renderField = (field: any) => {
    const val = answers[field.id] || "";
    const common = "w-full border rounded px-2 py-1.5 bg-background text-sm";

    switch (field.field_type) {
      case "textarea":
        return <textarea value={val} onChange={(e) => setAnswer(field.id, e.target.value)}
          className={`${common} min-h-[80px]`} disabled={submitted} />;
      case "number":
        return <input type="number" value={val} onChange={(e) => setAnswer(field.id, e.target.value)}
          className={common} disabled={submitted} />;
      case "date":
        return <input type="date" value={val} onChange={(e) => setAnswer(field.id, e.target.value)}
          className={common} disabled={submitted} />;
      case "dropdown":
        return (
          <select value={val} onChange={(e) => setAnswer(field.id, e.target.value)}
            className={common} disabled={submitted}>
            <option value="">Select...</option>
            {(field.options || "").split(",").map((o: string) => (
              <option key={o} value={o.trim()}>{o.trim()}</option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-1">
            {(field.options || "").split(",").map((o: string) => (
              <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name={`field_${field.id}`} value={o.trim()} checked={val === o.trim()}
                  onChange={(e) => setAnswer(field.id, e.target.value)} disabled={submitted} />
                {o.trim()}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-1">
            {(field.options || "").split(",").map((o: string) => {
              const selected = val.split(",").map((v) => v.trim());
              const checked = selected.includes(o.trim());
              return (
                <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={checked} disabled={submitted}
                    onChange={() => {
                      const newSelected = checked
                        ? selected.filter((v) => v !== o.trim())
                        : [...selected, o.trim()];
                      setAnswer(field.id, newSelected.join(", "));
                    }} />
                  {o.trim()}
                </label>
              );
            })}
          </div>
        );
      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" disabled={submitted}
                onClick={() => setAnswer(field.id, String(n))}
                className={`text-2xl p-1 transition-colors ${Number(val) >= n ? "text-amber-400" : "text-muted-foreground hover:text-amber-300"} ${submitted ? "cursor-default" : "cursor-pointer"}`}>
                ★
              </button>
            ))}
          </div>
        );
      default:
        return <input type="text" value={val} onChange={(e) => setAnswer(field.id, e.target.value)}
          className={common} disabled={submitted} />;
    }
  };

  if (loading) {
    return <Loader message="Loading form..." fullPage />;
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/my-forms")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-muted-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {!submitted && (
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            <Send className="h-4 w-4 mr-1" /> Submit
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Questions</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {fields.length === 0 ? (
            <EmptyState message="No questions in this form" />
          ) : (
            fields.map((field, idx) => (
              <div key={field.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  {field.required && <span className="text-xs text-red-500">*</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{idx + 1}/{fields.length}</span>
                </div>
                {renderField(field)}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {submitted && (
        <div className="text-sm text-muted-foreground text-center py-4">
          Your form has been submitted. You can no longer edit the answers.
        </div>
      )}
    </div>
  );
};

export default MyFormFillPage;
