import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCustomer, useToggleCustomerStatus } from "../hooks/useCustomers";

const STATUS_LABELS = {
  pending: "মুলতুবি",
  confirmed: "নিশ্চিত",
  processing: "প্রস্তুত",
  shipped: "শিপড",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
};
const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-violet-100 text-violet-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useCustomer(id);
  const toggleMut = useToggleCustomerStatus();

  if (isLoading) return <p className="text-slate-400 text-sm">লোড হচ্ছে...</p>;
  const { user, orders } = data || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/customers")}
          className="btn-outline !px-2.5 !py-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">{user?.name}</h1>
          <span
            className={`badge ${user?.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
          >
            {user?.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </span>
        </div>
        <button
          onClick={() => toggleMut.mutate(id)}
          disabled={toggleMut.isPending}
          className="ml-auto btn-outline text-xs"
        >
          {user?.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
        </button>
      </div>

      <div className="card">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          প্রোফাইল
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">ইমেইল</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">ফোন</p>
            <p className="font-medium">{user?.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">যোগদান</p>
            <p className="font-medium">
              {new Date(user?.created_at).toLocaleDateString("bn-BD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">মোট অর্ডার</p>
            <p className="font-medium">{orders?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          সাম্প্রতিক অর্ডার
        </h3>
        {orders?.length ? (
          <div className="divide-y divide-slate-50">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-[#0f172a]">
                    {o.order_number}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(o.created_at).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                  <span className="font-semibold text-[#e91e63]">
                    BDT {o.total?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">কোনো অর্ডার নেই</p>
        )}
      </div>
    </div>
  );
}
