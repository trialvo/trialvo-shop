import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Package,
  Tag,
  Star,
  Gift,
  List,
  Settings,
  Eye,
  AlertCircle,
  Sparkles,
  Layers,
  Upload,
  Video,
  X,
  Loader2,
  Link as LinkIcon,
  FileText,
  MessageSquare,
  Bold,
  Italic,
  Underline,
  ListOrdered,
  ImagePlus,
  Minus,
  Crop,
} from "lucide-react";
import { useCategories } from "../hooks/useCategories";
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
} from "../hooks/useProducts";
import { useProductReviews, useDeleteProductReview } from "../hooks/useReviews";
import { getImageUrl } from "../lib/imageUrl";
import { uploadFile } from "../api/upload.api";
import ImageCropModal from "../components/ImageCropModal";

// ── Helpers ────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, colorOn = "bg-[#e91e63]" }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors duration-300 ${
        checked
          ? `${colorOn} border-transparent`
          : "bg-slate-100 border-slate-200"
      }`}
    >
      <span
        className={`absolute inline-block h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
          checked ? "left-[calc(100%-22px)]" : "left-1"
        }`}
      />
    </button>
  );
}

// ── Upload Dropzone ────────────────────────────────────────────────────────────
function UploadDropzone({
  onUpload,
  accept = "image/*",
  label = "ছবি আপলোড করুন",
  hint = "ড্র্যাগ করুন বা ক্লিক করুন",
  multiple = false,
  uploading = false,
  icon: Icon = Upload,
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    await onUpload(multiple ? Array.from(files) : files[0]);
  };
  return (
    <label
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-8 transition-all duration-200 ${
        dragging
          ? "border-[#e91e63] bg-pink-50 scale-[1.01]"
          : "border-slate-200 bg-gradient-to-b from-slate-50 to-white hover:border-[#e91e63]/60 hover:bg-pink-50/40 hover:scale-[1.005]"
      }`}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />
      {uploading ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e91e63]/10">
            <Loader2 className="h-6 w-6 animate-spin text-[#e91e63]" />
          </div>
          <span className="text-sm font-medium text-slate-500">
            আপলোড হচ্ছে...
          </span>
        </>
      ) : (
        <>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
              dragging
                ? "bg-[#e91e63]/20"
                : "bg-slate-100 group-hover:bg-[#e91e63]/10"
            }`}
          >
            <Icon
              className={`h-6 w-6 transition-colors ${
                dragging
                  ? "text-[#e91e63]"
                  : "text-slate-400 group-hover:text-[#e91e63]"
              }`}
            />
          </div>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-600 group-hover:text-[#e91e63] transition-colors">
              {label}
            </span>
            <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
          </div>
        </>
      )}
    </label>
  );
}

// ── Image Preview ──────────────────────────────────────────────────────────────
function ImagePreview({ url, aspectClass = "aspect-square" }) {
  const [error, setError] = useState(false);
  useEffect(() => setError(false), [url]);
  const resolved = url ? getImageUrl(url) : null;
  if (!resolved || error) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${aspectClass} rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400`}
      >
        <ImageIcon className="h-10 w-10 mb-2 opacity-30" />
        <span className="text-xs font-medium">প্রিভিউ নেই</span>
        <span className="text-[10px] text-slate-300 mt-0.5">
          ছবি আপলোড করুন
        </span>
      </div>
    );
  }
  return (
    <div
      className={`relative ${aspectClass} rounded-2xl overflow-hidden border border-slate-200 bg-slate-50`}
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
    >
      <img
        src={resolved}
        alt="preview"
        onError={() => setError(true)}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
    </div>
  );
}

// ── MediaInput (upload + URL + crop) ──────────────────────────────────────────
function MediaInput({
  value,
  onChange,
  accept = "image/*",
  label,
  cropAspect = 1,
}) {
  const [cropFile, setCropFile] = useState(null);

  return (
    <div className="space-y-3">
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={cropAspect}
          label={label}
          onDone={(url) => {
            setCropFile(null);
            onChange(url);
          }}
          onCancel={() => setCropFile(null)}
        />
      )}

      <UploadDropzone
        onUpload={(file) => setCropFile(file)}
        accept={accept}
        label={`${label} আপলোড করুন`}
        hint="ক্লিক বা ড্র্যাগ • ক্রপ করে আপলোড হবে"
        icon={Crop}
      />

      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <div className="flex-1 border-t border-slate-200" />
        <span>অথবা URL দিন</span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      <div className="relative">
        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          className="input pl-9 pr-9"
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Gallery Editor ─────────────────────────────────────────────────────────────
function GalleryEditor({ images, onChange }) {
  const [cropQueue, setCropQueue] = useState([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [newUrl, setNewUrl] = useState("");
  const pendingUrlsRef = useRef([]);

  const handleFilesSelected = (files) => {
    pendingUrlsRef.current = [];
    setCropQueue(files);
    setCropIndex(0);
  };

  const handleCropDone = (url) => {
    pendingUrlsRef.current.push(url);
    const next = cropIndex + 1;
    if (next < cropQueue.length) {
      setCropIndex(next);
    } else {
      const newUrls = pendingUrlsRef.current.filter((u) => !images.includes(u));
      onChange([...images, ...newUrls]);
      setCropQueue([]);
      setCropIndex(0);
    }
  };

  const handleCropCancel = () => {
    const next = cropIndex + 1;
    if (next < cropQueue.length) {
      setCropIndex(next);
    } else {
      if (pendingUrlsRef.current.length > 0) {
        const newUrls = pendingUrlsRef.current.filter(
          (u) => !images.includes(u),
        );
        onChange([...images, ...newUrls]);
      }
      setCropQueue([]);
      setCropIndex(0);
    }
  };

  const addUrl = () => {
    const t = newUrl.trim();
    if (t && !images.includes(t)) {
      onChange([...images, t]);
      setNewUrl("");
    }
  };

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));
  const currentCropFile =
    cropQueue.length > 0 && cropIndex < cropQueue.length
      ? cropQueue[cropIndex]
      : null;

  return (
    <div className="space-y-4">
      {currentCropFile && (
        <ImageCropModal
          file={currentCropFile}
          aspect={1}
          label={`গ্যালারি ছবি ${cropIndex + 1}/${cropQueue.length}`}
          onDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}

      <UploadDropzone
        onUpload={handleFilesSelected}
        accept="image/*"
        label="গ্যালারি ছবি আপলোড"
        hint="একাধিক ছবি বেছে নিন • প্রতিটি আলাদাভাবে ক্রপ হবে"
        multiple
        icon={ImagePlus}
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="URL দিয়ে ছবি যোগ করুন..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addUrl())
            }
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-outline !px-4">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 transition-all duration-200 hover:border-[#e91e63]/30 hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={getImageUrl(url)}
                  alt={`gallery-${i}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.opacity = "0.3";
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
              >
                <Trash2 className="h-3 w-3 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <Layers className="h-8 w-8 mb-2 text-slate-300 opacity-60" />
          <p className="text-sm font-medium text-slate-400">
            কোনো গ্যালারি ছবি নেই
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            উপরে ছবি আপলোড করুন
          </p>
        </div>
      )}
    </div>
  );
}

// ── Video Input ────────────────────────────────────────────────────────────────
function VideoInput({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await uploadFile(file);
      onChange(res.url);
    } catch (e) {
      alert("ভিডিও আপলোড ব্যর্থ: " + (e.response?.data?.message || e.message));
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-3">
      <UploadDropzone
        onUpload={handleUpload}
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        label="ভিডিও আপলোড করুন (MP4/WebM)"
        uploading={uploading}
      />
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <div className="flex-1 border-t border-slate-200" />
        অথবা ভিডিও URL
        <div className="flex-1 border-t border-slate-200" />
      </div>
      <div className="relative">
        <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="https://... (.mp4, .webm) অথবা YouTube URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {value && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
          {value.includes("youtube.com") || value.includes("youtu.be") ? (
            <div className="text-center py-6 text-xs text-slate-400">
              <Video className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              YouTube ভিডিও (শপে দেখাবে)
            </div>
          ) : (
            <video
              src={getImageUrl(value)}
              controls
              className="w-full max-h-48"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Features Editor ────────────────────────────────────────────────────────────
function FeaturesEditor({ features, onChange }) {
  const [newItem, setNewItem] = useState("");
  const add = () => {
    const t = newItem.trim();
    if (t) {
      onChange([...features, t]);
      setNewItem("");
    }
  };
  const update = (i, val) =>
    onChange(features.map((f, idx) => (idx === i ? val : f)));
  const remove = (i) => onChange(features.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e91e63]/10 text-[#e91e63] text-[10px] font-bold shrink-0">
            {i + 1}
          </span>
          <input
            className="input flex-1 text-sm py-1.5"
            value={f}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="নতুন ফিচার যোগ করুন..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button
          type="button"
          onClick={add}
          className="btn-primary !px-4 !py-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Specs Editor ───────────────────────────────────────────────────────────────
function SpecificationsEditor({ specs, onChange }) {
  const entries = Object.entries(specs);
  const update = (oldKey, newKey, val) => {
    const obj = { ...specs };
    if (oldKey !== newKey) delete obj[oldKey];
    obj[newKey] = val;
    onChange(obj);
  };
  const remove = (key) => {
    const obj = { ...specs };
    delete obj[key];
    onChange(obj);
  };
  const add = () =>
    onChange({ ...specs, [`বৈশিষ্ট্য ${entries.length + 1}`]: "" });
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <input
            className="input w-40 shrink-0 text-sm py-1.5 font-medium"
            value={k}
            onChange={(e) => update(k, e.target.value, v)}
            placeholder="নাম"
          />
          <span className="text-slate-300">:</span>
          <input
            className="input flex-1 text-sm py-1.5"
            value={v}
            onChange={(e) => update(k, k, e.target.value)}
            placeholder="মান"
          />
          <button
            type="button"
            onClick={() => remove(k)}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-xs font-medium text-[#e91e63] hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> স্পেসিফিকেশন যোগ করুন
      </button>
    </div>
  );
}

// ── Tags Input ─────────────────────────────────────────────────────────────────
function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  // Add one or many tags (splits by comma / newline / semicolon)
  const addMany = (raw) => {
    const parts = raw
      .split(/[,;\n]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !tags.includes(t));
    if (parts.length > 0) onChange([...tags, ...parts]);
    setInput("");
  };

  const handleChange = (e) => {
    const val = e.target.value;
    // If user typed a comma/semicolon/newline → split immediately
    if (/[,;\n]/.test(val)) {
      addMany(val);
    } else {
      setInput(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addMany(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      // Delete last tag on backspace when input is empty
      onChange(tags.slice(0, -1));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    addMany(pasted);
  };

  const remove = (t) => onChange(tags.filter((x) => x !== t));

  return (
    <div className="space-y-2">
      <div className="flex items-center flex-wrap gap-1.5 min-h-[36px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-[#e91e63]/10 px-2.5 py-1 text-xs font-medium text-[#e91e63]"
          >
            #{t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="ml-0.5 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-[11px] text-slate-400">কোনো ট্যাগ নেই</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="ট্যাগ লিখুন, কমা দিয়ে আলাদা করুন..."
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <button
          type="button"
          onClick={() => addMany(input)}
          className="btn-outline text-xs !px-4"
        >
          যোগ
        </button>
      </div>
      <p className="text-[10px] text-slate-400">
        comma (,) বা Enter চাপলে আলাদা ট্যাগ হবে • Paste করলেও auto-split হবে
      </p>
    </div>
  );
}

// ── Rich Text Editor (Draft-style, no external dependency) ─────────────────────
function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const fileInputRef = useRef(null);
  const [imgUploading, setImgUploading] = useState(false);

  // Sync external value to editor (only on mount / reset)
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // only on mount

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncValue();
  };

  const syncValue = () => {
    isUpdatingRef.current = true;
    onChange(editorRef.current?.innerHTML || "");
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  };

  const insertImage = async (file) => {
    if (!file) return;
    setImgUploading(true);
    try {
      const res = await uploadFile(file);
      editorRef.current?.focus();
      const imgHtml = `<img src="${res.url}" alt="product-image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`;
      document.execCommand("insertHTML", false, imgHtml);
      syncValue();
    } catch (e) {
      alert("ছবি আপলোড ব্যর্থ: " + (e.response?.data?.message || e.message));
    } finally {
      setImgUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toolbarBtns = [
    { label: <Bold size={14} />, cmd: "bold", title: "Bold" },
    { label: <Italic size={14} />, cmd: "italic", title: "Italic" },
    { label: <Underline size={14} />, cmd: "underline", title: "Underline" },
    {
      label: <span className="text-xs font-bold">H2</span>,
      cmd: "formatBlock",
      val: "h2",
      title: "Heading 2",
    },
    {
      label: <span className="text-xs font-bold">H3</span>,
      cmd: "formatBlock",
      val: "h3",
      title: "Heading 3",
    },
    {
      label: <ListOrdered size={14} />,
      cmd: "insertOrderedList",
      title: "Ordered List",
    },
    {
      label: <List size={14} />,
      cmd: "insertUnorderedList",
      title: "Unordered List",
    },
    {
      label: <Minus size={14} />,
      cmd: "insertHorizontalRule",
      title: "Divider",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        {toolbarBtns.map((btn, i) => (
          <button
            key={i}
            type="button"
            title={btn.title}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(btn.cmd, btn.val || null);
            }}
            className="flex h-7 min-w-[28px] items-center justify-center rounded-lg px-2 text-slate-600 transition-colors hover:bg-[#e91e63]/10 hover:text-[#e91e63] active:bg-[#e91e63]/20"
          >
            {btn.label}
          </button>
        ))}

        {/* Separator */}
        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Image upload */}
        <button
          type="button"
          title="ছবি সন্নিবেশ করুন"
          disabled={imgUploading}
          onMouseDown={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition-colors hover:bg-[#e91e63]/10 hover:text-[#e91e63] disabled:opacity-50"
        >
          {imgUploading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <ImagePlus size={14} />
          )}
          <span className="hidden sm:inline">ছবি</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => insertImage(e.target.files[0])}
        />
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        className="min-h-[280px] p-4 text-sm text-slate-700 leading-relaxed focus:outline-none"
        style={{ wordBreak: "break-word" }}
        data-placeholder="পণ্যের বিবরণ লিখুন... ফর্ম্যাটিং টুলবার ব্যবহার করুন।"
      />

      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.25rem; }
        [contenteditable] h3 { font-size: 1.05rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5rem; margin: 0.25rem 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5rem; margin: 0.25rem 0; }
        [contenteditable] hr { border: none; border-top: 1px solid #e2e8f0; margin: 0.75rem 0; }
        [contenteditable] img { border-radius: 8px; max-width: 100%; display: block; }
        [contenteditable] strong { font-weight: 700; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] u { text-decoration: underline; }
      `}</style>
    </div>
  );
}

// ── Star Rating Display ────────────────────────────────────────────────────────
function StarDisplay({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`}
        />
      ))}
    </div>
  );
}

// ── Reviews Tab ────────────────────────────────────────────────────────────────
function ReviewsTab({ productId }) {
  const { data, isLoading } = useProductReviews(productId);
  const deleteMut = useDeleteProductReview(productId);
  const reviews = data?.reviews || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">কোনো রিভিউ নেই</p>
        <p className="text-xs mt-1 text-slate-300">
          এখনো কোনো গ্রাহক রিভিউ দেননি
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-700">{reviews.length}</span>{" "}
          টি রিভিউ
        </p>
        <div className="flex items-center gap-1.5">
          <StarDisplay
            rating={Math.round(
              reviews.reduce((a, r) => a + Number(r.rating), 0) /
                reviews.length,
            )}
          />
          <span className="text-xs font-semibold text-slate-600">
            {(
              reviews.reduce((a, r) => a + Number(r.rating), 0) / reviews.length
            ).toFixed(1)}
          </span>
        </div>
      </div>

      {reviews.map((r) => (
        <div
          key={r.id}
          className="group rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:border-slate-200 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#e91e63] to-pink-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(r.user?.name || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">
                  {r.user?.name || "অজ্ঞাত ব্যবহারকারী"}
                </p>
                <p className="text-[10px] text-slate-400">{r.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StarDisplay rating={Number(r.rating)} />
              <span className="text-xs font-bold text-amber-600">
                {r.rating}/5
              </span>
              <button
                type="button"
                onClick={() =>
                  confirm("এই রিভিউ মুছবেন?") && deleteMut.mutate(r.id)
                }
                disabled={deleteMut.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-white text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {r.title && (
            <p className="mt-2.5 text-sm font-semibold text-[#0f172a]">
              {r.title}
            </p>
          )}
          {r.body && (
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              {r.body}
            </p>
          )}
          <p className="mt-2 text-[10px] text-slate-400">
            {new Date(r.created_at || r.createdAt).toLocaleDateString("bn-BD")}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Sort Order Input ──────────────────────────────────────────────────────────
function SortOrderInput({ value, onChange }) {
  const val = Number(value) || 0;
  const quickOptions = [
    { label: "১ম", v: 1, hint: "সবার আগে" },
    { label: "৫", v: 5, hint: "" },
    { label: "১০", v: 10, hint: "" },
    { label: "৫০", v: 50, hint: "" },
    { label: "শেষে", v: 999, hint: "সবার পরে" },
  ];
  const step = (delta) => onChange(Math.max(0, val + delta));
  const color =
    val <= 5
      ? "text-emerald-600 border-emerald-200 bg-emerald-50"
      : val <= 20
        ? "text-amber-600 border-amber-200 bg-amber-50"
        : "text-slate-500 border-slate-200 bg-slate-50";
  const label =
    val <= 5 ? "সামনের দিকে" : val <= 20 ? "মাঝামাঝি" : "পেছনের দিকে";

  return (
    <div className="space-y-2">
      {/* Stepper row */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => step(-10)}
          title="-10"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold hover:border-[#e91e63]/40 hover:text-[#e91e63] transition-colors select-none"
        >
          -10
        </button>
        <button
          type="button"
          onClick={() => step(-1)}
          title="-1"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#e91e63]/40 hover:text-[#e91e63] transition-colors select-none"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min={0}
          value={val}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className={`input h-8 w-16 text-center text-sm font-bold !px-1 border ${color}`}
        />
        <button
          type="button"
          onClick={() => step(1)}
          title="+1"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#e91e63]/40 hover:text-[#e91e63] transition-colors select-none"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => step(10)}
          title="+10"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold hover:border-[#e91e63]/40 hover:text-[#e91e63] transition-colors select-none"
        >
          +10
        </button>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-1.5">
        {quickOptions.map((opt) => (
          <button
            type="button"
            key={opt.v}
            onClick={() => onChange(opt.v)}
            title={opt.hint}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
              val === opt.v
                ? "border-[#e91e63] bg-[#e91e63]/10 text-[#e91e63]"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#e91e63]/40 hover:text-[#e91e63]"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {/* Status badge */}
        <span
          className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${color}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Tabs Config ────────────────────────────────────────────────────────────────
const TABS = (isEdit) => [
  { id: "basic", label: "মূল তথ্য", icon: Package },
  { id: "desc", label: "বিবরণ", icon: FileText },
  { id: "specs", label: "স্পেসিফিকেশন", icon: Settings },
  { id: "media", label: "মিডিয়া", icon: ImageIcon },
  ...(isEdit ? [{ id: "reviews", label: "রিভিউ", icon: MessageSquare }] : []),
  { id: "visibility", label: "দৃশ্যমানতা", icon: Eye },
];

const EMPTY_FORM = {
  name: "",
  name_bn: "",
  slug: "",
  short_description: "",
  description: "",
  price: "",
  actual_price: "",
  discount_amount: "0",
  image: "",
  images: [],
  video_url: "",
  category_id: "",
  tags: [],
  in_stock: true,
  is_featured: false,
  is_combo_eligible: true,
  stock_qty: 0,
  sort_order: 0,
  features: [],
  specifications: {},
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: catData } = useCategories();
  const { data: prodData, isLoading: prodLoading } = useProduct(id);
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();

  useEffect(() => {
    const product = prodData?.product;
    if (!product) return;
    const tagsArr = Array.isArray(product.tags)
      ? product.tags
      : typeof product.tags === "string"
        ? product.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      short_description: product.short_description || "",
      description: product.description || "",
      price: product.price || "",
      actual_price: product.actual_price || "",
      discount_amount: product.discount_amount || "0",
      image: product.image || "",
      images: Array.isArray(product.images) ? product.images : [],
      video_url: product.video_url || "",
      category_id: product.category_id || product.category?.id || "",
      tags: tagsArr,
      in_stock: product.in_stock ?? true,
      is_featured: product.is_featured ?? false,
      is_combo_eligible: product.is_combo_eligible ?? true,
      stock_qty: product.stock_qty || 0,
      sort_order: product.sort_order || 0,
      features: Array.isArray(product.features) ? product.features : [],
      specifications:
        product.specifications &&
        typeof product.specifications === "object" &&
        !Array.isArray(product.specifications)
          ? product.specifications
          : {},
    });
    setSlugManual(true);
  }, [prodData]);

  const set = useCallback((k, v) => setForm((f) => ({ ...f, [k]: v })), []);

  useEffect(() => {
    if (!isEdit && !slugManual && form.name) set("slug", slugify(form.name));
  }, [form.name, isEdit, slugManual, set]);

  const handleSubmit = (e) => {
    e?.preventDefault();

    // ── Validation: thumbnail image is required
    if (!form.image) {
      alert(
        "প্রধান পণ্য ছবি (thumbnail) আপলোড করা আবশ্যক। মিডিয়া ট্যাবে গিয়ে ছবি যোগ করুন।",
      );
      setTab("media");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      actual_price: form.actual_price ? Number(form.actual_price) : null,
      discount_amount: Number(form.discount_amount) || 0,
      stock_qty: Number(form.stock_qty),
      sort_order: Number(form.sort_order) || 0,
    };
    if (isEdit) {
      updateMut.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          },
        },
      );
    } else {
      createMut.mutate(payload, { onSuccess: () => navigate("/products") });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;
  const error = createMut.error || updateMut.error;
  // Pricing: price = MRP, discount_amount = flat ৳ off, sellPrice = what customer pays
  const mrp = Number(form.price || 0);
  const discountAmt = Number(form.discount_amount || 0);
  const sellPrice = discountAmt > 0 ? Math.max(0, mrp - discountAmt) : mrp;
  const hasDiscount = discountAmt > 0 && mrp > 0;
  const discountPct = hasDiscount ? Math.round((discountAmt / mrp) * 100) : 0;
  // Admin profit preview (cost vs sell price)
  const profit =
    sellPrice > 0 && form.actual_price
      ? sellPrice - Number(form.actual_price)
      : null;

  const tabs = TABS(isEdit);

  if (isEdit && prodLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-6 w-48 rounded bg-slate-100 animate-pulse" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-[#e91e63]/30 hover:text-[#e91e63] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">
              {isEdit ? "পণ্য সম্পাদনা" : "নতুন পণ্য যোগ করুন"}
            </h1>
            {isEdit && form.name && (
              <p className="text-xs text-slate-400 mt-0.5">{form.name}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={`btn-primary disabled:opacity-60 ${saved ? "!bg-emerald-500 hover:!bg-emerald-600" : ""}`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> সংরক্ষিত!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error.response?.data?.message || "একটি ত্রুটি হয়েছে"}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {/* ── Main (left) ─────────────────────────────────────────────────── */}
          <div className="xl:col-span-3 space-y-4">
            <div className="card !p-0 overflow-hidden">
              {/* Tab bar */}
              <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/40 no-scrollbar">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex shrink-0 items-center gap-2 px-5 py-3.5 text-xs font-semibold transition-colors ${
                      tab === t.id
                        ? "border-b-2 border-[#e91e63] text-[#e91e63] bg-white"
                        : "text-slate-400 hover:text-slate-600 hover:bg-white/60"
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* ─── TAB: মূল তথ্য ─── */}
                {tab === "basic" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          পণ্যের নাম <span className="text-[#e91e63]">*</span>
                        </label>
                        <input
                          className="input"
                          placeholder="পণ্যের পূর্ণ নাম লিখুন"
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          required
                        />
                      </div>

                      {/* Bangla Name */}
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          বাংলা নাম{" "}
                          <span className="text-slate-400 font-normal">
                            (ঐচ্ছিক)
                          </span>
                        </label>
                        <input
                          className="input"
                          placeholder="বাংলায় পণ্যের নাম লিখুন..."
                          value={form.name_bn || ""}
                          onChange={(e) => set("name_bn", e.target.value)}
                        />
                        <p className="mt-1 text-[10px] text-slate-400">
                          না দিলে ইংরেজি নামই শপে দেখাবে
                        </p>
                      </div>

                      {/* Slug */}
                      <div className="sm:col-span-2">
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-600">
                            Slug (URL)
                          </label>
                          {!isEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                set("slug", slugify(form.name));
                                setSlugManual(false);
                              }}
                              className="text-[10px] text-[#e91e63] hover:underline"
                            >
                              নাম থেকে তৈরি করুন
                            </button>
                          )}
                        </div>
                        <input
                          className="input font-mono text-sm"
                          placeholder="product-url-slug"
                          value={form.slug}
                          onChange={(e) => {
                            set("slug", e.target.value);
                            setSlugManual(true);
                          }}
                        />
                        <p className="mt-1 text-[10px] text-slate-400">
                          products/
                          <span className="font-mono text-slate-600">
                            {form.slug || "product-slug"}
                          </span>
                        </p>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          ক্যাটাগরি <span className="text-[#e91e63]">*</span>
                        </label>
                        <select
                          className="input"
                          value={form.category_id}
                          onChange={(e) => set("category_id", e.target.value)}
                          required
                        >
                          <option value="">ক্যাটাগরি বেছে নিন</option>
                          {catData?.categories?.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Short Description */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                          সংক্ষিপ্ত বিবরণ
                        </label>
                        <input
                          className="input"
                          placeholder="এক লাইনে পণ্যের পরিচয়..."
                          value={form.short_description}
                          onChange={(e) =>
                            set("short_description", e.target.value)
                          }
                          maxLength={500}
                        />
                        <p className="mt-1 text-[10px] text-slate-400 text-right">
                          {form.short_description.length}/500
                        </p>
                      </div>
                    </div>

                    {/* ── Pricing ─────────────────────────────────────── */}
                    <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        মূল্য নির্ধারণ
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* MRP */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                            পণ্যের মূল্য (MRP){" "}
                            <span className="text-[#e91e63]">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                              ৳
                            </span>
                            <input
                              type="number"
                              step="any"
                              min={0}
                              required
                              className="input pl-8"
                              placeholder="0"
                              value={form.price}
                              onChange={(e) => set("price", e.target.value)}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            আসল বাজার মূল্য — ছাড় থাকলে কেটে দেখাবে
                          </p>
                        </div>

                        {/* Discount Amount */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                            ছাড়ের পরিমাণ (৳)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                              ৳
                            </span>
                            <input
                              type="number"
                              step="any"
                              min={0}
                              max={mrp || undefined}
                              className="input pl-8"
                              placeholder="0"
                              value={form.discount_amount}
                              onChange={(e) =>
                                set("discount_amount", e.target.value)
                              }
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">
                            ০ দিলে কোনো ছাড় নেই
                          </p>
                        </div>
                      </div>

                      {/* Sell Price Preview */}
                      <div
                        className={`rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
                          hasDiscount
                            ? "bg-emerald-50 border border-emerald-100"
                            : "bg-slate-50 border border-slate-100"
                        }`}
                      >
                        <div>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            শপে বিক্রয় মূল্য
                          </p>
                          <p
                            className={`text-xl font-black mt-0.5 ${hasDiscount ? "text-emerald-600" : "text-slate-700"}`}
                          >
                            ৳{sellPrice.toLocaleString()}
                          </p>
                          {hasDiscount && (
                            <p className="text-[10px] text-emerald-600 font-medium">
                              {discountPct}% ছাড় • গ্রাহক{" "}
                              {(mrp - sellPrice).toLocaleString()} টাকা বাঁচাবে
                            </p>
                          )}
                        </div>
                        {hasDiscount && (
                          <div className="text-right">
                            <p className="text-xs text-slate-400 line-through">
                              ৳{mrp.toLocaleString()}
                            </p>
                            <span className="inline-block rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black text-white">
                              -{discountPct}% ছাড়
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cost price — admin only */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2.5">
                        <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-amber-700">
                          ক্রয়মূল্য (৳)
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                            শুধু অ্যাডমিন
                          </span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                            ৳
                          </span>
                          <input
                            type="number"
                            step="any"
                            min={0}
                            className="input pl-8 bg-white border-amber-200 focus:border-amber-400"
                            placeholder="আপনার কেনার দাম"
                            value={form.actual_price}
                            onChange={(e) =>
                              set("actual_price", e.target.value)
                            }
                          />
                        </div>
                        {profit !== null && (
                          <p
                            className={`mt-1 text-[10px] font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                          >
                            লাভ: ৳
                            {profit.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {profit >= 0 ? "✅" : "⚠️"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        স্টক পরিমাণ
                      </label>
                      <input
                        type="number"
                        className="input"
                        placeholder="০"
                        value={form.stock_qty}
                        onChange={(e) => set("stock_qty", e.target.value)}
                        min={0}
                      />
                      <p className="mt-1 text-[10px] text-slate-400">
                        স্টক শেষ হলে স্বয়ংক্রিয়ভাবে "আউট অফ স্টক" দেখাবে
                      </p>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Tag className="h-3.5 w-3.5" /> ট্যাগ
                      </label>
                      <TagsInput
                        tags={form.tags}
                        onChange={(v) => set("tags", v)}
                      />
                    </div>
                  </div>
                )}

                {/* ─── TAB: বিবরণ ─── */}
                {tab === "desc" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      পণ্যের সম্পূর্ণ বিবরণ লিখুন। ফর্ম্যাটিং, শিরোনাম এবং ছবি
                      যোগ করতে পারবেন।
                    </p>
                    <RichEditor
                      value={form.description}
                      onChange={(v) => set("description", v)}
                    />
                    {form.description && (
                      <details className="rounded-xl border border-slate-100 overflow-hidden">
                        <summary className="cursor-pointer select-none bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700">
                          HTML প্রিভিউ দেখুন
                        </summary>
                        <div
                          className="p-4 text-sm text-slate-700 leading-relaxed prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: form.description }}
                        />
                      </details>
                    )}
                  </div>
                )}

                {/* ─── TAB: স্পেসিফিকেশন ─── */}
                {tab === "specs" && (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Sparkles className="h-3.5 w-3.5 text-[#e91e63]" />
                        ফিচার / বৈশিষ্ট্য
                        <span className="ml-1 rounded-full bg-[#e91e63]/10 px-2 py-0.5 text-[10px] text-[#e91e63]">
                          {form.features.length} টি
                        </span>
                      </label>
                      <FeaturesEditor
                        features={form.features}
                        onChange={(v) => set("features", v)}
                      />
                    </div>
                    <div className="border-t border-slate-100 pt-5">
                      <label className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Settings className="h-3.5 w-3.5 text-[#e91e63]" />
                        স্পেসিফিকেশন
                        <span className="ml-1 rounded-full bg-[#e91e63]/10 px-2 py-0.5 text-[10px] text-[#e91e63]">
                          {Object.keys(form.specifications).length} টি
                        </span>
                      </label>
                      <SpecificationsEditor
                        specs={form.specifications}
                        onChange={(v) => set("specifications", v)}
                      />
                    </div>
                  </div>
                )}

                {/* ─── TAB: মিডিয়া ─── */}
                {tab === "media" && (
                  <div className="space-y-4">
                    {/* Section 1: Main Image */}
                    <div
                      className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-5"
                      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e91e63]/10">
                            <ImageIcon className="h-4 w-4 text-[#e91e63]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              প্রধান পণ্য ছবি
                            </p>
                            <p className="text-[11px] text-slate-400">
                              শপে প্রধান ছবি হিসেবে দেখাবে
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-600">
                          <AlertCircle className="h-3 w-3" /> আবশ্যক
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                        <div>
                          <MediaInput
                            value={form.image}
                            onChange={(v) => set("image", v)}
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            label="প্রধান ছবি"
                            cropAspect={1}
                          />
                          {!form.image && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                              <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-red-500 leading-relaxed">
                                সেভ করার আগে অন্তত ১টি ছবি আপলোড করুন
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            প্রিভিউ
                          </p>
                          <ImagePreview
                            url={form.image}
                            aspectClass="aspect-square"
                          />
                          {form.image && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <p className="text-[11px] text-emerald-700 font-medium">
                                ছবি আপলোড সফল
                              </p>
                            </div>
                          )}
                          <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                            <p className="text-[10px] text-blue-500 leading-relaxed">
                              💡 ১:১ অনুপাতে ক্রপ — শপের ProductCardে সঠিকভাবে
                              দেখাবে
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Gallery */}
                    <div
                      className="rounded-2xl border border-slate-100 bg-white p-5"
                      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                            <Layers className="h-4 w-4 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              গ্যালারি ছবি
                            </p>
                            <p className="text-[11px] text-slate-400">
                              পণ্য পেজে সব ছবি দেখাবে
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                          <Layers className="h-3 w-3" /> {form.images.length} টি
                        </span>
                      </div>
                      <GalleryEditor
                        images={form.images}
                        onChange={(v) => set("images", v)}
                      />
                    </div>

                    {/* Section 3: Video */}
                    <div
                      className="rounded-2xl border border-slate-100 bg-white p-5"
                      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
                    >
                      <div className="mb-4 flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                          <Video className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            পণ্যের ভিডিও
                          </p>
                          <p className="text-[11px] text-slate-400">
                            MP4, WebM বা YouTube • ঐচ্ছিক
                          </p>
                        </div>
                      </div>
                      <VideoInput
                        value={form.video_url}
                        onChange={(v) => set("video_url", v)}
                      />
                    </div>
                  </div>
                )}

                {/* ─── TAB: রিভিউ ─── */}
                {tab === "reviews" && isEdit && <ReviewsTab productId={id} />}

                {/* ─── TAB: দৃশ্যমানতা ─── */}
                {tab === "visibility" && (
                  <div className="space-y-3">
                    {[
                      {
                        key: "in_stock",
                        label: "স্টকে আছে",
                        desc: "পণ্যটি কি বর্তমানে পাওয়া যাচ্ছে?",
                        colorOn: "bg-emerald-500",
                        icon: CheckCircle2,
                      },
                      {
                        key: "is_featured",
                        label: "ফিচার্ড পণ্য",
                        desc: "হোম পেজে ফিচার্ড সেকশনে দেখাবে",
                        colorOn: "bg-amber-400",
                        icon: Star,
                      },
                      {
                        key: "is_combo_eligible",
                        label: "কম্বো যোগ্য",
                        desc: "কম্বো অর্ডারে এই পণ্যটি নির্বাচন করা যাবে",
                        colorOn: "bg-[#e91e63]",
                        icon: Gift,
                      },
                    ].map(({ key, label, desc, colorOn, icon: Icon }) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between rounded-xl border px-4 py-4 transition-colors cursor-pointer ${
                          form[key]
                            ? "border-[#e91e63]/20 bg-pink-50/60"
                            : "border-slate-200 bg-slate-50/40"
                        }`}
                        onClick={() => set(key, !form[key])}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${form[key] ? "bg-[#e91e63]/10" : "bg-slate-100"}`}
                          >
                            <Icon
                              className={`h-5 w-5 ${form[key] ? "text-[#e91e63]" : "text-slate-400"}`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0f172a]">
                              {label}
                            </p>
                            <p className="text-xs text-slate-400">{desc}</p>
                          </div>
                        </div>
                        <Toggle
                          checked={form[key]}
                          onChange={() => set(key, !form[key])}
                          colorOn={colorOn}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pb-4">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="btn-outline"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`btn-primary disabled:opacity-60 ${saved ? "!bg-emerald-500 hover:!bg-emerald-600" : ""}`}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> সংরক্ষিত!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Right Sidebar ───────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Product Preview */}
            <div className="card !p-0 overflow-hidden rounded-2xl">
              <ImagePreview url={form.image} aspectClass="aspect-square" />
              {form.name && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-sm font-bold text-[#0f172a] line-clamp-2">
                    {form.name}
                  </p>
                  {form.category_id && catData && (
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      {catData.categories?.find(
                        (c) => String(c.id) === String(form.category_id),
                      )?.name || ""}
                    </span>
                  )}
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    {mrp > 0 && (
                      <span className="font-bold text-[#e91e63]">
                        ৳{sellPrice.toLocaleString()}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through">
                        ৳{mrp.toLocaleString()}
                      </span>
                    )}
                    {discountPct > 0 && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        -{discountPct}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Summary card */}
            <div className="card space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                সারসংক্ষেপ
              </p>
              {[
                {
                  label: "প্রধান ছবি",
                  value: form.image ? "আছে ✅" : "নেই",
                  on: !!form.image,
                },
                {
                  label: "বিবরণ",
                  value: form.description ? "লেখা আছে ✅" : "নেই",
                  on: !!form.description,
                },
                {
                  label: "গ্যালারি",
                  value: `${form.images.length} টি`,
                  on: form.images.length > 0,
                },
                {
                  label: "ভিডিও",
                  value: form.video_url ? "আছে 🎬" : "নেই",
                  on: !!form.video_url,
                },
                {
                  label: "ফিচার",
                  value: `${form.features.length} টি`,
                  on: form.features.length > 0,
                },
                {
                  label: "স্পেক",
                  value: `${Object.keys(form.specifications).length} টি`,
                  on: Object.keys(form.specifications).length > 0,
                },
                {
                  label: "ট্যাগ",
                  value: `${form.tags.length} টি`,
                  on: form.tags.length > 0,
                },
                {
                  label: "স্টক",
                  value: form.in_stock ? "আছে ✅" : "নেই ❌",
                  on: form.in_stock,
                },
                {
                  label: "ফিচার্ড",
                  value: form.is_featured ? "হ্যাঁ ⭐" : "না",
                  on: form.is_featured,
                },
              ].map(({ label, value, on }) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-500">{label}</span>
                  <span
                    className={`font-semibold ${on ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick navigation */}
            <div className="card space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                ট্যাবে যান
              </p>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? "bg-[#e91e63]/10 text-[#e91e63]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5 shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
