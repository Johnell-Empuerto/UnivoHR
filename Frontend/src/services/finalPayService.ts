import api from "./api";

// Types
export interface FinalPayEmployee {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  employee_code: string;
  status: "ACTIVE" | "RESIGNED" | "TERMINATED";
  resignation_date?: string;
  termination_date?: string;
  final_pay_processed: boolean;
  final_pay_date?: string;
  final_pay_amount?: number;
  basic_salary?: number;
  daily_rate?: number;
  working_days_per_month?: number;
  vacation_leave?: number;
  used_vacation_leave?: number;
  sick_leave?: number;
  used_sick_leave?: number;
}

export interface FinalPayCalculation {
  success: boolean;
  data?: {
    employee_id: number;
    employee_name: string;
    status: string;
    resignation_date?: string;
    termination_date?: string;
    last_working_date: string;
    days_worked: number;
    daily_rate: number;
    salary_until_last_day: number;
    unused_vacation_leave: number;
    leave_conversion_amount: number;
    total_final_pay: number;
  };
  message?: string;
}

export interface FinalPayRecord {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  status: string;
  resignation_date?: string;
  termination_date?: string;
  last_working_date: string;
  days_worked: number;
  salary_until_last_day: number;
  leave_conversion_amount: number;
  total_amount: number;
  processed_by_name?: string;
  processed_at: string;
}

export interface FinalPayHistoryResponse {
  data: FinalPayRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// 1. GET EMPLOYEES ELIGIBLE FOR FINAL PAY
// ============================================
/**
 * Get all resigned and terminated employees who haven't had final pay processed yet
 */
// ============================================
// 1. GET EMPLOYEES ELIGIBLE FOR FINAL PAY (WITH PAGINATION)
// ============================================
/**
 * Get all resigned and terminated employees who haven't had final pay processed yet
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search by employee name or code
 */
export const getEmployeesForFinalPay = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<{
  success: boolean;
  data: FinalPayEmployee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}> => {
  try {
    const response = await api.get("/final-pay/employees", {
      params: { page, limit, search },
    });
    return response.data;
  } catch (error: any) {
    console.error("Get employees for final pay error:", error);
    throw error.response?.data || { message: "Failed to fetch employees" };
  }
};

// ============================================
// 2. CALCULATE FINAL PAY (PREVIEW)
// ============================================
/**
 * Calculate final pay for a specific employee (preview only, doesn't save)
 * @param employeeId - The employee ID
 */
export const calculateFinalPay = async (
  employeeId: number,
): Promise<FinalPayCalculation> => {
  try {
    const response = await api.get(`/final-pay/calculate/${employeeId}`);
    return response.data;
  } catch (error: any) {
    console.error("Calculate final pay error:", error);
    throw error.response?.data || { message: "Failed to calculate final pay" };
  }
};

// ============================================
// 3. PROCESS FINAL PAY
// ============================================
/**
 * Process final pay for a specific employee (saves to database)
 * @param employeeId - The employee ID
 */
export const processFinalPay = async (
  employeeId: number,
): Promise<{
  success: boolean;
  message: string;
  data?: FinalPayRecord;
}> => {
  try {
    const response = await api.post(`/final-pay/process/${employeeId}`);
    return response.data;
  } catch (error: any) {
    console.error("Process final pay error:", error);
    throw error.response?.data || { message: "Failed to process final pay" };
  }
};

// ============================================
// 4. GET FINAL PAY HISTORY
// ============================================
/**
 * Get paginated history of processed final pay records
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search by employee name or code
 */
export const getFinalPayHistory = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
): Promise<FinalPayHistoryResponse> => {
  try {
    const response = await api.get("/final-pay/history", {
      params: { page, limit, search },
    });
    return response.data;
  } catch (error: any) {
    console.error("Get final pay history error:", error);
    throw error.response?.data || { message: "Failed to fetch history" };
  }
};

// ============================================
// 5. GET FINAL PAY BY ID
// ============================================
/**
 * Get a specific final pay record by ID
 * @param id - Final pay record ID
 */
export const getFinalPayById = async (id: number): Promise<FinalPayRecord> => {
  try {
    const response = await api.get(`/final-pay/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Get final pay by ID error:", error);
    throw (
      error.response?.data || { message: "Failed to fetch final pay record" }
    );
  }
};

// ============================================
// 6. DOWNLOAD FINAL PAY SLIP
// ============================================
/**
 * Download final pay slip as PDF
 * @param id - Final pay record ID
 */
export const downloadFinalPaySlip = async (id: number): Promise<Blob> => {
  try {
    const response = await api.get(`/final-pay/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    console.error("Download final pay slip error:", error);
    throw error;
  }
};

// ============================================
// 7. GET EMPLOYEE FINAL PAY SUMMARY
// ============================================
/**
 * Get final pay summary for a specific employee
 * @param employeeId - The employee ID
 */
export const getEmployeeFinalPaySummary = async (
  employeeId: number,
): Promise<{
  success: boolean;
  data?: {
    employee_id: number;
    employee_name: string;
    total_final_pay: number;
    final_pay_date?: string;
    records: FinalPayRecord[];
  };
  message?: string;
}> => {
  try {
    const response = await api.get(`/final-pay/employee/${employeeId}`);
    return response.data;
  } catch (error: any) {
    console.error("Get employee final pay summary error:", error);
    throw error.response?.data || { message: "Failed to fetch summary" };
  }
};

// ============================================
// 8. BULK PROCESS FINAL PAY
// ============================================
/**
 * Process final pay for multiple employees at once
 * @param employeeIds - Array of employee IDs
 */
export const bulkProcessFinalPay = async (
  employeeIds: number[],
): Promise<{
  success: boolean;
  message: string;
  data: {
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      employee_id: number;
      success: boolean;
      message: string;
      amount?: number;
    }>;
  };
}> => {
  try {
    const response = await api.post("/final-pay/bulk-process", { employeeIds });
    return response.data;
  } catch (error: any) {
    console.error("Bulk process final pay error:", error);
    throw (
      error.response?.data || { message: "Failed to process bulk final pay" }
    );
  }
};

// ============================================
// 9. GET FINAL PAY STATISTICS
// ============================================
/**
 * Get statistics about final pay processing
 */
export const getFinalPayStatistics = async (): Promise<{
  success: boolean;
  data?: {
    total_processed: number;
    total_amount: number;
    this_month_processed: number;
    this_month_amount: number;
    pending_count: number;
    by_status: {
      resigned: number;
      terminated: number;
    };
  };
  message?: string;
}> => {
  try {
    const response = await api.get("/final-pay/statistics");
    return response.data;
  } catch (error: any) {
    console.error("Get final pay statistics error:", error);
    throw error.response?.data || { message: "Failed to fetch statistics" };
  }
};

// ============================================
// 10. VOID FINAL PAY (ADMIN ONLY)
// ============================================
/**
 * Void a processed final pay record (admin only)
 * @param id - Final pay record ID
 * @param reason - Reason for voiding
 */
export const voidFinalPay = async (
  id: number,
  reason: string,
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await api.post(`/final-pay/${id}/void`, { reason });
    return response.data;
  } catch (error: any) {
    console.error("Void final pay error:", error);
    throw error.response?.data || { message: "Failed to void final pay" };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

/**
 * Format date for display
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Get status badge color
 */
export const getFinalPayStatusColor = (status: string): string => {
  switch (status) {
    case "RESIGNED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "TERMINATED":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  }
};

/**
 * Get status icon
 */
export const getFinalPayStatusIcon = (status: string): string => {
  switch (status) {
    case "RESIGNED":
      return "🔴";
    case "TERMINATED":
      return "⚫";
    default:
      return "🟢";
  }
};
