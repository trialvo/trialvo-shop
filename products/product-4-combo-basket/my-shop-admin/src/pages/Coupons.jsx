import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Copy,
  CheckCheck,
  Clock,
  Ticket,
} from "lucide-react";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "../hooks/useCoupons";
import {
  Modal,
  PageHeader,
  EmptyState,
  Badge,
  Input,
  Select,
  Toggle,
} from "../components/ui";

const EMPTY_FORM = {
  code: "",
  type: "percent",
  value: "",
  min_order_amount: 0,
  max_discount: "",
  usage_limit: 0,
  expires_at: "",
  is_active: true,
  applies_to: "all",
};

function CouponCard({ coupon, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const pct =
    coupon.usage_limit > 0
      ? Math.min(
          100,
          Math.round((coupon.used_count / coupon.usage_limit) * 100),
        )
      : null;
  const isExpired =
    coupon.expires_at && new Date(coupon.expires_at) < new Date();

  const copy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`card flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${!coupon.is_active || isExpired ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e91e63]/10 shrink-0">
            <Ticket className="h-4 w-4 text-[#e91e63]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-[#0f172a]">
                {coupon.code}
              </span>
              <button
                onClick={copy}
                title="Copy"
                className="text-slate-400 hover:text-[#e91e63] transition-colors"
              >
                {copied ? (
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {coupon.applies_to === "all"
                ? "সব অর্ডারে"
                : coupon.applies_to === "combo"
                  ? "কম্বো অর্ডারে"
                  : "সিঙ্গেল অর্ডারে"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(coupon)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(coupon.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold ${coupon.type === "percent" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}
        >
          {coupon.type === "percent"
            ? `${coupon.value}% ছাড়`
            : `৳${coupon.value} ছাড়`}
        </span>
        {coupon.min_order_amount > 0 && (
          <Badge variant="neutral">
            মিন ৳{Number(coupon.min_order_amount).toLocaleString()}
          </Badge>
        )}
        {!coupon.is_active && <Badge variant="neutral">নিষ্ক্রিয়</Badge>}
        {isExpired && <Badge variant="danger">মেয়াদ শেষ</Badge>}
      </div>

      {coupon.usage_limit > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>
              ব্যবহার: {coupon.used_count} / {coupon.usage_limit}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#e91e63] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {coupon.expires_at && (
        <div
          className={`flex items-center gap-1.5 text-xs ${isExpired ? "text-red-500" : "text-slate-400"}`}
        >
          <Clock className="h-3 w-3" />
          {isExpired ? "মেয়াদ শেষ: " : "মেয়াদ: "}
          {new Date(coupon.expires_at).toLocaleDateString("bn-BD")}
        </div>
      )}
    </div>
  );
}

export default function Coupons() {
  const { data, isLoading } = useCoupons();
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const deleteMut = useDeleteCoupon();

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const coupons = data?.coupons || [];
  const active = coupons.filter(
    (c) =>
      c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date()),
  ).length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal("create");
  };
  const openEdit = (c) => {
    setForm({
      ...c,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
      max_discount: c.max_discount || "",
    });
    setModal(c);
  };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    const payload = { ...form, code: form.code.toUpperCase() };
    if (modal === "create")
      createMut.mutate(payload, { onSuccess: closeModal });
    else
      updateMut.mutate(
        { id: modal.id, data: payload },
        { onSuccess: closeModal },
      );
  };

  const handleDelete = (id) => {
    if (confirm("এই কুপনটি মুছে ফেলবেন?")) deleteMut.mutate(id);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="কুপন কোড"
        subtitle={`মোট ${coupons.length} টি — ${active} টি সক্রিয়`}
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> নতুন কুপন
          </button>
        }
      />

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={
          modal === "create"
            ? "নতুন কুপন তৈরি"
            : `কুপন সম্পাদনা — ${modal?.code || ""}`
        }
        footer={
          <>
            <button onClick={closeModal} className="btn-outline">
              বাতিল
            </button>
            <button
              onClick={handleSave}
              disabled={createMut.isPending || updateMut.isPending}
              className="btn-primary"
            >
              {createMut.isPending || updateMut.isPending
                ? "সংরক্ষণ হচ্ছে..."
                : "সংরক্ষণ করুন"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="কুপন কোড"
              required
              placeholder="e.g. SAVE20"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              className="uppercase"
            />
            <Select
              label="টাইপ"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="percent">শতাংশ (%)</option>
              <option value="fixed">নির্দিষ্ট (৳)</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ছাড়ের পরিমাণ"
              required
              type="number"
              placeholder={form.type === "percent" ? "e.g. 20" : "e.g. 100"}
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
            />
            <Input
              label="সর্বোচ্চ ছাড় (৳)"
              type="number"
              placeholder="সীমা নেই"
              value={form.max_discount}
              onChange={(e) => set("max_discount", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="ন্যূনতম অর্ডার (৳)"
              type="number"
              value={form.min_order_amount}
              onChange={(e) => set("min_order_amount", e.target.value)}
            />
            <Input
              label="ব্যবহারের সীমা"
              type="number"
              placeholder="0 = সীমাহীন"
              value={form.usage_limit}
              onChange={(e) => set("usage_limit", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="মেয়াদ শেষ"
              type="date"
              value={form.expires_at}
              onChange={(e) => set("expires_at", e.target.value)}
            />
            <Select
              label="প্রযোজ্য"
              value={form.applies_to}
              onChange={(e) => set("applies_to", e.target.value)}
            >
              <option value="all">সব অর্ডারে</option>
              <option value="combo">কম্বো অর্ডারে</option>
              <option value="single">সিঙ্গেল অর্ডারে</option>
            </Select>
          </div>
          <Toggle
            label={form.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
            checked={form.is_active}
            onChange={() => set("is_active", !form.is_active)}
            colorOn="bg-emerald-500"
          />
        </div>
      </Modal>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Ticket}
            message="কোনো কুপন নেই"
            action={
              <button onClick={openCreate} className="btn-primary mx-auto">
                নতুন কুপন তৈরি করুন
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <CouponCard
              key={c.id}
              coupon={c}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
