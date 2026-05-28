import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createApplicant } from "@/services/applicantService";
import { getActiveJobPositions } from "@/services/jobPositionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ApplicantFormPage = () => {
  const navigate = useNavigate();
  const [jobPositions, setJobPositions] = useState<{ id: number; title: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    job_position_id: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    email: "",
    phone: "",
    address: "",
    source: "",
    notes: "",
  });

  useEffect(() => {
    getActiveJobPositions()
      .then(setJobPositions)
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.first_name.trim()) { toast.error("First name is required"); return; }
    if (!form.last_name.trim()) { toast.error("Last name is required"); return; }
    try {
      setSaving(true);
      const data: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name || undefined,
        suffix: form.suffix || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        source: form.source || undefined,
        notes: form.notes || undefined,
      };
      if (form.job_position_id) data.job_position_id = Number(form.job_position_id);
      await createApplicant(data);
      toast.success("Applicant created");
      navigate("/recruitment/applicants");
    } catch (err: any) {
      toast.error(err.message || "Failed to create applicant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/recruitment/applicants")} className="p-1 rounded hover:bg-muted transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">Add Applicant</h1>
          <p className="text-sm text-muted-foreground">Create a new applicant record</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Applicant Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Job Position</p>
            <select name="job_position_id" value={form.job_position_id} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background">
              <option value="">Select position (optional)</option>
              {jobPositions.map((jp) => (
                <option key={jp.id} value={jp.id}>{jp.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">First Name <span className="text-red-500">*</span></p>
              <input name="first_name" value={form.first_name} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Middle Name</p>
              <input name="middle_name" value={form.middle_name} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Name <span className="text-red-500">*</span></p>
              <input name="last_name" value={form.last_name} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Suffix</p>
            <input name="suffix" value={form.suffix} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" placeholder="Jr., III, etc." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <input name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" type="email" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Address</p>
            <textarea name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background min-h-[60px]" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Source</p>
            <input name="source" value={form.source} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background" placeholder="e.g., LinkedIn, JobFair, Referral" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-2 py-1 bg-background min-h-[80px]" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/recruitment/applicants")}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Applicant
        </Button>
      </div>
    </div>
  );
};

export default ApplicantFormPage;
