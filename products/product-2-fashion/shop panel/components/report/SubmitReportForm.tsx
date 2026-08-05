"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  reportService,
  type ReportCategory,
  type SubmitReportPayload,
} from "@/lib/api/report/service";
import { saveReportToken } from "@/lib/reportTokenStore";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  ImagePlus,
  ShieldCheck,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Select, { type SelectOption } from "@/components/common/form/Select";

type CategoryInfo = {
  value: ReportCategory;
  label: string;
  hint: string;
};

const CATEGORY_OPTIONS: CategoryInfo[] = [
  {
    value: "product_issue",
    label: "Product Issue",
    hint: "Defective, damaged, or wrong item",
  },
  {
    value: "order_issue",
    label: "Order Issue",
    hint: "Delivery, missing items, or cancellation",
  },
  {
    value: "fraud",
    label: "Fraud / Suspicious",
    hint: "Unauthorized charges or suspicious behavior",
  },
  {
    value: "general",
    label: "General Inquiry",
    hint: "Questions, feedback, or other concerns",
  },
  {
    value: "other",
    label: "Other",
    hint: "Anything else not covered above",
  },
];

const CATEGORY_SELECT_OPTIONS: SelectOption[] = CATEGORY_OPTIONS.map((c) => ({
  value: c.value,
  label: c.label,
}));

const SUBJECT_MAX = 200;
const DESC_MAX = 2000;
const MAX_IMAGES = 4;

type FormState = {
  reporter_name: string;
  reporter_email: string;
  reporter_phone: string;
  category: ReportCategory;
  subject: string;
  description: string;
  order_id: string;
};

type SuccessResult = {
  report_id: number;
  tracking_token: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function StepDivider({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-black text-[10px] font-bold tabular-nums text-white">
        {step}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-black/[0.04]" />
    </div>
  );
}

function CategoryCard({
  info,
  isActive,
  onClick,
}: {
  info: CategoryInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex flex-col items-start p-3 text-left transition-all duration-150",
        "border",
        isActive
          ? "border-black bg-black/[0.02]"
          : "border-black/[0.06] hover:border-black/20",
      ].join(" ")}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={[
            "text-xs font-semibold",
            isActive ? "text-black" : "text-gray-700",
          ].join(" ")}
        >
          {info.label}
        </span>
        {isActive && (
          <span className="flex h-3.5 w-3.5 items-center justify-center bg-black">
            <CheckCircle className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </div>
      <span className="mt-0.5 text-[11px] leading-snug text-gray-400">
        {info.hint}
      </span>
    </button>
  );
}

export default function SubmitReportForm() {
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    reporter_name: "",
    reporter_email: "",
    reporter_phone: "",
    category: "general",
    subject: "",
    description: "",
    order_id: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      reporter_name:
        prev.reporter_name ||
        `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
      reporter_email: prev.reporter_email || user.email || "",
    }));
  }, [user]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuccessResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const progress = useMemo((): number => {
    let count = 0;
    if (form.subject.trim()) count++;
    if (form.description.trim()) count++;
    if (form.reporter_email.trim() || form.reporter_phone.trim()) count++;
    if (form.reporter_name.trim()) count++;
    if (form.category) count++;
    return Math.round((count / 5) * 100);
  }, [form]);

  const set = useCallback((k: keyof FormState, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
    setSubmitError(null);
  }, []);

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.reporter_email.trim() && !form.reporter_phone.trim()) {
      e.reporter_email = "At least one of email or phone is required.";
    }
    if (form.reporter_email && !/\S+@\S+\.\S+/.test(form.reporter_email)) {
      e.reporter_email = "Enter a valid email address.";
    }
    if (form.order_id && isNaN(Number(form.order_id))) {
      e.order_id = "Order ID must be a number.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const payload: SubmitReportPayload = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        reporter_name: form.reporter_name.trim() || undefined,
        reporter_email: form.reporter_email.trim() || undefined,
        reporter_phone: form.reporter_phone.trim() || undefined,
        order_id: form.order_id ? Number(form.order_id) : undefined,
        user_id: user?.id ?? undefined,
        images: images.length > 0 ? images : undefined,
      };
      const res = await reportService.submitReport(payload);
      saveReportToken({
        token: res.tracking_token,
        report_id: res.report_id,
        subject: form.subject.trim().slice(0, 80),
        submitted_at: new Date().toISOString(),
      });
      setResult({
        report_id: res.report_id,
        tracking_token: res.tracking_token,
        message: res.message,
      });
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit report.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tracking_token);
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2500);
      return () => clearTimeout(timer);
    } catch {
      // clipboard unavailable
    }
  };

  const resetForm = () => {
    setResult(null);
    setForm({
      reporter_name: user
        ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
        : "",
      reporter_email: user?.email || "",
      reporter_phone: "",
      category: "general",
      subject: "",
      description: "",
      order_id: "",
    });
    setErrors({});
    setSubmitError(null);
    setImages([]);
  };

  if (result) {
    return (
      <div className="space-y-3">
        <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h1 className="text-xl font-bold text-black">Report Submitted</h1>
          </div>
        </div>

        <div className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
          <div className="border-b border-black/[0.04] px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-green-50">
              <CheckCircle className="h-7 w-7 text-green-500" />
            </div>
            <h2 className="text-lg font-bold text-black">
              Report #{result.report_id} Received
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Our support team will review and get back to you.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="space-y-1.5">
              <Label>Your Tracking Token</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={result.tracking_token}
                  className="flex-1 font-mono rounded-none"
                />
                <Button
                  variant={copied ? "default" : "outline"}
                  size="default"
                  onClick={handleCopy}
                  className={
                    copied
                      ? "rounded-none bg-green-600 text-white hover:bg-green-700"
                      : "rounded-none"
                  }
                >
                  {copied ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Save this token — use it to track your report status on our{" "}
                <Link
                  href="/track-report"
                  className="font-semibold text-black underline"
                >
                  Track Report
                </Link>{" "}
                page.
              </p>
            </div>

            <div className="mt-6 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                What happens next
              </p>
              {[
                "Our support team reviews your report",
                "You'll receive updates via email or phone",
                "Use your tracking token to check status anytime",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center bg-black text-[9px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-xs text-gray-500">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-black/[0.04] bg-gray-50/40 px-6 py-4 sm:flex-row">
            <Button asChild className="flex-1 rounded-none">
              <Link href={`/track-report?token=${result.tracking_token}`}>
                <ExternalLink className="h-4 w-4" />
                Track My Report
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex-1 rounded-none"
            >
              Submit Another Report
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-black" />
            <h1 className="text-xl font-bold text-black">Submit a Report</h1>
          </div>

          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="h-1 w-16 overflow-hidden bg-black/[0.06]">
              <div
                className="h-full bg-black transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums text-gray-400">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]"
      >
        <div className="border-b border-black/[0.04] px-5 py-4">
          <p className="text-sm text-gray-500">
            Have a product issue, order problem, or something to report? Fill
            out the form below and our support team will review it.
          </p>
        </div>

        <div className="px-5 py-5 space-y-6">
          {submitError && (
            <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  Submission failed
                </p>
                <p className="mt-0.5 text-xs text-red-600">{submitError}</p>
              </div>
            </div>
          )}

          <StepDivider step={1} label="Category" />

          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <CategoryCard
                key={opt.value}
                info={opt}
                isActive={form.category === opt.value}
                onClick={() => set("category", opt.value)}
              />
            ))}
          </div>

          <div className="sm:hidden space-y-1.5">
            <Label htmlFor="report-category-mobile">Report Category</Label>
            <Select
              options={CATEGORY_SELECT_OPTIONS}
              value={form.category}
              onChange={(v) => set("category", v as ReportCategory)}
              placeholder="Select a category"
            />
          </div>

          <StepDivider step={2} label="Contact Information" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="report-name">
                Your Name{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                id="report-name"
                value={form.reporter_name}
                onChange={(e) => set("reporter_name", e.target.value)}
                placeholder="Full name"
                className="rounded-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-email">
                Email{" "}
                <span className="font-normal text-gray-400">
                  (email or phone required)
                </span>
              </Label>
              <Input
                type="email"
                id="report-email"
                value={form.reporter_email}
                onChange={(e) => set("reporter_email", e.target.value)}
                placeholder="your@email.com"
                aria-invalid={!!errors.reporter_email}
                className="rounded-none"
              />
              {errors.reporter_email && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.reporter_email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="report-phone">
                Phone{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                type="tel"
                id="report-phone"
                value={form.reporter_phone}
                onChange={(e) => set("reporter_phone", e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="rounded-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-order-id">
                Related Order ID{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                id="report-order-id"
                value={form.order_id}
                onChange={(e) => set("order_id", e.target.value)}
                placeholder="e.g. 12345"
                aria-invalid={!!errors.order_id}
                className="rounded-none"
              />
              {errors.order_id && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.order_id}
                </p>
              )}
            </div>
          </div>

          <StepDivider step={3} label="Report Details" />

          <div className="space-y-1.5">
            <Label htmlFor="report-subject">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              id="report-subject"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Brief summary of your issue"
              maxLength={SUBJECT_MAX}
              aria-invalid={!!errors.subject}
              className="rounded-none"
            />
            <div className="flex items-center justify-between">
              {errors.subject ? (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.subject}
                </p>
              ) : (
                <span />
              )}
              <span className="ml-auto text-[11px] tabular-nums text-gray-300">
                {form.subject.length}/{SUBJECT_MAX}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="report-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={6}
              maxLength={DESC_MAX}
              placeholder="Please provide as much detail as possible — what happened, when, order numbers, product names, etc."
              aria-invalid={!!errors.description}
              className="resize-y rounded-none border-[#CBCBCB] px-2.5 text-base shadow-xs placeholder:text-[#999999] placeholder:text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.5px]! md:text-sm"
            />
            <div className="flex items-center justify-between">
              {errors.description ? (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {errors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="ml-auto text-[11px] tabular-nums text-gray-300">
                {form.description.length}/{DESC_MAX}
              </span>
            </div>
          </div>

          {/* Image Attachments */}
          <div className="space-y-1.5">
            <Label>Attachments <span className="font-normal text-gray-400">(optional, up to {MAX_IMAGES} images)</span></Label>
            <div className="flex flex-wrap gap-2">
              {images.map((file, i) => (
                <div key={i} className="group relative h-20 w-20 border border-black/[0.06] bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Attachment ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center bg-black text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center border border-dashed border-black/20 bg-gray-50/50 transition-colors hover:border-black/40 hover:bg-gray-100/70">
                  <ImagePlus className="h-5 w-5 text-gray-400" />
                  <span className="mt-1 text-[9px] font-medium text-gray-400">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setImages(prev => [...prev, ...files].slice(0, MAX_IMAGES));
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/[0.04] bg-gray-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Your information is kept confidential.</span>
          </div>
          <Button
            type="submit"
            isLoading={loading}
            loadingText="Submitting…"
            className="rounded-none"
          >
            <ArrowRight className="h-4 w-4" />
            Submit Report
          </Button>
        </div>
      </form>

      <div className="bg-white px-5 py-3 shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
        <p className="text-center text-sm text-gray-400">
          Already have a tracking token?{" "}
          <Link
            href="/track-report"
            className="font-semibold text-black transition-opacity hover:opacity-60"
          >
            Track your report →
          </Link>
        </p>
      </div>
    </div>
  );
}
