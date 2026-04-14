import api from "./api";

export interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  body_html: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  type: string;
  subject: string;
  body_html: string;
}

// Get all templates
export const getAllTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await api.get("/email-templates");
  return response.data;
};

// Get template by type
export const getTemplateByType = async (
  type: string,
): Promise<EmailTemplate> => {
  const response = await api.get(`/email-templates/${type}`);
  return response.data;
};

// Create or update template
export const upsertTemplate = async (
  data: CreateTemplateData,
): Promise<EmailTemplate> => {
  const response = await api.post("/email-templates", data);
  return response.data;
};

// Update template
export const updateTemplate = async (
  id: number,
  data: Partial<EmailTemplate>,
): Promise<EmailTemplate> => {
  const response = await api.put(`/email-templates/${id}`, data);
  return response.data;
};

// Toggle template active status
export const toggleTemplate = async (
  id: number,
  is_active: boolean,
): Promise<EmailTemplate> => {
  const response = await api.patch(`/email-templates/${id}/toggle`, {
    is_active,
  });
  return response.data;
};

// Delete template
export const deleteTemplate = async (id: number): Promise<void> => {
  await api.delete(`/email-templates/${id}`);
};
