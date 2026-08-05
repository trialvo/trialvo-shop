// src/api/reports.api.ts  â€” V2-037 (upgraded counts + eligible admins)
import { api } from "./client";

// â”€â”€â”€ Enums / Literals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //

export type ReportCategory = "product_issue" | "order_issue" | "fraud" | "general" | "other";
export type ReportStatus   = "open" | "in_progress" | "resolved" | "closed";
export type ReportPriority = "low" | "normal" | "high" | "urgent";
export type AssignmentMethod = "auto" | "manual" | "redistribute";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //

export type Report = {
  id: number;
  tracking_token: string;
  user_id: number | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  category: ReportCategory;
  subject: string;
  description: string;
  order_id: number | null;
  status: ReportStatus;
  priority: ReportPriority;
  assigned_to_admin_id: number | null;
  assigned_by_admin_id: number | null;
  assignment_method: AssignmentMethod | null;
  assigned_at: string | null;
  is_read: 0 | 1;
  is_replied: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // joined fields
  assigned_to_admin_name?: string | null;
  assigned_to_admin_img?: string | null;
  assigned_admin_name?: string | null;
  assigned_admin_email?: string | null;
};

export type ReportReply = {
  id: number;
  report_id: number;
  admin_id: number | null;
  reply_text: string;
  reply_via: string;
  created_at: string;
  admin_name?: string | null;
  images?: string[];
};

export type ReportDetail = Report & {
  replies: ReportReply[];
  images?: string[];
  user_name?: string | null;
  user_avatar?: string | null;
  user_email?: string | null;
  total_orders?: number;
  total_spent?: number | null;
};

/** V2-037: Full count breakdown (scope: super_admin = all, others = assigned-to-me) */
export type ReportCounts = {
  total:       number;
  open:        number;
  in_progress: number;
  resolved:    number;
  closed:      number;
  unread:      number;
  unresolved:  number; // open + in_progress
  unreplied:   number;
};

export type GetReportsParams = {
  status?: ReportStatus | "all";
  category?: ReportCategory | "all";
  priority?: ReportPriority | "all";
  is_read?: "all" | "true" | "false";
  is_replied?: "all" | "true" | "false";
  assigned?: "all" | "mine" | "unassigned";
  search?: string;
  offset?: number;
  limit?: number;
};

export type GetReportsResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  data: Report[];
};

// â”€â”€â”€ Distribution Pool â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //

export type ReportDistributionSettings = {
  id: number;
  auto_assign_enabled: boolean;
  assign_on_report_create: boolean;
  include_admin_role: boolean;
  include_order_manager_role: boolean;
  last_assigned_admin_id: number | null;
  updated_by_admin: number | null;
  updated_at: string | null;
};

export type ReportDistributionAgent = {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  profile_img_path?: string | null;
  serial: number;
  max_active_reports: number | null;
  auto_assign_enabled: boolean;
  status: boolean;
  /** Reports admin still has open (not resolved/closed) */
  active_report_count: number;
  /** Reports assigned to queue today */
  today_assigned_count: number;
  /** Reports this admin resolved or closed today */
  today_completed_count: number;
  /** Lifetime total reports ever assigned to this admin */
  total_assigned_count: number;
  created_at: string;
};

/** V2-037: Eligible admin for the report pool UI (mirrors order distribution) */
export type ReportEligibleAdmin = {
  id: number;
  admin_name: string;
  email: string;
  profile_img_path: string | null;
  is_active: boolean;
  role_name: string;
  role_id: number;
  pool_id: number | null;
  serial: number | null;
  max_active_reports: number | null;
  pool_auto_assign: boolean | null;
  pool_status: boolean | null;
  /** Reports admin still has open (not resolved/closed) */
  active_report_count: number;
  /** Reports assigned to queue today */
  today_assigned_count: number;
  /** Reports this admin resolved or closed today */
  today_completed_count: number;
  /** Lifetime total reports ever assigned to this admin */
  total_assigned_count: number;
};

export type ReportAgentPayload = {
  serial?: number;
  max_active_reports?: number | null;
  auto_assign_enabled?: boolean;
  status?: boolean;
};

// â”€â”€â”€ API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //

// Admin: list with filters
export async function adminListReports(params: GetReportsParams): Promise<GetReportsResponse> {
  const cleanParams: Record<string, string | number> = {};
  if (params.status && params.status !== "all")    cleanParams.status    = params.status;
  if (params.category && params.category !== "all") cleanParams.category  = params.category;
  if (params.priority && params.priority !== "all") cleanParams.priority  = params.priority;
  if (params.is_read && params.is_read !== "all")   cleanParams.is_read   = params.is_read;
  if (params.is_replied && params.is_replied !== "all") cleanParams.is_replied = params.is_replied;
  if (params.assigned && params.assigned !== "all") cleanParams.assigned  = params.assigned;
  if (params.search?.trim())                        cleanParams.search    = params.search.trim();
  if (params.offset !== undefined)                  cleanParams.offset    = params.offset;
  if (params.limit !== undefined)                   cleanParams.limit     = params.limit;
  const { data } = await api.get("/admin/reports", { params: cleanParams });
  return data;
}

// Admin: counts â€” V2-037 returns full breakdown
export async function adminReportCounts(): Promise<{ success: boolean; data: ReportCounts }> {
  const { data } = await api.get("/admin/reports/counts");
  return data;
}

// Admin: single report detail
export async function adminGetReport(id: number): Promise<{ success: boolean; data: ReportDetail }> {
  const { data } = await api.get(`/admin/reports/${id}`);
  return data;
}

// Admin: reply (supports image attachments via FormData)
export async function adminReplyReport(
  id: number,
  body: { reply_text: string; via?: string; images?: File[] }
): Promise<{ success: boolean; message: string }> {
  const fd = new FormData();
  fd.append("reply_text", body.reply_text);
  if (body.via) fd.append("via", body.via);
  if (body.images) {
    body.images.forEach(file => fd.append("report_images", file));
  }
  const { data } = await api.post(`/admin/reports/${id}/reply`, fd, {
    headers: { "Content-Type": undefined },
  });
  return data;
}

// Admin: assign report to admin
export async function adminAssignReport(id: number, admin_id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.patch(`/admin/reports/${id}/assign`, { admin_id });
  return data;
}

// Admin: update status/priority
export async function adminUpdateReportStatus(id: number, body: { status?: ReportStatus; priority?: ReportPriority }): Promise<{ success: boolean; message: string }> {
  const { data } = await api.patch(`/admin/reports/${id}/status`, body);
  return data;
}

// Admin: soft-delete
export async function adminDeleteReport(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/reports/${id}`);
  return data;
}

// â”€â”€â”€ Distribution Pool API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //

export async function getReportDistributionSettings(): Promise<{ success: boolean; data: ReportDistributionSettings | null }> {
  const { data } = await api.get("/admin/report-distribution/settings");
  return data;
}

export async function updateReportDistributionSettings(
  body: Partial<Pick<ReportDistributionSettings, "auto_assign_enabled" | "assign_on_report_create" | "include_admin_role" | "include_order_manager_role">>
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.patch("/admin/report-distribution/settings", body);
  return data;
}

/** V2-037: Eligible admins for pool UI (includes SUPER_ADMIN self) */
export async function getReportEligibleAdmins(): Promise<{ success: boolean; data: ReportEligibleAdmin[] }> {
  const { data } = await api.get("/admin/report-distribution/eligible-admins");
  return data;
}

export async function getReportDistributionAgents(): Promise<{ success: boolean; data: ReportDistributionAgent[] }> {
  const { data } = await api.get("/admin/report-distribution/agents");
  return data;
}

export async function upsertReportAgent(
  adminId: number,
  body: ReportAgentPayload
): Promise<{ success: boolean; message: string; pool_id: number }> {
  const { data } = await api.post(`/admin/report-distribution/agent/${adminId}`, body);
  return data;
}

export async function removeReportAgent(adminId: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/report-distribution/agent/${adminId}`);
  return data;
}

export async function redistributeReports(): Promise<{ success: boolean; message: string; assigned: number; skipped: number }> {
  const { data } = await api.post("/admin/report-distribution/redistribute");
  return data;
}

// â”€â”€â”€ V2-038: Manual Assign / Unassign / Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //

export type ReportAssignmentLog = {
  id: number;
  report_id: number;
  action_type: 'auto_assign' | 'manual' | 'redistribute' | 'unassign';
  from_admin_id: number | null;
  to_admin_id: number | null;
  changed_by_admin_id: number | null;
  from_admin_name: string | null;
  to_admin_name: string | null;
  changed_by_name: string | null;
  created_at: string;
};

export async function manualAssignReport(body: { report_id: number; admin_id: number }): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/admin/report/assign', body);
  return data;
}

export async function unassignReport(reportId: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/report/unassign/${reportId}`);
  return data;
}

export async function getReportAssignmentLogs(params?: { report_id?: number; limit?: number; offset?: number }): Promise<{ success: boolean; data: ReportAssignmentLog[] }> {
  const { data } = await api.get('/admin/report/assignment-logs', { params });
  return data;
}
