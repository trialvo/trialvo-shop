import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserX, Eye, Filter } from "lucide-react";
import { useCustomers, useToggleCustomerStatus } from "../hooks/useCustomers";
import { Pagination, SearchInput, PageHeader } from "../components/ui";

function Avatar({ name }) {
  const colors = [
    "bg-[#e91e63]",
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors[colorIdx]} text-white text-xs font-bold`}
    >
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl px-5 py-3 ${color}`}
    >
      <p className="text-2xl font-extrabold">{value ?? "—"}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCustomers({
    search,
    isActive,
    page,
    limit: 20,
  });
  const toggleMut = useToggleCustomerStatus();

  const users = data?.users || [];
  const total = data?.total || 0;
  const active = users.filter((u) => u.is_active).length;
  const inactive = users.filter((u) => !u.is_active).length;

  return (
    <div className="space-y-5">
      <PageHeader title="গ্রাহক" subtitle="সকল নিবন্ধিত গ্রাহক ম্যানেজ করুন" />

      {/* Stats strip */}
      <div className="flex gap-3">
        <StatPill
          label="মোট"
          value={total}
          color="bg-slate-100 text-slate-700"
        />
        <StatPill
          label="সক্রিয়"
          value={active}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatPill
          label="নিষ্ক্রিয়"
          value={inactive}
          color="bg-red-50 text-red-700"
        />
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          className="flex-1"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
        />
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="input !py-2 !w-auto"
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setPage(1);
            }}
          >
            <option value="">সব</option>
            <option value="true">সক্রিয়</option>
            <option value="false">নিষ্ক্রিয়</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["গ্রাহক", "ইমেইল", "ফোন", "যোগদান", "স্ট্যাটাস", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading &&
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-2">
                      <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                    </td>
                  </tr>
                ))}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Users className="h-10 w-10 text-slate-200" />
                      <p className="text-sm">কোনো গ্রাহক পাওয়া যায়নি</p>
                    </div>
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <div>
                        <p className="font-semibold text-[#0f172a] text-sm">
                          {u.name || "—"}
                        </p>
                        <p className="text-[10px] text-slate-400">ID #{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {u.phone || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("bn-BD")
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleMut.mutate(u.id)}
                      className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 transition-all ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600"
                          : "bg-red-50 text-red-600 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      {u.is_active ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          সক্রিয়
                        </>
                      ) : (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          নিষ্ক্রিয়
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate(`/customers/${u.id}`)}
                      className="flex items-center gap-1 text-xs text-[#e91e63] font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-3.5 w-3.5" /> দেখুন
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pages={data?.pages}
          total={data?.total}
          onChange={setPage}
          label="জন গ্রাহক"
        />
      </div>
    </div>
  );
}
