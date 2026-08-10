import { useState } from "react";
import {
  Video,
  Link,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  Play,
  Info,
} from "lucide-react";

const DEFAULT_VIDEOS = [
  { id: 1, title: "হোমপেজ হিরো ভিডিও", url: "", enabled: true },
];

export default function BannerVideo() {
  const [videos, setVideos] = useState(DEFAULT_VIDEOS);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addVideo = () => {
    setVideos((p) => [
      ...p,
      { id: Date.now(), title: "নতুন ভিডিও", url: "", enabled: true },
    ]);
  };

  const updateVideo = (id, field, value) =>
    setVideos((p) =>
      p.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );

  const removeVideo = (id) => setVideos((p) => p.filter((v) => v.id !== id));

  const toggleVideo = (id) =>
    setVideos((p) =>
      p.map((v) => (v.id === id ? { ...v, enabled: !v.enabled } : v)),
    );

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    return url;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">ব্যানার ভিডিও</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            হোমপেজে ভিডিও ব্যানার ম্যানেজ করুন
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`btn-primary ${saved ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              সংরক্ষিত!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              সংরক্ষণ করুন
            </>
          )}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-4">
          <Info className="h-3.5 w-3.5 shrink-0" />
          YouTube URL, MP4 সরাসরি লিংক, বা ক্লাউড স্টোরেজ URL সাপোর্ট করা হয়
        </div>

        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`rounded-xl border p-4 space-y-3 transition-all ${video.enabled ? "border-slate-200" : "border-slate-100 bg-slate-50/50 opacity-60"}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 shrink-0">
                  <Video className="h-4.5 w-4.5 text-rose-500" />
                </div>
                <input
                  className="input flex-1 font-medium"
                  placeholder="ভিডিওর টাইটেল"
                  value={video.title}
                  onChange={(e) =>
                    updateVideo(video.id, "title", e.target.value)
                  }
                />
                <button
                  onClick={() => toggleVideo(video.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${video.enabled ? "bg-[#e91e63]" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${video.enabled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
                <button
                  onClick={() => removeVideo(video.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="input pl-9"
                    placeholder="https://youtube.com/watch?v=... বা MP4 URL"
                    value={video.url}
                    onChange={(e) =>
                      updateVideo(video.id, "url", e.target.value)
                    }
                  />
                </div>
                {video.url && (
                  <button
                    onClick={() =>
                      setPreview(preview === video.id ? null : video.id)
                    }
                    className="btn-outline !px-3"
                    title="Preview"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
              </div>

              {preview === video.id && video.url && (
                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                  {getEmbedUrl(video.url)?.includes("youtube") ? (
                    <iframe
                      src={getEmbedUrl(video.url)}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={video.url} controls className="w-full h-full" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addVideo}
          className="btn-outline w-full mt-4 justify-center border-dashed"
        >
          <Plus className="h-4 w-4" /> নতুন ভিডিও যোগ করুন
        </button>
      </div>
    </div>
  );
}
