import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { Save } from "lucide-react";
import api from "../lib/api";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [msg, setMsg] = useState(null);

  const mut = useMutation({
    mutationFn: () =>
      api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      setMsg({ type: "success", text: "পাসওয়ার্ড পরিবর্তন হয়েছে" });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) =>
      setMsg({
        type: "error",
        text: err.response?.data?.message || "ত্রুটি হয়েছে",
      }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: "error", text: "পাসওয়ার্ড মিলছে না" });
      return;
    }
    if (form.newPassword.length < 6) {
      setMsg({ type: "error", text: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে" });
      return;
    }
    setMsg(null);
    mut.mutate();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#0f172a]">সেটিংস</h1>

      {/* Profile Info */}
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-[#0f172a]">
          অ্যাডমিন প্রোফাইল
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#e91e63] to-pink-400 text-xl font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-[#0f172a]">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className="badge mt-1 bg-[#e91e63]/10 text-[#e91e63]">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-[#0f172a]">
          পাসওয়ার্ড পরিবর্তন
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: "currentPassword", label: "বর্তমান পাসওয়ার্ড" },
            { key: "newPassword", label: "নতুন পাসওয়ার্ড" },
            { key: "confirmPassword", label: "পাসওয়ার্ড নিশ্চিত করুন" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {label}
              </label>
              <input
                type="password"
                className="input"
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                required
              />
            </div>
          ))}
          {msg && (
            <p
              className={`text-xs rounded-xl px-3 py-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
            >
              {msg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={mut.isPending}
            className="btn-primary"
          >
            <Save className="h-4 w-4" />{" "}
            {mut.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}
