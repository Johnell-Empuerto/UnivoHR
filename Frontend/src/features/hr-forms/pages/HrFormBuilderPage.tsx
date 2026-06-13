import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHrFormById, getHrFormFields, addHrFormField, updateHrFormField, deleteHrFormField } from "@/services/hrFormService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Radio Options" },
  { value: "checkbox", label: "Checkbox Options" },
  { value: "rating", label: "Rating 1-5" },
];

const emptyField = { label: "", field_type: "text", required: false, options: "" };

const HrFormBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [fieldDialog, setFieldDialog] = useState(false);
  const [editFieldId, setEditFieldId] = useState<number | null>(null);
  const [fieldForm, setFieldForm] = useState({ ...emptyField });

  const [deleteFieldId, setDeleteFieldId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const form = await getHrFormById(Number(id));
        setTitle(form.title);
        const f = await getHrFormFields(Number(id));
        setFields(Array.isArray(f) ? f : []);
        setLoading(false);
      } catch {
        toast.error("Failed to load form");
        navigate("/hr-forms");
      }
    };
    load();
  }, [id]);

  const handleOpenAdd = () => {
    setEditFieldId(null);
    setFieldForm({ ...emptyField });
    setFieldDialog(true);
  };

  const handleOpenEdit = (f: any) => {
    setEditFieldId(f.id);
    setFieldForm({ label: f.label, field_type: f.field_type, required: f.required, options: f.options || "" });
    setFieldDialog(true);
  };

  const handleSaveField = async () => {
    if (!fieldForm.label.trim()) { toast.error("Question label is required"); return; }
    if (["dropdown", "radio", "checkbox"].includes(fieldForm.field_type) && !fieldForm.options.trim()) {
      toast.error("Please add options for this field type"); return;
    }
    try {
      setSaving(true);
      if (editFieldId) {
        await updateHrFormField(editFieldId, { ...fieldForm, field_order: fields.findIndex((f: any) => f.id === editFieldId) });
        toast.success("Question updated");
      } else {
        await addHrFormField(Number(id), { ...fieldForm, field_order: fields.length });
        toast.success("Question added");
      }
      setFieldDialog(false);
      const f = await getHrFormFields(Number(id));
      setFields(Array.isArray(f) ? f : []);
    } catch (err: any) { toast.error(err.message || "Operation failed"); }
    finally { setSaving(false); }
  };

  const handleDeleteField = async (fieldId: number) => {
    try {
      setSaving(true);
      await deleteHrFormField(fieldId);
      toast.success("Question deleted");
      setDeleteFieldId(null);
      const f = await getHrFormFields(Number(id));
      setFields(Array.isArray(f) ? f : []);
    } catch (err: any) { toast.error(err.message || "Delete failed"); setDeleteFieldId(null); }
    finally { setSaving(false); }
  };

  const typeIcon = (t: string) => {
    const map: Record<string, string> = {
      text: "Abc", textarea: "¶", number: "#", date: "📅", dropdown: "▼", radio: "◉", checkbox: "☑", rating: "★",
    };
    return map[t] || "?";
  };

  if (loading) {
    return <Loader message="Loading form builder..." fullPage />;
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/hr-forms")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">Add questions to your form</p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleOpenAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <EmptyState message="No questions yet" description='Click "Add Question" to start building your form.' action={{ label: "Add Question", onClick: handleOpenAdd }} />
      ) : (
        <div className="space-y-3">
          {fields.map((f, idx) => (
            <Card key={f.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground"><GripVertical className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {typeIcon(f.field_type)} {FIELD_TYPES.find(t => t.value === f.field_type)?.label || f.field_type}
                      </span>
                      {f.required && <span className="text-xs text-red-500">Required</span>}
                      <span className="text-xs text-muted-foreground ml-auto">Q{idx + 1}</span>
                    </div>
                    <p className="font-medium">{f.label}</p>
                    {(f.field_type === "dropdown" || f.field_type === "radio" || f.field_type === "checkbox") && f.options && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {f.options.split(",").map((o: string, i: number) => (
                          <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{o.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => handleOpenEdit(f)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => setDeleteFieldId(f.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={fieldDialog} onOpenChange={setFieldDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editFieldId ? "Edit Question" : "Add Question"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Question Label <span className="text-red-500">*</span></p>
              <Input value={fieldForm.label} onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                placeholder="e.g., How satisfied are you?" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Field Type</p>
              <Select value={fieldForm.field_type} onValueChange={(v) => setFieldForm({ ...fieldForm, field_type: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(fieldForm.field_type === "dropdown" || fieldForm.field_type === "radio" || fieldForm.field_type === "checkbox") && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Options <span className="text-red-500">*</span></p>
                <Textarea value={fieldForm.options} onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                  placeholder="Enter options separated by commas&#10;e.g., Excellent, Good, Fair, Poor" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="required" checked={fieldForm.required}
                onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })} />
              <label htmlFor="required" className="text-sm">Required</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveField} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editFieldId ? "Save Changes" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteFieldId !== null} onOpenChange={(o) => { if (!o) setDeleteFieldId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question and any answers submitted for it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteFieldId !== null && handleDeleteField(deleteFieldId)} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HrFormBuilderPage;
