import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useStore } from "../store/useStore";
import { supabase } from "../lib/supabase";
import { Compass, Lock, Phone } from "lucide-react";

export default function Login() {
  const user = useStore((state) => state.user);
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const dummyEmail = `222${phone}@bosla.app`;

      // 1. Auth Setup with Timeout
      const loginSetup = supabase.auth.signInWithPassword({
        email: dummyEmail,
        password,
      });

      // strict timeout for network anomalies
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 30000),
      );

      const response: any = await Promise.race([loginSetup, timeoutPromise]);
      const { data, error: authError } = response || {};

      if (authError) throw authError;
      if (!data || !data.user) throw new Error("لم يتم إرجاع بيانات المستخدم");

      // 2. Profile Fetch
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "*, agencies(created_at, subscription_plan, subscription_expires_at)",
        )
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        // If profile is missing (RLS issue during signup)
        if (profileError.code === "PGRST116") {
          throw new Error("NO_PROFILE");
        }
        throw profileError;
      }

      const agencyInfo = Array.isArray(profileData.agencies)
        ? profileData.agencies[0]
        : (profileData.agencies as any);

      login({
        id: profileData.id,
        agency_id: profileData.agency_id,
        name: profileData.full_name,
        role: profileData.role,
        email: data.user.email,
        subscriptionPlan: agencyInfo?.subscription_plan || "free",
        subscriptionExpiresAt: agencyInfo?.subscription_expires_at || null,
        agencyCreatedAt: agencyInfo?.created_at || new Date().toISOString(),
      });

      navigate("/");
    } catch (err: any) {
      console.error("Login exception:", err);
      let errorMessage =
        "حدث خطأ غير متوقع أثناء الاتصال بالخادم. حاول مجدداً.";

      if (err.message === "TIMEOUT") {
        errorMessage =
          "الخادم يستغرق وقتاً طويلاً. يرجى التحقق من اتصال الإنترنت، أو سجلات Supabase.";
      } else if (err.message === "NO_PROFILE") {
        errorMessage =
          "يبدو أن هذا الحساب قد تم إنشاؤه في وقت كان فيه النظام يواجه مشكلة في حفظ ملفات الوكالة. يرجى إنشاء حساب جديد برقم جوال آخر، أو مطالبة الدعم بحذف هذا الرقم.";
        // Ensure they are completely signed out of the broken state
        supabase.auth.signOut().catch(() => {});
      } else if (err.message) {
        if (err.message.includes("Invalid login credentials")) {
          errorMessage = "رقم الهاتف أو كلمة المرور غير صحيحة";
        } else if (err.message.includes("Email not confirmed")) {
          errorMessage = "يرجى تفعيل الحساب عبر البريد الإلكتروني";
        } else if (err.message.includes("Failed to fetch")) {
          errorMessage =
            "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">نظام بوصلة</h1>
          <p className="text-slate-400 text-sm">لإدارة وكالات السفر والسياحة</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-2">
                رقم الهاتف الجوال
              </label>
              <div
                className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 bg-slate-50 focus-within:bg-white transition-colors"
                dir="ltr"
              >
                <div className="bg-slate-100/50 px-3 flex items-center justify-center border-r border-slate-200 text-slate-500 font-bold text-sm">
                  +222
                </div>
                <div className="relative flex-1">
                  <input
                    type="tel"
                    required
                    maxLength={8}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full bg-transparent pl-10 pr-4 py-3 focus:outline-none text-sm tracking-widest"
                    placeholder="4XXXXXXX"
                  />
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
            >
              {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500 flex flex-col gap-2">
              <span>وكالة جديدة؟</span>
              <button
                onClick={() => navigate("/signup")}
                className="text-emerald-600 font-bold hover:underline"
              >
                إنشاء حساب وكالة
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
