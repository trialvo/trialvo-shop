"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, ShoppingCart, Phone } from "lucide-react";

export default function CheckoutFailedPage() {
 return (
  <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-4">
   <div className="w-full max-w-md">
    <div className="rounded-3xl bg-white shadow-xl overflow-hidden">
     {/* Top banner */}
     <div className="bg-gradient-to-br from-red-600 to-rose-700 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
       <XCircle className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-white">অর্ডার সফল হয়নি</h1>
      <p className="mt-2 text-sm text-red-100">
       দুঃখিত, অর্ডার প্রক্রিয়া করতে সমস্যা হয়েছে।
      </p>
     </div>

     {/* Body */}
     <div className="p-6 space-y-4">
      <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
       <p className="font-semibold mb-1">কী করবেন?</p>
       <ul className="space-y-1 text-xs list-disc pl-4 text-red-600">
        <li>আবার চেষ্টা করুন — তথ্য সঠিক কিনা চেক করুন</li>
        <li>ইন্টারনেট সংযোগ নিশ্চিত করুন</li>
        <li>সমস্যা থাকলে আমাদের সাথে যোগাযোগ করুন</li>
       </ul>
      </div>

      <div className="flex flex-col gap-3">
       <Link
        href="/cart"
        className="flex items-center justify-center gap-2 rounded-xl bg-[#0f172a] py-3 text-sm font-semibold text-white hover:bg-[#e91e63] transition-all"
       >
        <ShoppingCart className="h-4 w-4" /> কার্টে ফিরুন ও আবার চেষ্টা করুন
       </Link>
       <Link
        href="/"
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:border-[#e91e63] hover:text-[#e91e63] transition-all"
       >
        <ArrowLeft className="h-4 w-4" /> হোমে ফিরুন
       </Link>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}
