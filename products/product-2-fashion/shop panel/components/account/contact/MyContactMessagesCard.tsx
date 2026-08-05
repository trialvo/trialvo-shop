"use client";
// components/account/contact/MyContactMessagesCard.tsx — V2-041
// "My Contact Messages" tab in the account dashboard for logged-in users

import React, { useState, useEffect, useCallback, useRef } from "react";
import { contactService, type MyContactMessage } from "@/lib/api/contact/service";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Loader2, Mail, MessageSquare, Plus,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────── //

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Single Message Row ───────────────────────────────────────────────────── //

function MessageRow({
  msg,
  highlighted,
  highlightRef,
}: {
  msg: MyContactMessage;
  highlighted: boolean;
  highlightRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [expanded, setExpanded] = useState(highlighted);

  // auto-expand when highlighted
  useEffect(() => {
    if (highlighted) setExpanded(true);
  }, [highlighted]);

  return (
    <div
      ref={highlighted ? highlightRef : null}
      className={`border-b border-black/[0.06] last:border-0 transition-colors ${
        highlighted ? "bg-amber-50" : "bg-white"
      }`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Unread dot */}
          <div className="mt-1.5 shrink-0">
            {!msg.is_read ? (
              <span className="block h-2 w-2 rounded-full bg-black" />
            ) : (
              <span className="block h-2 w-2 rounded-full bg-transparent" />
            )}
          </div>
          <div className="min-w-0">
            <p className={`truncate text-sm ${!msg.is_read ? "font-bold text-black" : "font-medium text-black/80"}`}>
              {msg.subject}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {timeAgo(msg.created_at)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {msg.is_replied ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                  <CheckCircle2 className="h-3 w-3" /> Replied
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                  <Clock className="h-3 w-3" /> Awaiting Reply
                </span>
              )}
              {msg.status === 0 && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                  Archived
                </span>
              )}
              {msg.replies.length > 0 && (
                <span className="text-[11px] text-gray-400">
                  {msg.replies.length} {msg.replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-gray-300 mt-1">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded: original message + replies */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-black/[0.04] pt-3 bg-gray-50/50">
          {/* Original message bubble */}
          <div className="rounded-lg bg-white border border-black/[0.07] p-3.5">
            <p className="text-xs font-semibold text-gray-400 mb-1">Your message</p>
            <p className="text-sm text-black/80 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
          </div>

          {/* Replies */}
          {msg.replies.length > 0 ? (
            <div className="space-y-2">
              {msg.replies.map((r, i) => (
                <div key={i} className="rounded-lg bg-black text-white p-3.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="h-3 w-3 opacity-60" />
                    <p className="text-[11px] font-semibold opacity-60 uppercase tracking-wide">
                      Support · {r.via} · {timeAgo(r.sent_at)}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.reply_text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No replies yet — we&apos;ll get back to you soon.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────── //

const PAGE_LIMIT = 10;

type Props = {
  highlightMessageId?: number | null;
};

const MyContactMessagesCard: React.FC<Props> = ({ highlightMessageId }) => {
  const { user, isLoading: authLoading } = useAuth();

  const [messages, setMessages] = useState<MyContactMessage[]>([]);
  const [offset, setOffset]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const highlightRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = useCallback(async (uid: number, off: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactService.getMyContactMessages(uid, PAGE_LIMIT, off);
      if (off === 0) {
        setMessages(res.data);
      } else {
        setMessages((prev) => [...prev, ...res.data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchMessages(user.id, 0);
  }, [user?.id, fetchMessages]);

  // Scroll to highlighted message once rows are loaded
  useEffect(() => {
    if (highlightMessageId && messages.length > 0) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightMessageId, messages.length]);

  const hasMore = messages.length > 0 && messages.length % PAGE_LIMIT === 0;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12 border border-black/[0.06] bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-black/40" />
      </div>
    );
  }

  return (
    <div className="border border-black/[0.06] bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black">My Contact Messages</h3>
            <p className="text-xs text-gray-500">Your submitted inquiries and our replies.</p>
          </div>
        </div>
        <a
          href="/contact-us"
          className="inline-flex items-center gap-1.5 border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-black hover:text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Message
        </a>
      </div>

      {/* Body */}
      {error ? (
        <div className="flex items-center gap-2 px-5 py-6 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : loading && messages.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-black/30" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center px-6">
          <Mail className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-black mb-1">No messages yet</p>
          <p className="text-xs text-gray-500 mb-4">
            Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
          <a
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Send a Message
          </a>
        </div>
      ) : (
        <>
          <div>
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                msg={m}
                highlighted={m.id === highlightMessageId}
                highlightRef={highlightRef}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="border-t border-black/[0.06] px-5 py-3 text-center">
              <button
                type="button"
                onClick={() => {
                  if (!user?.id || loading) return;
                  const next = offset + PAGE_LIMIT;
                  setOffset(next);
                  fetchMessages(user.id, next);
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:underline disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {loading ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyContactMessagesCard;
