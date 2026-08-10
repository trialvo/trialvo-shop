import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Save,
  GripVertical,
} from "lucide-react";
import {
  useFAQs,
  useCreateFAQ,
  useUpdateFAQ,
  useDeleteFAQ,
} from "../hooks/useFAQs";
import {
  Modal,
  PageHeader,
  EmptyState,
  Input,
  Select,
  Textarea,
} from "../components/ui";

const EMPTY_FORM = {
  question: "",
  answer: "",
  category: "general",
  sort_order: 0,
};

function FAQItem({ faq, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`card !p-0 overflow-hidden transition-all hover:shadow-md ${open ? "shadow-md" : ""}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0f172a] leading-snug">
            {faq.question}
          </p>
          {faq.category && (
            <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
              {faq.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(faq);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(faq.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pt-4">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQs() {
  const { data, isLoading } = useFAQs();
  const createMut = useCreateFAQ();
  const updateMut = useUpdateFAQ();
  const deleteMut = useDeleteFAQ();

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const faqs = data?.faqs || [];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal("create");
  };
  const openEdit = (f) => {
    setForm(f);
    setModal(f);
  };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (modal === "create") createMut.mutate(form, { onSuccess: closeModal });
    else
      updateMut.mutate({ id: modal.id, data: form }, { onSuccess: closeModal });
  };

  const handleDelete = (id) => {
    if (confirm("এই FAQ মুছে ফেলবেন?")) deleteMut.mutate(id);
  };
  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5">
      <PageHeader
        title="সাধারণ জিজ্ঞাসা (FAQ)"
        subtitle={`সচরাচর জিজ্ঞাসিত প্রশ্ন — মোট ${faqs.length} টি`}
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> নতুন FAQ
          </button>
        }
      />

      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal && modal !== "create" ? "FAQ সম্পাদনা" : "নতুন FAQ"}
        footer={
          <>
            <button onClick={closeModal} className="btn-outline">
              বাতিল
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <Save className="h-4 w-4" />
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="প্রশ্ন"
            required
            placeholder="প্রশ্নটি লিখুন..."
            value={form.question}
            onChange={(e) => set("question", e.target.value)}
          />
          <Textarea
            label="উত্তর"
            required
            rows={5}
            placeholder="উত্তরটি লিখুন..."
            value={form.answer}
            onChange={(e) => set("answer", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="ক্যাটাগরি"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="general">সাধারণ</option>
              <option value="order">অর্ডার</option>
              <option value="payment">পেমেন্ট</option>
              <option value="delivery">ডেলিভারি</option>
              <option value="return">রিটার্ন</option>
              <option value="product">পণ্য</option>
            </Select>
            <Input
              label="ক্রম"
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              hint="কম = আগে দেখাবে"
            />
          </div>
        </div>
      </Modal>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-14 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={HelpCircle}
            message="কোনো FAQ যোগ করা হয়নি"
            action={
              <button onClick={openCreate} className="btn-primary mx-auto">
                FAQ যোগ করুন
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((f) => (
            <FAQItem
              key={f.id}
              faq={f}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
