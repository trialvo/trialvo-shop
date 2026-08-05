// lib/api/report/service.ts — V2-036 + V2-049 (image attachments)
import { api } from "../client";

// ─── Types ────────────────────────────────────────────────────────────────── //

export type ReportCategory = "product_issue" | "order_issue" | "fraud" | "general" | "other";
export type ReportStatus   = "open" | "in_progress" | "resolved" | "closed";
export type ReportPriority = "low" | "normal" | "high" | "urgent";

export type SubmitReportPayload = {
  reporter_name?:  string;
  reporter_email?: string;
  reporter_phone?: string;
  category?:       ReportCategory;
  subject:         string;
  description:     string;
  order_id?:       number;
  user_id?:        number | null;
  /** Up to 4 image files */
  images?:         File[];
};

export type SubmitReportResponse = {
  success:        boolean;
  message:        string;
  report_id:      number;
  tracking_token: string;
};

export type TrackReportReply = {
  text:    string;
  via:     string;
  sent_at: string;
  images:  string[];
};

export type TrackedReport = {
  id:            number;
  category:      ReportCategory;
  subject:       string;
  status:        ReportStatus;
  priority:      ReportPriority;
  is_replied:    boolean;
  reporter_name: string | null;
  created_at:    string;
  updated_at:    string;
  images:        string[];
  replies:       TrackReportReply[];
};

export type TrackReportResponse = {
  success: boolean;
  data:    TrackedReport;
};

export type MyReport = {
  id:             number;
  tracking_token: string;
  category:       ReportCategory;
  subject:        string;
  status:         ReportStatus;
  priority:       ReportPriority;
  is_read:        0 | 1;
  is_replied:     0 | 1;
  created_at:     string;
  updated_at:     string;
};

export type MyReportsResponse = {
  success: boolean;
  data:    MyReport[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────── //

function getServerErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
}

// ─── Service ──────────────────────────────────────────────────────────────── //

class ReportService {
  async submitReport(payload: SubmitReportPayload): Promise<SubmitReportResponse> {
    try {
      const fd = new FormData();

      // Append text fields
      if (payload.reporter_name)  fd.append("reporter_name", payload.reporter_name);
      if (payload.reporter_email) fd.append("reporter_email", payload.reporter_email);
      if (payload.reporter_phone) fd.append("reporter_phone", payload.reporter_phone);
      if (payload.category)       fd.append("category", payload.category);
      fd.append("subject", payload.subject);
      fd.append("description", payload.description);
      if (payload.order_id)       fd.append("order_id", String(payload.order_id));
      if (payload.user_id)        fd.append("user_id", String(payload.user_id));

      // Append images
      if (payload.images) {
        payload.images.forEach(file => fd.append("report_images", file));
      }

      const res = await api.post<SubmitReportResponse>("/report", fd, {
        headers: { "Content-Type": undefined },
      });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to submit report"));
    }
  }

  async trackReport(token: string): Promise<TrackReportResponse> {
    try {
      const res = await api.get<TrackReportResponse>("/report/track", { params: { token } });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Report not found. Please check your token."));
    }
  }

  async getMyReports(user_id: number, limit = 20, offset = 0): Promise<MyReportsResponse> {
    try {
      const res = await api.get<MyReportsResponse>("/my-reports", { params: { user_id, limit, offset } });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load your reports"));
    }
  }
}

export const reportService = new ReportService();
