"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import config from "../config";

const API_URL = config.apiUrl;

export default function NewsletterForm() {
 const [email, setEmail] = useState("");
 const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
 const [message, setMessage] = useState("");

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email.trim()) return;

  setStatus("loading");
  try {
   const res = await fetch(`${API_URL}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
   });
   const data = await res.json();
   if (data.success) {
    setStatus("success");
    setMessage(data.message || "সাবস্ক্রাইব সফল হয়েছে! 🎉");
    setEmail("");
   } else {
    setStatus("error");
    setMessage(data.message || "কিছু একটা ভুল হয়েছে।");
   }
  } catch {
   setStatus("error");
   setMessage("সার্ভারে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।");
  }

  // Reset after 4s
  setTimeout(() => setStatus("idle"), 4000);
 };

 return (
  <div className="mt-8 rounded-xl bg-white/5 p-4">
   <p className="mb-3 flex items-center gap-2 text-xs font-medium text-white/80">
    <Mail className="h-3.5 w-3.5 text-[#e91e63]" />
    অফার পেতে সাবস্ক্রাইব করুন
   </p>

   {status === "success" ? (
    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-400">
     <CheckCircle className="h-3.5 w-3.5 shrink-0" />
     {message}
    </div>
   ) : status === "error" ? (
    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-400">
     <AlertCircle className="h-3.5 w-3.5 shrink-0" />
     {message}
    </div>
   ) : (
    <form onSubmit={handleSubmit} className="flex gap-2">
     <input
      type="email"
      placeholder="ইমেইল"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      disabled={status === "loading"}
      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white placeholder-slate-500 transition-colors outline-none focus:border-[#e91e63]/40 disabled:opacity-50"
     />
     <button
      type="submit"
      disabled={status === "loading"}
      className="flex items-center gap-1 rounded-lg bg-[#e91e63] px-3.5 py-2.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#d81b60] disabled:opacity-60"
     >
      {status === "loading" ? (
       <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
       <>যোগ দিন <ArrowRight className="h-3 w-3" /></>
      )}
     </button>
    </form>
   )}
  </div>
 );
}
