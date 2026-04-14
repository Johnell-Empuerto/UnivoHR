"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Send,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getAllSmtpSettings,
  createSmtpSettings,
  updateSmtpSettings,
  deleteSmtpSettings,
  testSmtpConnection,
  type SmtpSettings,
  type CreateSmtpData,
} from "@/services/stmpService";

const SMTPSettings = () => {
  const [settings, setSettings] = useState<SmtpSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SmtpSettings | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CreateSmtpData>({
    host: "",
    port: 587,
    encryption: "tls",
    username: "",
    password: "",
    from_email: "",
    from_name: "",
    is_active: false,
  });

  // Fetch all SMTP settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getAllSmtpSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch SMTP settings:", error);
      toast.error("Failed to load SMTP settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  // Handle encryption change
  const handleEncryptionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      encryption: value as "tls" | "ssl" | "none",
    }));
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      host: "",
      port: 587,
      encryption: "tls",
      username: "",
      password: "",
      from_email: "",
      from_name: "",
      is_active: false,
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (item: SmtpSettings) => {
    setEditingItem(item);
    setFormData({
      host: item.host,
      port: item.port,
      encryption: item.encryption,
      username: item.username,
      password: "", // Don't load password for security
      from_email: item.from_email,
      from_name: item.from_name || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  // Save settings (create or update)
  const handleSave = async () => {
    // Validate required fields
    if (!formData.host) {
      toast.error("Host is required");
      return;
    }
    if (!formData.port) {
      toast.error("Port is required");
      return;
    }
    if (!formData.username) {
      toast.error("Username is required");
      return;
    }
    if (!editingItem && !formData.password) {
      toast.error("Password is required");
      return;
    }
    if (!formData.from_email) {
      toast.error("From email is required");
      return;
    }

    try {
      if (editingItem) {
        // Update existing
        const updateData: any = {
          host: formData.host,
          port: formData.port,
          encryption: formData.encryption,
          username: formData.username,
          from_email: formData.from_email,
          from_name: formData.from_name,
          is_active: formData.is_active,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateSmtpSettings(editingItem.id, updateData);
        toast.success("SMTP settings updated successfully");
      } else {
        // Create new
        await createSmtpSettings(formData);
        toast.success("SMTP settings created successfully");
      }
      setDialogOpen(false);
      fetchSettings();
    } catch (error: any) {
      console.error("Failed to save SMTP settings:", error);
      toast.error(
        error.response?.data?.message || "Failed to save SMTP settings",
      );
    }
  };

  // Delete settings
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete these SMTP settings?"))
      return;

    try {
      await deleteSmtpSettings(id);
      toast.success("SMTP settings deleted successfully");
      fetchSettings();
    } catch (error) {
      console.error("Failed to delete SMTP settings:", error);
      toast.error("Failed to delete SMTP settings");
    }
  };

  // Open test dialog
  const handleTestOpen = (id: number) => {
    setTestingId(id);
    setTestEmail("");
    setTestDialogOpen(true);
  };

  // Send test email
  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    if (!testEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSendingTest(true);
      await testSmtpConnection(testingId!, testEmail);
      toast.success("Test email sent successfully! Check your inbox.");
      setTestDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to send test email:", error);
      toast.error(error.response?.data?.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure email server settings for system notifications
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : settings.length === 0 ? (
          <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/20">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No SMTP Configuration
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first SMTP configuration to enable email notifications
              </p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${
                  item.is_active
                    ? "border-green-500 bg-green-50/10"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {item.host}:{item.port}
                      </h3>
                      {item.is_active && (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      )}
                      {item.test_email_sent && (
                        <Badge variant="outline" className="text-blue-600">
                          Tested ✓
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Username:</span>{" "}
                        {item.username}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          From Email:
                        </span>{" "}
                        {item.from_email}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          From Name:
                        </span>{" "}
                        {item.from_name || "-"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Encryption:
                        </span>{" "}
                        {item.encryption.toUpperCase()}
                      </div>
                      {item.last_test_sent_at && (
                        <div>
                          <span className="text-muted-foreground">
                            Last Test:
                          </span>{" "}
                          {new Date(item.last_test_sent_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestOpen(item.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? "Edit SMTP Configuration"
                : "Add SMTP Configuration"}
            </DialogTitle>
            <DialogDescription>
              Configure your email server settings for sending notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host">SMTP Host *</Label>
                <Input
                  id="host"
                  name="host"
                  placeholder="smtp.gmail.com"
                  value={formData.host}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  placeholder="587"
                  value={formData.port}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="encryption">Encryption *</Label>
              <Select
                value={formData.encryption}
                onValueChange={handleEncryptionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select encryption" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS (Recommended)</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                placeholder="your-email@gmail.com"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {editingItem && (
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to keep existing password
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="from_email">From Email *</Label>
              <Input
                id="from_email"
                name="from_email"
                placeholder="noreply@yourcompany.com"
                value={formData.from_email}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                name="from_name"
                placeholder="HRMS System"
                value={formData.from_name}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active Configuration</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify your SMTP configuration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="test_email">Test Email Address *</Label>
              <Input
                id="test_email"
                type="email"
                placeholder="admin@yourcompany.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A test email will be sent to this address to verify SMTP
                settings
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={sendingTest}>
              {sendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SMTPSettings;
