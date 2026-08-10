import { useState } from "react";
import {
  Mail,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Download,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
  PageHeader,
  SearchInput,
  Pagination,
  Badge,
  Toggle,
  EmptyState,
  TableSkeleton,
} from "../components/ui";

function useSubscribers(params) {
  return useQuery({
    queryKey: ["subscribers", params],
    queryFn: () => api.get("/subscribers", { params }).then((r) => r.data),
    keepPreviousData: true,
  });
}

export default function SubscribersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSubscribers({ search, page, limit: 20 });

  const toggleMut = useMutation({
    mutationFn: (id) => api.patch(`/subscribers/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/subscribers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  });

  const handleDelete = (id, email) => {
    if (confirm(`"${email}" মুছে ফেলবেন?`)) deleteMut.mutate(id);
  };

  const handleExport = () => {
    const rows = data?.subscribers || [];
    const csv = [
      "Email,Name,Active,Date",
      ...rows.map(
        (s) =>
          `${s.email},${s.name || ""},${s.is_active ? "Yes" : "No"},${new Date(s.created_at).toLocaleDateString()}`,
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "subscribers.csv";
    a.click();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="সাবস্ক্রাইবার"
        subtitle={`${data?.total || 0} জন সাবস্ক্রাইব করেছেন`}
        action={
          <button
            onClick={handleExport}
            disabled={!data?.subscribers?.length}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:border-[#e91e63] hover:text-[#e91e63] disabled:opacity-40 transition-all"
          >
            <Download className="h-4 w-4" /> CSV Export
          </button>
        }
      />

      {/* Search */}
      <div className="card p-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="ইমেইল দিয়ে খুঁজুন..."
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              {["ইমেইল", "নাম", "স্ট্যাটাস", "তারিখ", "অ্যাকশন"].map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-semibold text-slate-500 ${i === 4 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <TableSkeleton rows={8} cols={5} />
            ) : (data?.subscribers || []).length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={Users} message="কোনো সাবস্ক্রাইবার নেই" />
                </td>
              </tr>
            ) : (
              (data?.subscribers || []).map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e91e63]/10">
                        <Mail className="h-3.5 w-3.5 text-[#e91e63]" />
                      </div>
                      <span className="font-medium text-[#0f172a]">
                        {s.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.name || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.is_active ? "success" : "neutral"} dot>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(s.created_at).toLocaleDateString("bn-BD", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Toggle
                        size="sm"
                        checked={!!s.is_active}
                        onChange={() => toggleMut.mutate(s.id)}
                        colorOn="bg-emerald-500"
                      />
                      <button
                        onClick={() => handleDelete(s.id, s.email)}
                        className="inline-flex items-center rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          pages={data?.pages}
          total={data?.total}
          onChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
