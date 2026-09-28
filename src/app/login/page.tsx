"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ការចូលប្រព័ន្ធមិនជោគជ័យ សូមព្យាយាមម្តងទៀត");
        return;
      }

      // Navigate directly to dashboard root after successful login
      router.push("/");
      router.refresh();
    } catch {
      setError("មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើបានទេ សូមពិនិត្យអ៊ីនធឺណិត");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcf9f5] via-[#faf6ef] to-[#f4ebe1] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl shadow-amber-900/10 mb-2 ring-4 ring-amber-400/30 p-1.5 overflow-hidden">
            <img src="/logo.png" alt="VANN SITHA TRADING" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center justify-center gap-2 flex-wrap">
            <span className="bg-gradient-to-r from-[#ea580c] via-[#f59e0b] to-[#eab308] bg-clip-text text-transparent drop-shadow-xs">
              VANN SITHA
            </span>
            <span className="bg-gradient-to-r from-[#ea580c] to-[#f59e0b] bg-clip-text text-transparent">
              AI SALE
            </span>
          </h1>
          <p className="text-amber-900/70 text-sm font-semibold">
            ប្រព័ន្ធគ្រប់គ្រងការលក់ និង CRM ឆ្លាតវៃ (Owner Portal)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-9 shadow-2xl shadow-amber-900/10 border border-amber-200/80 space-y-6">
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              ចូលគ្រប់គ្រងប្រព័ន្ធ
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              សូមបញ្ចូលគណនី Owner ដើម្បីចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4.5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ឈ្មោះអ្នកប្រើប្រាស់ (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-3 focus:ring-amber-500/20 text-slate-900 text-sm outline-none transition placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ពាក្យសម្ងាត់ (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-3 focus:ring-amber-500/20 text-slate-900 text-sm outline-none transition placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm sm:text-base rounded-xl transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>កំពុងផ្ទៀងផ្ទាត់...</span>
              ) : (
                <>
                  <span>ចូលប្រព័ន្ធ</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ប្រព័ន្ធផ្ទៀងផ្ទាត់សុវត្ថិភាពគណនី Owner</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-slate-500 text-xs">
          © 2026 VANN SITHA. រក្សាសិទ្ធិគ្រប់យ៉ាង។
        </div>
      </div>
    </div>
  );
}
