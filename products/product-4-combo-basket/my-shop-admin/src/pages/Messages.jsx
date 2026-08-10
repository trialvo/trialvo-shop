import { useState } from "react";
import { Mail, Trash2, CheckCircle2, MailOpen, Inbox } from "lucide-react";
import {
  useMessages,
  useMarkMessageRead,
  useDeleteMessage,
} from "../hooks/useMessages";
import { PageHeader, Pagination } from "../components/ui";

export default function Messages() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading } = useMessages({ page, limit: 20 });
  const markRead = useMarkMessageRead();
  const deleteMsg = useDeleteMessage();

  const allMessages = data?.messages || [];
  const messages = allMessages.filter((m) =>
    filter === "unread" ? !m.is_read : true,
  );
  const unreadCount = allMessages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="যোগাযোগ বার্তা"
        subtitle={`মোট ${data?.total || 0} টি বার্তা`}
        action={
          unreadCount > 0 ? (
            <span className="flex items-center gap-1.5 bg-[#e91e63]/10 text-[#e91e63] text-xs font-bold px-3 py-1.5 rounded-xl">
              <Mail className="h-3.5 w-3.5" /> {unreadCount} টি অপঠিত
            </span>
          ) : null
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { v: "all", l: "সব" },
          { v: "unread", l: "অপঠিত" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setFilter(t.v)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filter === t.v
                ? "bg-[#e91e63] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-[#e91e63]/40"
            }`}
          >
            {t.l} {t.v === "unread" && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-2">
        {isLoading &&
          [...Array(5)].map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-slate-50" />
          ))}

        {!isLoading && messages.length === 0 && (
          <div className="card py-20 text-center">
            <Inbox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">কোনো বার্তা নেই</p>
          </div>
        )}

        {messages.map((m) => {
          const isOpen = expanded === m.id;
          return (
            <div
              key={m.id}
              className={`card !p-0 overflow-hidden transition-all ${!m.is_read ? "border-l-4 border-[#e91e63]" : ""}`}
            >
              <button
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-50/70 transition-colors"
                onClick={() => {
                  setExpanded(isOpen ? null : m.id);
                  if (!m.is_read) markRead.mutate(m.id);
                }}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.is_read ? "bg-slate-100" : "bg-pink-100"}`}
                >
                  {m.is_read ? (
                    <MailOpen className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Mail className="h-4 w-4 text-[#e91e63]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm truncate ${!m.is_read ? "font-bold text-[#0f172a]" : "font-medium text-slate-700"}`}
                    >
                      {m.name}
                    </p>
                    <p className="text-[10px] text-slate-400 shrink-0">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleDateString("bn-BD")
                        : ""}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                  {m.subject && (
                    <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                      {m.subject}
                    </p>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {m.message}
                  </p>
                  <div className="flex gap-4 mt-4">
                    {!m.is_read && (
                      <button
                        onClick={() => markRead.mutate(m.id)}
                        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> পড়া হয়েছে
                      </button>
                    )}
                    <a
                      href={`mailto:${m.email}`}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Mail className="h-3.5 w-3.5" /> রিপ্লাই করুন
                    </a>
                    <button
                      onClick={() => {
                        if (confirm("মুছবেন?")) deleteMsg.mutate(m.id);
                      }}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> মুছুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="card !p-0 overflow-hidden">
          <Pagination
            page={page}
            pages={data.pages}
            total={data.total}
            onChange={(p) => {
              setPage(p);
              setExpanded(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
