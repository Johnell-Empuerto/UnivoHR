import api from "./api";

export interface PayrollRule {
  rule_key: string;
  rule_value: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchPayrollRules = async (): Promise<PayrollRule[]> => {
  const { data } = await api.get("/payroll-rules");
  return data;
};

export const updatePayrollRule = async (
  ruleKey: string,
  ruleValue: number
): Promise<PayrollRule> => {
  const { data } = await api.put(`/payroll-rules/${ruleKey}`, {
    rule_value: ruleValue,
  });
  return data;
};
