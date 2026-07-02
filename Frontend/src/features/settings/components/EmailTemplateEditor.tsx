"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import {
  Save,
  Eye,
  RefreshCw,
  Edit,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import {
  updateTemplate,
  toggleTemplate,
  type EmailTemplate,
} from "@/services/emailTemplateService";
import { useEmailTemplates } from "../hooks/useEmailTemplates";

// Available template types
const TEMPLATE_TYPES = [
  { value: "OVERTIME_APPROVED", label: "Overtime Approved" },
  { value: "OVERTIME_REJECTED", label: "Overtime Rejected" },
  { value: "LEAVE_APPROVED", label: "Leave Approved" },
  { value: "LEAVE_REJECTED", label: "Leave Rejected" },
  { value: "MAN_HOUR_APPROVED", label: "Man Hour Approved" },
  { value: "MAN_HOUR_REJECTED", label: "Man Hour Rejected" },
  { value: "PAYROLL_MARKED_PAID", label: "Payroll Released" },
  { value: "LATE_NOTICE", label: "Late Notice" },
  { value: "ABSENT_WITHOUT_LEAVE", label: "Absent Without Leave" },
];

// Available variables for each template type - ADDED PAYROLL VARIABLES
const TEMPLATE_VARIABLES: Record<string, string[]> = {
  OVERTIME_APPROVED: ["employee_name", "date", "hours", "reason"],
  OVERTIME_REJECTED: [
    "employee_name",
    "date",
    "hours",
    "reason",
    "rejection_reason",
  ],
  LEAVE_APPROVED: [
    "employee_name",
    "leave_type",
    "from_date",
    "to_date",
    "reason",
  ],
  LEAVE_REJECTED: [
    "employee_name",
    "leave_type",
    "from_date",
    "to_date",
    "reason",
    "rejection_reason",
  ],
  MAN_HOUR_APPROVED: ["employee_name", "work_date", "hours", "task"],
  MAN_HOUR_REJECTED: [
    "employee_name",
    "work_date",
    "hours",
    "task",
    "rejection_reason",
  ],
  PAYROLL_MARKED_PAID: [
    "employee_name",
    "company_name",
    "cutoff_start",
    "cutoff_end",
    "net_salary",
  ],
  LATE_NOTICE: [
    "employee_name",
    "late_count",
    "threshold",
    "date_range",
    "company_name",
  ],
  ABSENT_WITHOUT_LEAVE: ["employee_name", "absence_date", "company_name"],
};

// Toolbar button component
const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded transition-colors ${
      isActive
        ? "bg-primary/20 text-primary"
        : "hover:bg-muted text-muted-foreground hover:text-foreground"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

const EmailTemplateEditor = () => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("OVERTIME_APPROVED");
  const [subject, setSubject] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Placeholder.configure({
        placeholder:
          "Write your email content here... Use the variable buttons above to insert dynamic content",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
    immediatelyRender: false,
  });

  const { data: templates = [], isLoading } = useEmailTemplates();

  // Populate editor when templates load or selection changes
  useEffect(() => {
    const template = templates.find((t) => t.type === selectedType);
    if (template && editor) {
      setSubject(template.subject);
      setIsActive(template.is_active);
      editor.commands.setContent(template.body_html);
    } else if (editor) {
      editor.commands.setContent("");
    }
  }, [selectedType, templates, editor]);

  const insertVariable = (variable: string) => {
    if (!editor) return;
    editor.commands.insertContent(`{{${variable}}}`);
  };

  const handleSave = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!editor || !editor.getHTML().trim()) {
      toast.error("Email body is required");
      return;
    }

    try {
      setSaving(true);
      const existing = templates.find((t) => t.type === selectedType);
      const bodyHtml = editor.getHTML();

      if (existing) {
        await updateTemplate(existing.id, {
          subject,
          body_html: bodyHtml,
          is_active: isActive,
        });
        toast.success("Template updated successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (newValue: boolean) => {
    const existing = templates.find((t) => t.type === selectedType);
    if (!existing) {
      toast.warning("Save the template first before toggling");
      return;
    }

    setIsActive(newValue);

    try {
      await toggleTemplate(existing.id, newValue);
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success(`Template ${newValue ? "activated" : "deactivated"}`);
    } catch {
      setIsActive(!newValue);
      toast.error("Failed to update template status");
    }
  };

  const getTemplateStatus = (type: string) => {
    const template = templates.find((t) => t.type === type);
    if (!template) return "not_created";
    return template.is_active ? "active" : "inactive";
  };

  const getStatusBadge = (status: string) => {
    if (status === "active")
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    if (status === "inactive")
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">Not Created</Badge>;
  };

  // Toolbar actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () =>
    editor?.chain().focus().toggleBlockquote().run();
  const setTextAlign = (align: "left" | "center" | "right") => {
    editor?.chain().focus().setTextAlign(align).run();
  };
  const setHeading = (level: 1 | 2) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };
  const undo = () => editor?.chain().focus().undo().run();
  const redo = () => editor?.chain().focus().redo().run();

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  const variables = TEMPLATE_VARIABLES[selectedType] || ["employee_name"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Edit className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            Email Template Editor
          </h1>
          <p className="text-sm text-muted-foreground">
            Customize email content for system notifications (layout and
            branding are fixed)
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={selectedType}
        onValueChange={setSelectedType}
        className="gap-0"
      >
        <TabsList
          className="flex flex-wrap w-full! gap-2 bg-transparent p-0! h-auto! rounded-none shadow-none border-none"
          style={{ height: "auto !important" }}
        >
          {TEMPLATE_TYPES.map((type) => {
            const status = getTemplateStatus(type.value);
            return (
              <TabsTrigger
                key={type.value}
                className="rounded-full px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm bg-muted hover:bg-muted/80 text-muted-foreground border-0 transition-all"
                style={{ height: "auto", flex: "none" }}
                value={type.value}
              >
                {type.label}
                <span className="ml-2">{getStatusBadge(status)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div style={{ marginTop: "24px" }}>
          <TabsContent value={selectedType} className="mt-0">
            {/* Variables Section */}
            <div className="p-3 bg-muted/30 rounded-lg mb-4">
              <p className="text-sm font-medium mb-2">
                Available Variables (click to insert):
              </p>
              <div className="flex flex-wrap gap-2">
                {variables.map((variable) => (
                  <Button
                    key={variable}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="font-mono text-xs"
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="mt-1"
              />
            </div>

            {/* Email Body Editor / Preview Toggle */}
            <div className="flex items-center justify-between mb-2">
              <Label>Email Content</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? (
                  <Edit className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {previewMode ? "Edit Mode" : "Preview Mode"}
              </Button>
            </div>

            {previewMode ? (
              <div className="border rounded-lg p-4 min-h-87.5 bg-white overflow-auto mb-4">
                <div
                  dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
                />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden mb-4">
                {/* TipTap Toolbar */}
                <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/30">
                  <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                    <ToolbarButton onClick={undo} title="Undo">
                      <Undo className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={redo} title="Redo">
                      <Redo className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                    <ToolbarButton
                      onClick={toggleBold}
                      isActive={editor?.isActive("bold")}
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={toggleItalic}
                      isActive={editor?.isActive("italic")}
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={toggleUnderline}
                      isActive={editor?.isActive("underline")}
                      title="Underline"
                    >
                      <Underline className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={toggleStrike}
                      isActive={editor?.isActive("strike")}
                      title="Strikethrough"
                    >
                      <Strikethrough className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                    <ToolbarButton
                      onClick={() => setHeading(1)}
                      isActive={editor?.isActive("heading", { level: 1 })}
                      title="Heading 1"
                    >
                      <Heading1 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => setHeading(2)}
                      isActive={editor?.isActive("heading", { level: 2 })}
                      title="Heading 2"
                    >
                      <Heading2 className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                    <ToolbarButton
                      onClick={() => setTextAlign("left")}
                      title="Align Left"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => setTextAlign("center")}
                      title="Align Center"
                    >
                      <AlignCenter className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => setTextAlign("right")}
                      title="Align Right"
                    >
                      <AlignRight className="h-4 w-4" />
                    </ToolbarButton>
                  </div>

                  <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                    <ToolbarButton
                      onClick={toggleBulletList}
                      isActive={editor?.isActive("bulletList")}
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={toggleOrderedList}
                      isActive={editor?.isActive("orderedList")}
                      title="Numbered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={toggleBlockquote}
                      isActive={editor?.isActive("blockquote")}
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" />
                    </ToolbarButton>
                  </div>
                </div>

                {/* TipTap Editor Content */}
                <EditorContent editor={editor} className="min-h-87.5" />
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-4 mb-4">
              <div>
                <p className="font-medium">Active Template</p>
                <p className="text-sm text-muted-foreground">
                  When active, this template will be used for notifications
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={handleToggle} />
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm mt-4">
              <p className="font-medium mb-1">💡 Note:</p>
              <p className="text-muted-foreground">
                The email layout (header, footer, colors) is fixed and cannot be
                edited here. Only the content area is customizable. This ensures
                consistent branding across all emails.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default EmailTemplateEditor;
