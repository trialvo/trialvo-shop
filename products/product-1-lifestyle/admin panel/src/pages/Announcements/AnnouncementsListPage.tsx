import { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle, Clock, SendHorizontal, Megaphone,
  X, ChevronLeft, ChevronRight, Pencil, Trash2, Send, Users, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAnnouncements, useAnnouncementAlerts,
  useDeleteAnnouncement, useSendAnnouncement, useSendManualAnnouncement,
} from "@/hooks/useAnnouncements";
import type {
  AnnouncementStatus, AnnouncementChannel,
  AnnouncementTargetType, SendManualPayload,
} from "@/api/announcements.api";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import PageMeta from "@/components/common/PageMeta";

// ─── Badges ───────────────────────────────────────────────────────────────────

const CHANNEL_STYLES: Record<AnnouncementChannel, string> = {
  email: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  sms: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  both: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
};
const STATUS_STYLES: Record<AnnouncementStatus, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  scheduled: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  sent: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  cancelled: "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300",
};

function ChannelBadge({ channel }: { channel: AnnouncementChannel }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${CHANNEL_STYLES[channel]}`}>{channel}</span>;
}
function StatusBadge({ status }: { status: AnnouncementStatus }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}>{status}</span>;
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function AlertBanner() {
  const { data } = useAnnouncementAlerts();
  const meta = data?.meta;
  if (!meta) return null;
  const hasAlert = meta.total_unsent > 0 || meta.total_scheduled_overdue > 0;
  if (!hasAlert) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Announcement Alerts:</span>
      {meta.total_unsent > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">{meta.total_unsent} unsent</span>}
      {meta.total_scheduled_pending > 0 && <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{meta.total_scheduled_pending} scheduled</span>}
      {meta.total_scheduled_overdue > 0 && <span className="rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-semibold text-error-700 dark:bg-error-500/20 dark:text-error-300">{meta.total_scheduled_overdue} overdue</span>}
    </div>
  );
}

// ─── Send Manual Modal ────────────────────────────────────────────────────────

function SendManualModal({ announcementId, open, onClose }: {
  announcementId: number | null; open: boolean; onClose: () => void;
}) {
  const [emailsText, setEmailsText] = useState("");
  const [phonesText, setPhonesText] = useState("");
  const sendManual = useSendManualAnnouncement();
  const [result, setResult] = useState<{ email_recipients: number; sms_recipients: number } | null>(null);

  const handleSend = async () => {
    if (!announcementId) return;
    const emails = emailsText.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    const phones = phonesText.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    const payload: SendManualPayload = { announcement_id: announcementId };
    if (emails.length) payload.emails = emails;
    if (phones.length) payload.phones = phones;
    if (!emails.length && !phones.length) { toast.error("Provide at least one email or phone."); return; }
    try {
      const res = await sendManual.mutateAsync(payload);
      setResult({ email_recipients: res.email_recipients, sms_recipients: res.sms_recipients });
      toast.success("Manual announcement sent!");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send.");
    }
  };

  const handleClose = () => { setEmailsText(""); setPhonesText(""); setResult(null); onClose(); };

  return (
    <Modal open={open} title="Send Manual Announcement" onClose={handleClose} size="md">
      {result ? (
        <div className="space-y-4 text-center">
          <div className="flex justify-center gap-6">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 min-w-[100px]">
              <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{result.email_recipients}</p>
              <p className="text-xs text-gray-500 mt-1">Email Recipients</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 min-w-[100px]">
              <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{result.sms_recipients}</p>
              <p className="text-xs text-gray-500 mt-1">SMS Recipients</p>
            </div>
          </div>
          <Button onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emails (comma or newline separated)</label>
            <textarea rows={4} value={emailsText} onChange={(e) => setEmailsText(e.target.value)}
              placeholder="user@example.com, another@example.com"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200 focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Numbers (comma or newline separated)</label>
            <textarea rows={4} value={phonesText} onChange={(e) => setPhonesText(e.target.value)}
              placeholder="01700000000, 01800000000"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200 focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={sendManual.isPending} startIcon={<SendHorizontal size={15} />}>
              {sendManual.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Main List Page ───────────────────────────────────────────────────────────

export default function AnnouncementsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AnnouncementStatus | "">("");
  const [channel, setChannel] = useState<AnnouncementChannel | "">("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isError } = useAnnouncements({
    search: search || undefined,
    status: status || undefined,
    channel: channel || undefined,
    limit,
    offset: page * limit,
  });
  const announcements = data?.data ?? [];
  const total = data?.total ?? 0;

  const deleteMutation = useDeleteAnnouncement();
  const sendMutation = useSendAnnouncement();

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [sendResult, setSendResult] = useState<{ id: number; result: any } | null>(null);
  const [sending, setSending] = useState<number | null>(null);

  const [manualAnnouncementId, setManualAnnouncementId] = useState<number | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      toast.success("Announcement deleted.");
      setConfirmDeleteId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSend = async (id: number) => {
    setSending(id);
    try {
      const res = await sendMutation.mutateAsync(id);
      setSendResult({ id, result: res });
      toast.success("Announcement sent!");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to send.";
      toast.error(msg);
    } finally {
      setSending(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <PageMeta title="Announcements" description="Manage and send announcements via email, SMS, or push" />
      <AlertBanner />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Send email, SMS, or both to customers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" startIcon={<Users size={15} />} onClick={() => { setManualAnnouncementId(null); setManualModalOpen(true); }}>
            Send Manual
          </Button>
          <Button startIcon={<Megaphone size={15} />} onClick={() => navigate("/create-announcement")}>
            Create Announcement
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search headline..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white min-w-[200px]"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(0); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sent">Sent</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={channel} onChange={(e) => { setChannel(e.target.value as any); setPage(0); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white">
          <option value="">All Channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {["Headline", "Channel", "Status", "Target", "Zone Scope", "Scheduled At", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Loading announcements...</td></tr>
              ) : isError ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-error-500">Failed to load announcements.</td></tr>
              ) : announcements.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No announcements found.</td></tr>
              ) : announcements.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{a.headline}</td>
                  <td className="px-4 py-3"><ChannelBadge channel={a.channel} /></td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 capitalize">{a.target_type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 capitalize">{a.zone_scope}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {a.scheduled_at ? (
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(a.scheduled_at).toLocaleString()}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => navigate(`/edit-announcement/${a.id}`)} title="Edit"
                        className="h-7 w-7 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleSend(a.id)} disabled={sending === a.id} title="Send"
                        className={`h-7 px-2 flex items-center gap-1 rounded border text-xs font-medium ${a.status === "sent" ? "border-orange-200 text-orange-600 hover:bg-orange-50" : "border-brand-200 text-brand-600 hover:bg-brand-50 dark:border-brand-900/40 dark:text-brand-300"}`}>
                        {sending === a.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /> : <Send size={11} />}
                        {a.status === "sent" ? "Re-send" : "Send"}
                      </button>
                      <button onClick={() => { setManualAnnouncementId(a.id); setManualModalOpen(true); }} title="Send Manual"
                        className="h-7 px-2 flex items-center gap-1 rounded border border-violet-200 text-violet-600 text-xs font-medium hover:bg-violet-50 dark:border-violet-900/40 dark:text-violet-300">
                        <Users size={11} /> Manual
                      </button>
                      <button onClick={() => setConfirmDeleteId(a.id)} title="Delete"
                        className="h-7 w-7 flex items-center justify-center rounded border border-error-200 text-error-600 hover:bg-error-50">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800">
          <p className="text-xs text-gray-500">{total} total — page {page + 1} of {Math.max(1, totalPages)}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:text-gray-300">
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:text-gray-300">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Send Result Modal */}
      <Modal open={Boolean(sendResult)} title="Announcement Sent" onClose={() => setSendResult(null)} size="sm">
        {sendResult && (
          <div className="space-y-4 text-center">
            <Send size={32} className="text-success-500 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Your announcement was sent successfully!</p>
            <div className="flex justify-center gap-6">
              {sendResult.result.email_recipient_count !== undefined && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{sendResult.result.email_recipient_count}</p><p className="text-xs text-gray-500 mt-1">Email</p></div>
              )}
              {sendResult.result.sms_recipient_count !== undefined && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{sendResult.result.sms_recipient_count}</p><p className="text-xs text-gray-500 mt-1">SMS</p></div>
              )}
              {sendResult.result.recipient_count !== undefined && sendResult.result.email_recipient_count === undefined && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{sendResult.result.recipient_count}</p><p className="text-xs text-gray-500 mt-1">Recipients</p></div>
              )}
            </div>
            <Button onClick={() => setSendResult(null)}>Done</Button>
          </div>
        )}
      </Modal>

      {/* Send Manual Modal */}
      <SendManualModal
        announcementId={manualAnnouncementId}
        open={manualModalOpen}
        onClose={() => { setManualModalOpen(false); setManualAnnouncementId(null); }}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete Announcement"
        message="Delete this announcement? This cannot be undone."
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        tone="danger"
        onClose={() => !deleting && setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
