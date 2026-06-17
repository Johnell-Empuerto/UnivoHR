import api from "./api";

export interface NotificationRule {
  id: number;
  rule_key: string;
  module: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
  threshold_count: number | null;
  threshold_days: number | null;
  threshold_hours: number | null;
  threshold_percent: number | null;
  frequency: string;
  target_roles: string[] | null;
  template_key: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RulesResponse {
  data: NotificationRule[];
  count: number;
}

export interface UpdateRuleResponse {
  message: string;
  data: NotificationRule;
}

export interface ToggleResponse {
  message: string;
  data: NotificationRule;
}

export const getAllRules = async (): Promise<RulesResponse> => {
  const response = await api.get("/notification-rules");
  return response.data;
};

export const getRuleByKey = async (
  ruleKey: string,
): Promise<NotificationRule> => {
  const response = await api.get(`/notification-rules/${ruleKey}`);
  return response.data;
};

export const getRulesByModule = async (
  module: string,
): Promise<RulesResponse> => {
  const response = await api.get(`/notification-rules/module/${module}`);
  return response.data;
};

export const updateRule = async (
  ruleKey: string,
  payload: Partial<NotificationRule>,
): Promise<UpdateRuleResponse> => {
  const response = await api.put(`/notification-rules/${ruleKey}`, payload);
  return response.data;
};

export const toggleRule = async (
  ruleKey: string,
  field: "is_enabled" | "in_app_enabled" | "email_enabled",
): Promise<ToggleResponse> => {
  const response = await api.patch(
    `/notification-rules/${ruleKey}/toggle?field=${field}`,
  );
  return response.data;
};
