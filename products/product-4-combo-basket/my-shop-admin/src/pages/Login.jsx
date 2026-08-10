import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (!data.success || !data.admin) {
        setError("Admin অ্যাক্সেস নেই");
        return;
      }
      login(data.token, data.admin);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড চেক করুন।",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#0b0f1e" }}>
      {/* Left — Brand Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0f172a 0%, #1a0a2e 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #e91e63 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
            style={{ background: "linear-gradient(135deg, #e91e63, #f06292)" }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">
              ComboBasket
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Admin Panel
            </p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e91e63] animate-pulse" />
            <span className="text-xs font-medium text-pink-300">
              ব্যবসা পরিচালনা করুন
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            আপনার শপ
            <br />
            <span style={{ color: "#e91e63" }}>সম্পূর্ণ নিয়ন্ত্রণে</span>
            <br />
            রাখুন।
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            অর্ডার, পণ্য, গ্রাহক এবং আরও অনেক কিছু একটি প্যানেল থেকে পরিচালনা
            করুন।
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: "অর্ডার ট্র্যাকিং", sub: "রিয়েল-টাইম" },
              { label: "বিশ্লেষণ", sub: "ড্যাশবোর্ড" },
              { label: "গ্রাহক ম্যানেজ", sub: "সহজে" },
              { label: "ফ্র্যাড সুরক্ষা", sub: "স্বয়ংক্রিয়" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-xl p-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-xs font-semibold text-white">{f.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-600 relative z-10">
          © 2025 ComboBasket. সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #e91e63, #f06292)" }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <p className="text-lg font-bold text-white">ComboBasket Admin</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-5 flex items-center justify-center rounded-full bg-emerald-500/15">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-400">
                Secure Login
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">স্বাগতম! 👋</h2>
            <p className="mt-1 text-sm text-slate-500">
              Admin প্যানেলে লগইন করুন
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-slate-400">
                ইমেইল ঠিকানা
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@combobasket.com"
                  className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#e91e63";
                    e.target.style.boxShadow = "0 0 0 3px rgba(233,30,99,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-slate-400">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border pl-10 pr-11 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#e91e63";
                    e.target.style.boxShadow = "0 0 0 3px rgba(233,30,99,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs text-red-400"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: "linear-gradient(135deg, #e91e63, #f06292)",
                boxShadow: "0 4px 16px rgba(233,30,99,0.3)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> লগইন হচ্ছে...
                </>
              ) : (
                "লগইন করুন →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
