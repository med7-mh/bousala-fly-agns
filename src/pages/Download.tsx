import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Monitor,
  Smartphone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";

export default function DownloadPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/landing")}
          >
            <img
              src="/logo.svg"
              alt="بوصلة"
              className="w-10 h-10 shadow-sm rounded-xl"
            />
            <span className="text-2xl font-extrabold text-emerald-900 tracking-tight">
              بوصله
            </span>
          </div>
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
          >
            العودة للرئيسية <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Download className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            تحميل تطبيق بوصلة
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            يمكنك تثبيت نظام بوصلة على جهازك كبرنامج مُستقل للوصول السريع بدون
            الحاجة لفتح المتصفح في كل مرة.
          </p>
        </motion.div>

        {isInstalled ? (
          <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">
              التطبيق مثبت بالفعل!
            </h2>
            <p className="text-emerald-700 mb-6">
              يمكنك الآن فتحه مباشرة من قائمة التطبيقات في جهازك.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              الذهاب إلى لوحة التحكم
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Install Button Wrapper (If Supported) */}
            {deferredPrompt && (
              <div className="md:col-span-2 bg-emerald-600 text-white p-8 rounded-3xl shadow-lg shadow-emerald-600/20 text-center mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-right">
                  <h3 className="text-2xl font-bold mb-2">تثبيت بنقرة واحدة</h3>
                  <p className="text-emerald-100">
                    جهازك يدعم التثبيت المباشر. اضغط على الزر لتثبيت التطبيق
                    الآن.
                  </p>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-extrabold text-lg shadow-md hover:bg-emerald-50 transition w-full md:w-auto shrink-0"
                >
                  تثبيت التطبيق الآن
                </button>
              </div>
            )}

            {/* Desktop Instructions */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <Monitor className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                على جهاز الكمبيوتر
              </h3>
              <ul className="space-y-4 text-slate-600">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    1
                  </span>
                  <span>
                    افتح هذا الرابط باستخدام متصفح{" "}
                    <strong>Google Chrome</strong> أو Edge.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    2
                  </span>
                  <span>
                    في شريط العنوان بالأعلى، ابحث عن أيقونة التثبيت{" "}
                    <Download className="w-4 h-4 inline mx-1" /> في زاوية
                    الشريط.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    3
                  </span>
                  <span>
                    اضغط على الأيقونة ثم اختر <strong>تثبيت (Install)</strong>.
                    سيظهر التطبيق على سطح المكتب.
                  </span>
                </li>
              </ul>
            </div>

            {/* Mobile Instructions */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <Smartphone className="w-12 h-12 text-purple-500 mb-6" />
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                على الهاتف المحمول
              </h3>
              <ul className="space-y-4 text-slate-600">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    1
                  </span>
                  <span>افتح المتصفح (سفاري للآيفون، كروم للأندرويد).</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    2
                  </span>
                  <span>
                    اضغط على زر المشاركة () في سفاري، أو القائمة (⋮) في كروم.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    3
                  </span>
                  <span>
                    اختر{" "}
                    <strong>
                      إضافة إلى الشاشة الرئيسية (Add to Home Screen)
                    </strong>{" "}
                    ➕.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
