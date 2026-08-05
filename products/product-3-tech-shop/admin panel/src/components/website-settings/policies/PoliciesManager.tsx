import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, FileText, Eye, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import {
  usePolicies,
  useSavePolicy,
  useDeletePolicy,
  usePatchPolicy,
} from "@/hooks/usePolicies";
import type { PolicySummary, UpsertPolicyBody } from "@/api/policies.api";
import { getPolicyByKey } from "@/api/policies.api";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import Modal from "@/components/ui/modal/Modal";


type PolicyForm = {
  policy_key: string;
  title: string;
  bd_title: string;
  content: string;
  content_type: "html" | "text";
  status: 0 | 1;
};

const EMPTY_FORM: PolicyForm = {
  policy_key: "",
  title: "",
  bd_title: "",
  content: "",
  content_type: "html",
  status: 1,
};

/**
 * Hard validator — returns first error string found, or null if HTML looks valid.
 * Save is BLOCKED when this returns a string.
 */
function isValidHtml(html: string): string | null {
  if (!html.trim()) return null;

  // Unclosed tag: '<p' or '<div class' without a closing '>'
  if (/<[a-zA-Z/][^>]*$/.test(html.trim())) {
    return "Invalid HTML: unclosed tag detected (e.g. '<p' missing '>'). Please fix before saving.";
  }

  // Stray '<' that isn't part of a tag
  if (/<(?![a-zA-Z/!?])/.test(html)) {
    return "Invalid HTML: stray '<' character found. Use '&lt;' to display a literal '<'.";
  }

  // Dangerous content — hard block
  if (/<script\b/i.test(html)) return "<script> tags are not allowed in policy content.";
  if (/<iframe\b/i.test(html)) return "<iframe> tags are not allowed in policy content.";
  if (/\son\w+\s*=/i.test(html)) return "Event handler attributes (onclick, onerror …) are not allowed.";
  if (/javascript:/i.test(html)) return "javascript: URLs are not allowed.";

  return null;
}

export default function PoliciesManager() {
  const { data: policies = [], isLoading, isError } = usePolicies();
  const saveMutation = useSavePolicy();
  const deleteMutation = useDeletePolicy();
  const patchMutation = usePatchPolicy();

  /* ── Editor state ── */
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<PolicyForm>(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ── View state ── */
  const [viewPolicy, setViewPolicy] = useState<{ title: string; content: string; content_type: "html" | "text" } | null>(null);
  const [loadingView, setLoadingView] = useState<string | null>(null);

  /* ── Delete state ── */
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Status toggle state ── */
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  /* ─────────── Open edit (fetches full content) ─────────── */
  const openEdit = async (p: PolicySummary) => {
    setLoadingEdit(true);
    setEditingKey(p.policy_key);
    try {
      const full = await getPolicyByKey(p.policy_key);
      setForm({
        policy_key: full.policy_key,
        title: full.title,
        bd_title: full.bd_title ?? "",
        content: full.content ?? "",
        content_type: full.content_type,
        status: full.status,
      });
      setEditorOpen(true);
    } catch {
      toast.error("Failed to load policy content.");
      setEditingKey(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  /* ─────────── Open view (fetches full content) ─────────── */
  const openView = async (p: PolicySummary) => {
    setLoadingView(p.policy_key);
    try {
      const full = await getPolicyByKey(p.policy_key);
      setViewPolicy({
        title: full.title,
        content: full.content ?? "(no content)",
        content_type: full.content_type,
      });
    } catch {
      toast.error("Failed to load policy content.");
    } finally {
      setLoadingView(null);
    }
  };

  /* ─────────── Create ─────────── */
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingKey(null);
    setEditorOpen(true);
  };

  /* ───── Quick status toggle (no modal needed) ───── */
  const toggleStatus = async (p: PolicySummary) => {
    setTogglingKey(p.policy_key);
    try {
      const newStatus: 0 | 1 = p.status === 1 ? 0 : 1;
      await patchMutation.mutateAsync({ key: p.policy_key, body: { status: newStatus } });
      toast.success(`Policy ${newStatus === 1 ? "activated" : "deactivated"}.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Toggle failed.");
    } finally {
      setTogglingKey(null);
    }
  };

  /* ─────────── Save ─────────── */
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    // Hard block on invalid HTML when content_type is html
    if (form.content_type === "html" && form.content.trim()) {
      const htmlError = isValidHtml(form.content);
      if (htmlError) {
        toast.error(htmlError);
        return;
      }
    }

    setSaving(true);
    try {
      if (editingKey) {
        // ── PATCH: only send what's in the form ──
        await patchMutation.mutateAsync({
          key: editingKey,
          body: {
            title: form.title,
            bd_title: form.bd_title.trim() || null,
            content_type: form.content_type,
            status: form.status,
            ...(form.content.trim() ? { content: form.content } : {}),
          },
        });
        toast.success("Policy updated.");
      } else {
        // ── POST: full upsert for new policy ──
        if (!form.policy_key.trim()) {
          toast.error("Policy key is required.");
          setSaving(false);
          return;
        }
        await saveMutation.mutateAsync({
          policy_key: form.policy_key,
          title: form.title,
          bd_title: form.bd_title.trim() || undefined,
          content: form.content,
          content_type: form.content_type,
          status: form.status,
        });
        toast.success("Policy created.");
      }
      setEditorOpen(false);
      setForm(EMPTY_FORM);
      setEditingKey(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  /* ─────────── Delete ─────────── */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(confirmDelete);
      toast.success("Policy deleted.");
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  /* ─────────── Render ─────────── */
  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {policies.length} polic{policies.length === 1 ? "y" : "ies"} configured
        </p>
        <Button startIcon={<Plus size={15} />} onClick={openCreate}>
          Add Policy
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading policies…</p>
        ) : isError ? (
          <p className="p-6 text-sm text-error-500">Failed to load policies.</p>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-gray-400">
            <FileText size={32} />
            <p className="text-sm">No policies yet. Create your first policy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  {["Policy Key", "Title", "BD Title", "Type", "Status", "Updated", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr
                    key={p.policy_key}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                      {p.policy_key}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {p.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {p.bd_title ?? <span className="text-gray-300 dark:text-gray-600 italic text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {p.content_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(p)}
                        disabled={togglingKey === p.policy_key}
                        title={p.status === 1 ? "Click to deactivate" : "Click to activate"}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        {togglingKey === p.policy_key ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : p.status === 1 ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400">
                            <ToggleRight size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <ToggleLeft size={12} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => openView(p)}
                          disabled={loadingView === p.policy_key}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 disabled:opacity-50"
                          title="View"
                        >
                          {loadingView === p.policy_key
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Eye size={14} />
                          }
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEdit(p)}
                          disabled={loadingEdit && editingKey === p.policy_key}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 disabled:opacity-50"
                          title="Edit"
                        >
                          {loadingEdit && editingKey === p.policy_key
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Pencil size={14} />
                          }
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setConfirmDelete(p.policy_key)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error-200 bg-white text-error-600 hover:bg-error-50 dark:border-error-900/40 dark:bg-gray-900"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── View Modal ─── */}
      <Modal
        open={Boolean(viewPolicy)}
        title={viewPolicy?.title ?? "Policy"}
        onClose={() => setViewPolicy(null)}
        size="lg"
      >
        {viewPolicy && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {viewPolicy.content_type}
              </span>
            </div>
            {viewPolicy.content_type === "html" ? (
              <div
                className="prose dark:prose-invert max-w-none rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40 text-sm"
                dangerouslySetInnerHTML={{ __html: viewPolicy.content }}
              />
            ) : (
              <pre className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40 text-xs text-gray-800 dark:text-gray-200">
                {viewPolicy.content}
              </pre>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewPolicy(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Editor Modal ─── */}
      <Modal
        open={editorOpen}
        title={editingKey ? `Edit — ${editingKey}` : "Create Policy"}
        onClose={() => { setEditorOpen(false); setForm(EMPTY_FORM); setEditingKey(null); }}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Policy Key */}
            <div className="space-y-1.5">
              <Label htmlFor="policy-key">
                Policy Key <span className="text-error-500">*</span>
              </Label>
              <Input
                id="policy-key"
                value={form.policy_key}
                disabled={Boolean(editingKey)}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    policy_key: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  }))
                }
                placeholder="return_policy"
              />
              {!editingKey && (
                <p className="text-xs text-gray-400">
                  Unique identifier — cannot be changed after creation.
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="policy-title">
                Title <span className="text-error-500">*</span>
              </Label>
              <Input
                id="policy-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Return Policy"
              />
            </div>
          </div>

          {/* BD Title */}
          <div className="space-y-1.5">
            <Label htmlFor="policy-bd-title">
              Bengali Title <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <Input
              id="policy-bd-title"
              value={form.bd_title}
              onChange={(e) => setForm((f) => ({ ...f, bd_title: e.target.value }))}
              placeholder="ফেরত নীতি"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Content Type */}
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <div className="flex gap-4">
                {(["html", "text"] as const).map((ct) => (
                  <label key={ct} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="content_type"
                      value={ct}
                      checked={form.content_type === ct}
                      onChange={() => setForm((f) => ({ ...f, content_type: ct }))}
                      className="accent-brand-500"
                    />
                    {ct.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex gap-4">
                {([1, 0] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={() => setForm((f) => ({ ...f, status: s }))}
                      className="accent-brand-500"
                    />
                    {s === 1 ? "Active" : "Inactive"}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="policy-content">
              Content{" "}
              {form.content_type === "html" && (
                <span className="text-xs text-gray-400">(HTML)</span>
              )}
            </Label>
            <textarea
              id="policy-content"
              rows={12}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder={
                form.content_type === "html"
                  ? "<p>Policy content here...</p>"
                  : "Policy content here..."
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xs text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => { setEditorOpen(false); setForm(EMPTY_FORM); setEditingKey(null); }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingKey ? "Update Policy" : "Create Policy"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete Confirm ─── */}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Policy"
        message={`Delete policy "${confirmDelete}"? This cannot be undone.`}
        confirmText={deleting ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        tone="danger"
        onClose={() => !deleting && setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
