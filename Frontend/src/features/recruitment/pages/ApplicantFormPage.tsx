import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createApplicant } from "@/services/applicantService";
import { getActiveJobPositions } from "@/services/jobPositionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface JobPosition {
  id: number;
  title: string;
  workflow_id: number | null;
  workflow_name: string | null;
}

const ApplicantFormPage = () => {
  const navigate = useNavigate();
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!form.first_name.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!form.last_name.trim()) {
      toast.error("Last name is required");
      return;
    }
    if (!form.job_position_id) {
      toast.error("Please select a job position");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
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
        job_position_id: Number(form.job_position_id),
      };
      await createApplicant(data);
      toast.success("Applicant created");
      navigate("/recruitment/applicants");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Failed to create applicant",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 w-full!">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/recruitment/applicants")}
          className="p-1 rounded hover:bg-muted transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Add Applicant
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new applicant record
          </p>
        </div>
      </div>

      <Card className="w-full!">
        <CardHeader>
          <CardTitle>Applicant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>
              Job Position <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.job_position_id}
              onValueChange={(v) => handleSelectChange("job_position_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {jobPositions.map((jp) => (
                  <SelectItem key={jp.id} value={String(jp.id)}>
                    {jp.title}
                    {jp.workflow_name ? ` (${jp.workflow_name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.job_position_id &&
              (() => {
                const jp = jobPositions.find(
                  (j) => j.id === Number(form.job_position_id),
                );
                if (!jp) return null;
                if (jp.workflow_name) {
                  return (
                    <p className="text-xs text-green-600 mt-1">
                      Workflow: {jp.workflow_name}
                    </p>
                  );
                }
                return (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> This job position has
                    no workflow assigned. A default workflow will be used if
                    available.
                  </p>
                );
              })()}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>Middle Name</Label>
              <Input
                name="middle_name"
                value={form.middle_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Suffix</Label>
            <Input
              name="suffix"
              value={form.suffix}
              onChange={handleChange}
              placeholder="Jr., III, etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="applicant@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Textarea
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1">
            <Label>Source</Label>
            <Input
              name="source"
              value={form.source}
              onChange={handleChange}
              placeholder="e.g., LinkedIn, JobFair, Referral"
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea name="notes" value={form.notes} onChange={handleChange} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => navigate("/recruitment/applicants")}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
          Applicant
        </Button>
      </div>
    </div>
  );
};

export default ApplicantFormPage;
