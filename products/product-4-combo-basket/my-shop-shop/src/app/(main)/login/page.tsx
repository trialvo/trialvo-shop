"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { useShopLogin, useShopRegister } from "@/api/auth";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loginMutation = useShopLogin();
  const registerMutation = useShopRegister();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const benefits = [
    "অর্ডার ট্র্যাক করুন সহজেই",
    "Wishlist সংরক্ষণ করুন",
    "এক্সক্লুসিভ ডিসকাউন্ট পান",
    "দ্রুত চেকআউট করুন",
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(loginForm);
      router.push("/account");
    } catch {
      // error shown via loginMutation.error
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) return;
    try {
      await registerMutation.mutateAsync({
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      });
      router.push("/account");
    } catch {
      // error shown via registerMutation.error
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="shadow-card grid min-h-[580px] grid-cols-1 overflow-hidden rounded-3xl lg:grid-cols-2">
          {/* Left — Brand Panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#e91e63]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e91e63]">
                  <span className="text-sm font-bold text-white">M</span>
                </div>
                <span className="text-lg font-bold text-white">
                  My<span className="text-[#e91e63]">Shop</span>
                </span>
              </Link>
              <h2 className="mt-10 text-3xl leading-tight font-bold text-white">
                আপনার প্রিমিয়াম
                <br />
                <span className="text-[#e91e63]">শপিং অভিজ্ঞতা</span>
                <br />
                শুরু হোক আজই
              </h2>
              <p className="mt-4 text-sm text-slate-400">
                অ্যাকাউন্ট তৈরি করুন এবং হাজারো পণ্য থেকে বেছে নিন সেরাটি।
              </p>
            </div>

            <div className="relative space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e91e63]/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#e91e63]" />
                  </div>
                  <span className="text-sm text-slate-300">{b}</span>
                </div>
              ))}
              <div className="mt-6 border-t border-white/10 pt-6">
                <p className="flex items-center gap-2 text-[10px] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  আপনার তথ্য সম্পূর্ণ নিরাপদ ও সুরক্ষিত
                </p>
              </div>
            </div>
          </div>

          {/* Right — Form Panel */}
          <div className="flex flex-col justify-center bg-white p-8 sm:p-10">
            {/* Tab Switcher */}
            <div className="mb-8 flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setTab("login")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${tab === "login"
                  ? "bg-white text-[#0f172a] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <LogIn className="h-4 w-4" />
                লগইন
              </button>
              <button
                onClick={() => setTab("register")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${tab === "register"
                  ? "bg-white text-[#0f172a] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <UserPlus className="h-4 w-4" />
                রেজিস্ট্রেশন
              </button>
            </div>

            {/* ─── Login Form ─── */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="animate-fade-in-up space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#0f172a]">স্বাগতম ফিরে!</h2>
                  <p className="mt-1 text-xs text-slate-400">আপনার অ্যাকাউন্টে লগইন করুন</p>
                </div>

                {loginMutation.error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {loginMutation.error.message}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">ইমেইল</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="input-field pl-10 pr-4"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">পাসওয়ার্ড</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="input-field pr-10 pl-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="btn-pink flex w-full items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-70"
                >
                  <LogIn className="h-4 w-4" />
                  {loginMutation.isPending ? "লগইন হচ্ছে..." : "লগইন করুন"}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-center text-xs text-slate-400">
                  অ্যাকাউন্ট নেই?{" "}
                  <button type="button" onClick={() => setTab("register")} className="font-semibold text-[#e91e63] hover:underline">
                    রেজিস্ট্রেশন করুন
                  </button>
                </p>
              </form>
            )}

            {/* ─── Register Form ─── */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="animate-fade-in-up space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0f172a]">অ্যাকাউন্ট তৈরি করুন</h2>
                  <p className="mt-1 text-xs text-slate-400">একটি অ্যাকাউন্ট — অসীম সুবিধা</p>
                </div>

                {registerMutation.error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {registerMutation.error.message}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">নাম</label>
                    <div className="relative">
                      <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="আপনার নাম"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="input-field pl-10 pr-4"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">ফোন</label>
                    <div className="relative">
                      <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className="input-field pl-10 pr-4"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">ইমেইল</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="input-field pl-10 pr-4"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">পাসওয়ার্ড</label>
                    <div className="relative">
                      <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="input-field pr-10 pl-10"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">নিশ্চিত করুন</label>
                    <div className="relative">
                      <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="input-field pr-10 pl-10"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {registerForm.password && registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                  <p className="text-xs text-red-500">পাসওয়ার্ড মিলছে না</p>
                )}

                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={registerForm.agree}
                    onChange={(e) => setRegisterForm({ ...registerForm, agree: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded accent-[#e91e63]"
                    required
                  />
                  <span className="text-xs text-slate-500">
                    আমি{" "}
                    <Link href="#" className="text-[#e91e63] hover:underline">Terms of Service</Link>
                    {" "}এবং{" "}
                    <Link href="#" className="text-[#e91e63] hover:underline">Privacy Policy</Link>
                    {" "}মেনে নিচ্ছি
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={registerMutation.isPending || registerForm.password !== registerForm.confirmPassword}
                  className="btn-pink flex w-full items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-70"
                >
                  <UserPlus className="h-4 w-4" />
                  {registerMutation.isPending ? "তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="text-center text-xs text-slate-400">
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                  <button type="button" onClick={() => setTab("login")} className="font-semibold text-[#e91e63] hover:underline">লগইন করুন</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
