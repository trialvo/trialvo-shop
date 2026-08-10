import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Edit2,
  Trash2,
  Home,
  Tag,
  Hash,
  ArrowUpDown,
  LayersIcon,
  Eye,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from "../hooks/useCategories";
import { Modal, PageHeader, EmptyState, Input, Toggle } from "../components/ui";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
];

const EMPTY = {
  name: "",
  name_bn: "",
  slug: "",
  icon: "",
  svg_icon: "",
  color: "#e91e63",
  sort_order: 0,
  is_active: true,
  show_on_home: false,
  home_sort_order: 0,
};

// ─── Icon renderer ────────────────────────────────────────────────────────────

function CategoryIcon({ category, size = 10 }) {
  const color = category.color || "#e91e63";
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{
        width: size * 4,
        height: size * 4,
        background: `${color}18`,
        color,
      }}
    >
      {category.svg_icon ? (
        <span
          className="flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
          style={{ width: size * 2.2, height: size * 2.2, color }}
          dangerouslySetInnerHTML={{ __html: category.svg_icon }}
        />
      ) : (
        <span style={{ fontSize: size * 1.6 }}>{category.icon || "🏷️"}</span>
      )}
    </div>
  );
}

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableRow({
  category: c,
  onEdit,
  onDelete,
  updateMut,
  isDragging: isOverlay,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group hover:bg-slate-50 transition-colors ${!c.is_active ? "opacity-60" : ""} ${isOverlay ? "bg-white shadow-xl rounded-xl" : ""}`}
    >
      {/* Drag handle */}
      <td className="pl-3 pr-1 py-3 w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-center justify-center h-8 w-6 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors touch-none"
          title="ড্র্যাগ করে ক্রম পরিবর্তন করুন"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Category name + icon */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <CategoryIcon category={c} size={8} />
          <div className="min-w-0">
            <p className="font-semibold text-[#0f172a] text-sm truncate max-w-[140px]">
              {c.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: c.color || "#e91e63" }}
              />
              <span className="text-[10px] text-slate-400 font-mono">
                {c.color || "#e91e63"}
              </span>
              {c.svg_icon && (
                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600">
                  SVG
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Slug */}
      <td className="px-4 py-3 text-xs text-slate-400 font-mono max-w-[120px] truncate">
        {c.slug}
      </td>

      {/* Sort order */}
      <td className="px-4 py-3">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {c.sort_order}
        </span>
      </td>

      {/* Home toggle */}
      <td className="px-4 py-3">
        <Toggle
          size="sm"
          checked={!!c.show_on_home}
          onChange={() =>
            updateMut.mutate({
              id: c.id,
              data: { show_on_home: !c.show_on_home },
            })
          }
        />
      </td>

      {/* Active toggle */}
      <td className="px-4 py-3">
        <Toggle
          size="sm"
          checked={!!c.is_active}
          onChange={() =>
            updateMut.mutate({ id: c.id, data: { is_active: !c.is_active } })
          }
          colorOn="bg-emerald-500"
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(c)}
            className="btn-outline !px-2.5 !py-1.5 text-xs"
            title="এডিট করুন"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(c)}
            className="flex items-center rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-50 transition-colors"
            title="মুছুন"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [previewTab, setPreviewTab] = useState("icon");
  const [items, setItems] = useState([]); // local ordered list for DnD
  const [activeId, setActiveId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // category object to delete

  const { data, isLoading } = useCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();
  const reorderMut = useReorderCategories();

  // Sync server data → local list
  useEffect(() => {
    if (data?.categories) setItems(data.categories);
  }, [data?.categories]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === active.id);
      const newIdx = prev.findIndex((c) => c.id === over.id);
      const next = arrayMove(prev, oldIdx, newIdx);

      // Save new sort_orders to API
      const order = next.map((c, i) => ({ id: c.id, sort_order: i }));
      reorderMut.mutate(order, {
        meta: { successMessage: false },
        onSuccess: () => toast.success("ক্যাটাগরির ক্রম সেভ হয়েছে"),
      });

      return next;
    });
  };

  const activeCategory = activeId ? items.find((c) => c.id === activeId) : null;

  // Delete confirm helpers
  const openDeleteConfirm = (cat) => setDeleteConfirm(cat);
  const closeDeleteConfirm = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteMut.mutate(deleteConfirm.id, {
      meta: { successMessage: `"${deleteConfirm.name}" মুছে ফেলা হয়েছে` },
      onSuccess: closeDeleteConfirm,
      onError: closeDeleteConfirm,
    });
  };

  // Modal helpers
  const openNew = () => {
    setForm(EMPTY);
    setErr("");
    setPreviewTab("icon");
    setModalOpen(true);
  };
  const openEdit = (c) => {
    setForm({ ...c, svg_icon: c.svg_icon || "", color: c.color || "#e91e63" });
    setErr("");
    setPreviewTab(c.svg_icon ? "svg" : "icon");
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setErr("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const isEdit = !!form.id;
    try {
      if (isEdit) {
        await updateMut.mutateAsync(
          { id: form.id, data: form },
          { meta: { successMessage: `"${form.name}" আপডেট হয়েছে` } },
        );
      } else {
        await createMut.mutateAsync(form, {
          meta: { successMessage: `"${form.name}" তৈরি হয়েছে` },
        });
      }
      closeModal();
    } catch (er) {
      setErr(er.response?.data?.message || "ত্রুটি হয়েছে");
    }
  };

  const activeCount = items.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ক্যাটাগরি ম্যানেজমেন্ট"
        subtitle={`${items.length} টি ক্যাটাগরি · ${activeCount} টি সক্রিয়`}
        action={
          <div className="flex items-center gap-3">
            <button onClick={openNew} className="btn-primary">
              <Plus className="h-4 w-4" /> নতুন ক্যাটাগরি
            </button>
          </div>
        }
      />

      {/* ── Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={form.id ? "ক্যাটাগরি এডিট করুন" : "নতুন ক্যাটাগরি তৈরি করুন"}
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn-outline">
              বাতিল
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={createMut.isPending || updateMut.isPending}
            >
              {createMut.isPending || updateMut.isPending
                ? "সেভ হচ্ছে..."
                : "সেভ করুন"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Live preview */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
            <CategoryIcon category={form} size={12} />
            <div className="min-w-0">
              <p className="font-semibold text-[#0f172a] text-sm truncate">
                {form.name || "ক্যাটাগরির নাম"}
              </p>
              <p className="text-xs text-slate-400 font-mono truncate">
                {form.slug || "category-slug"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: form.color || "#e91e63" }}
                />
                <span className="text-[10px] text-slate-400">
                  {form.color || "#e91e63"}
                </span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-slate-300" />
              <span className="text-[10px] text-slate-400">প্রিভিউ</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="নাম"
              required
              placeholder="ক্যাটাগরির নাম"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="স্লাগ (Auto)"
              placeholder="category-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              hint="খালি রাখলে Auto হবে"
            />
          </div>

          {/* Bangla Name */}
          <Input
            label="বাংলা নাম"
            placeholder="বাংলায় ক্যাটাগরির নাম (ঐচ্ছিক)..."
            value={form.name_bn || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, name_bn: e.target.value }))
            }
            hint="না দিলে ইংরেজি নামই শপে দেখাবে"
          />

          {/* Color picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              ক্যাটাগরি কালার
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="h-7 w-7 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    background: c,
                    borderColor: form.color === c ? "#0f172a" : "transparent",
                    boxShadow:
                      form.color === c
                        ? `0 0 0 2px white, 0 0 0 4px ${c}`
                        : "none",
                  }}
                />
              ))}
              <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 overflow-hidden">
                <input
                  type="color"
                  value={form.color || "#e91e63"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  className="absolute opacity-0 h-full w-full cursor-pointer"
                />
                <span className="text-[10px] font-bold text-slate-400 pointer-events-none">
                  +
                </span>
              </label>
            </div>
          </div>

          {/* Icon type tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              আইকন টাইপ
            </label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {["icon", "svg"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPreviewTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium transition-all ${previewTab === tab ? "bg-[#0f172a] text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  {tab === "icon" ? "Emoji / URL" : "SVG কোড"}
                </button>
              ))}
            </div>
            {previewTab === "icon" ? (
              <Input
                placeholder="📦 বা https://example.com/icon.png"
                value={form.icon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value, svg_icon: "" }))
                }
                hint="Emoji বা Image URL"
              />
            ) : (
              <div className="space-y-1.5">
                <textarea
                  rows={5}
                  placeholder={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\n  <path d="..." />\n</svg>`}
                  value={form.svg_icon}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      svg_icon: e.target.value,
                      icon: "",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-mono text-slate-700 outline-none transition-all focus:border-[#e91e63] focus:ring-2 focus:ring-pink-50 resize-none"
                />
                <p className="text-[10px] text-slate-400">
                  Heroicons বা Lucide থেকে SVG কোড পেস্ট করুন
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
              }
              hint="কম = আগে"
            />
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-600">
                সক্রিয়
              </label>
              <div className="flex-1 flex items-center">
                <Toggle
                  checked={form.is_active}
                  onChange={() =>
                    setForm((f) => ({ ...f, is_active: !f.is_active }))
                  }
                  colorOn="bg-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Home section */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" /> হোম পেজ সেকশন
            </p>
            <Toggle
              label="হোম পেজে সেকশন হিসেবে দেখাও"
              checked={!!form.show_on_home}
              onChange={() =>
                setForm((f) => ({ ...f, show_on_home: !f.show_on_home }))
              }
            />
            {form.show_on_home && (
              <Input
                label="হোম সেকশন ক্রম"
                type="number"
                value={form.home_sort_order || 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    home_sort_order: Number(e.target.value),
                  }))
                }
                hint="কম = আগে"
              />
            )}
          </div>

          {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={closeDeleteConfirm}
        size="sm"
        title=""
        footer={
          <>
            <button
              type="button"
              onClick={closeDeleteConfirm}
              className="btn-outline"
            >
              বাতিল
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="btn-danger"
            >
              {deleteMut.isPending ? "মুছা হচ্ছে..." : "হ্যাঁ, মুছে দিন"}
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          {/* Warning icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#0f172a]">
              ক্যাটাগরি মুছবেন?
            </h3>
            <p className="mt-1.5 text-sm text-slate-500">
              এই ক্যাটাগরিটি স্থায়ীভাবে মুছে যাবে এবং পুনরুদ্ধার করা সম্ভব হবে
              না।
            </p>
          </div>

          {/* Category preview chip */}
          {deleteConfirm && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/50 px-4 py-2.5">
              <CategoryIcon category={deleteConfirm} size={7} />
              <span className="text-sm font-semibold text-[#0f172a]">
                {deleteConfirm.name}
              </span>
              <span className="ml-auto font-mono text-[10px] text-slate-400">
                {deleteConfirm.slug}
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Drag-and-drop table ── */}
      <div className="card p-0 overflow-hidden">
        {/* Drag hint banner */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <GripVertical className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-xs text-slate-400">
            বাম দিকের <span className="font-semibold text-slate-500">⠿</span>{" "}
            হ্যান্ডেল ধরে টেনে ক্রম পরিবর্তন করুন — স্বয়ংক্রিয়ভাবে সেভ হবে
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="pl-3 pr-1 py-3.5 w-8" />
              {[
                {
                  label: "ক্যাটাগরি",
                  icon: <LayersIcon className="h-3 w-3" />,
                },
                { label: "স্লাগ", icon: <Hash className="h-3 w-3" /> },
                { label: "অর্ডার", icon: <ArrowUpDown className="h-3 w-3" /> },
                { label: "হোম", icon: <Home className="h-3 w-3" /> },
                { label: "স্ট্যাটাস", icon: <Tag className="h-3 w-3" /> },
                { label: "অ্যাকশন", icon: null },
              ].map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3.5 text-xs font-semibold text-slate-500 ${i === 5 ? "text-right" : "text-left"}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {h.icon}
                    {h.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    message="কোনো ক্যাটাগরি নেই"
                    action={
                      <button onClick={openNew} className="btn-primary mx-auto">
                        প্রথম ক্যাটাগরি যোগ করুন
                      </button>
                    }
                  />
                </td>
              </tr>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((c) => (
                    <SortableRow
                      key={c.id}
                      category={c}
                      onEdit={openEdit}
                      onDelete={openDeleteConfirm}
                      updateMut={updateMut}
                    />
                  ))}
                </SortableContext>

                {/* Drag overlay — ghosted floating row */}
                <DragOverlay>
                  {activeCategory && (
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <tbody>
                        <SortableRow
                          category={activeCategory}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          updateMut={{ mutate: () => {} }}
                          isDragging
                        />
                      </tbody>
                    </table>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
