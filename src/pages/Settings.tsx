import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useStore, User } from "../store/useStore";
import toast from "react-hot-toast";
import {
  Shield,
  Users,
  Save,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Plus,
  CreditCard,
} from "lucide-react";
import { t } from "../lib/translations";
import { formatCurrency } from "../lib/utils";

interface Profile extends User {} // reuse user type

export default function Settings() {
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"manager" | "staff">(
    "staff",
  );
  const [newCustomServiceType, setNewCustomServiceType] = useState("");
  const [newCustomPaymentMethod, setNewCustomPaymentMethod] = useState("");
  const {
    user,
    transactions,
    bookings,
    language,
    staffMembers,
    addStaff,
    removeStaff,
    customBookingTypes,
    addCustomBookingType,
    removeCustomBookingType,
    customPaymentMethods,
    addCustomPaymentMethod,
    removeCustomPaymentMethod,
  } = useStore();

  const handleAddCustomServiceType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomServiceType.trim()) {
      addCustomBookingType(newCustomServiceType.trim());
      setNewCustomServiceType("");
    }
  };

  const handleAddCustomPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomPaymentMethod.trim()) {
      addCustomPaymentMethod(newCustomPaymentMethod.trim());
      setNewCustomPaymentMethod("");
    }
  };

  const handleAddLocalStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffName.trim() && newStaffPin.length === 4) {
      addStaff(newStaffName.trim(), newStaffPin, newStaffRole);
      setNewStaffName("");
      setNewStaffPin("");
      setNewStaffRole("staff");
    } else if (newStaffPin.length !== 4) {
      toast.error("الرمز السري يجب أن يكون 4 أرقام");
    }
  };
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [couponCode, setCouponCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchProfiles();
    }
  }, [user]);

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsRedeeming(true);
    try {
      // 1. Validate Coupon
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim())
        .single();

      if (couponError || !coupon) {
        toast.error("الرمز غير صحيح أو غير موجود");
        setIsRedeeming(false);
        return;
      }
      if (coupon.is_used) {
        toast.error("تم استخدام هذا الرمز من قبل");
        setIsRedeeming(false);
        return;
      }

      // Calculate new expiry date based on type
      let days = 0;
      if (coupon.type === "monthly") days = 30;
      else if (coupon.type === "yearly") days = 365;

      const currentExpiry = user?.subscriptionExpiresAt
        ? new Date(user.subscriptionExpiresAt)
        : new Date();
      // If already expired, start from today
      const startDate = currentExpiry < new Date() ? new Date() : currentExpiry;
      const newExpiryDate = new Date(startDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + days);

      // 2. Update Agency
      const { error: agencyUpdateError } = await supabase
        .from("agencies")
        .update({
          subscription_plan: "premium",
          subscription_expires_at: newExpiryDate.toISOString(),
        })
        .eq("id", user?.agency_id);

      if (agencyUpdateError) throw agencyUpdateError;

      // 3. Mark coupon as used
      const { error: markError } = await supabase
        .from("coupons")
        .update({
          is_used: true,
          used_by_agency: user?.agency_id,
          used_at: new Date().toISOString(),
        })
        .eq("id", coupon.id);

      if (markError) {
        console.warn("Failed to mark coupon as used:", markError);
        // not a critical error if agency is already updated but we should handle it
      }

      toast.success("تم تفعيل الاشتراك بنجاح!");
      setCouponCode("");

      // Update local state by forcing a re-login
      if (user) {
        useStore.getState().login({
          ...user,
          subscriptionPlan: "premium",
          subscriptionExpiresAt: newExpiryDate.toISOString(),
        });
      }
    } catch (err: any) {
      console.error("Redeem error:", err);
      toast.error("حدث خطأ أثناء تفعيل الاشتراك");
    } finally {
      setIsRedeeming(false);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("agency_id", user?.agency_id);
    if (!error && data) {
      setProfiles(
        data.map((p) => ({
          id: p.id,
          agency_id: p.agency_id,
          name: p.full_name,
          role: p.role,
        })),
      );
    }
  };

  const updateRole = async (profileId: string, newRole: "admin" | "agent") => {
    const toastId = toast.loading("جاري تحديث الصلاحيات...");
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);
    if (!error) {
      toast.success("تم التحديث بنجاح", { id: toastId });
      fetchProfiles();
    } else {
      toast.error("حدث خطأ أثناء التحديث", { id: toastId });
    }
  };

  // Generate Daily Report
  const dailyTransactions = transactions.filter(
    (t) => t.date && t.date.startsWith(reportDate),
  );
  const dailyBookings = bookings.filter(
    (b) => b.created_at && b.created_at.startsWith(reportDate),
  );

  const dailyIncome = dailyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyExpense = dailyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyProfit = dailyBookings.reduce(
    (sum, b) => sum + (b.selling_price - b.cost_price),
    0,
  );

  if (user?.role !== "admin") {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-slate-500"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <ShieldAlert className="w-16 h-16 mb-4 text-red-300" />
        <h2 className="text-xl font-bold">{t("no_access_title", language)}</h2>
        <p>{t("no_access_desc", language)}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-8 w-full max-w-5xl mx-auto"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">
          {t("agency_settings", language)}
        </h1>
        <p className="text-slate-500 text-sm">{t("settings_desc", language)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="flex flex-col gap-8">
          {/* Subscription & Coupon */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-slate-800">
                  الاشتراك والباقات
                </h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  إدارة اشتراك الوكالة الخاص بك
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  حالة الاشتراك
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-md text-[13px] font-bold ${
                      user?.subscriptionPlan === "premium"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {user?.subscriptionPlan === "premium"
                      ? "باقة مدفوعة"
                      : "باقة مجانية"}
                  </span>
                  {user?.subscriptionExpiresAt && (
                    <span className="text-sm text-slate-500">
                      صالح حتى:{" "}
                      <span className="font-semibold text-slate-700" dir="ltr">
                        {new Date(
                          user.subscriptionExpiresAt,
                        ).toLocaleDateString("en-GB")}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleRedeemCoupon} className="flex flex-col gap-3">
              <label className="block text-[13px] font-bold text-slate-700">
                تفعيل قسيمة اشتراك
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="أدخل الرمز هنا (مثال: BOSLA-ABC1234)"
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={!couponCode.trim() || isRedeeming}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-bold transition-all shrink-0"
                >
                  {isRedeeming ? "جاري التفعيل..." : "تفعيل"}
                </button>
              </div>
            </form>
          </div>

          {/* Real User Management */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">
                {t("account_management", language)}
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {profile.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">
                        {profile.name}
                      </h3>
                      <p className="text-[12px] text-slate-500">
                        {profile.role === "admin"
                          ? t("general_manager", language)
                          : t("sales_agent", language)}
                      </p>
                    </div>
                  </div>
                  {profile.id !== user?.id ? (
                    <select
                      value={profile.role}
                      onChange={(e) =>
                        updateRole(
                          profile.id,
                          e.target.value as "admin" | "agent",
                        )
                      }
                      className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white"
                    >
                      <option value="agent">
                        {t("sales_agent", language)}
                      </option>
                      <option value="admin">
                        {t("general_manager", language)}
                      </option>
                    </select>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-medium text-xs rounded-lg whitespace-nowrap">
                      {t("current_account", language)}
                    </span>
                  )}
                </div>
              ))}

              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-[13px] text-slate-600">
                <span className="font-bold block mb-1">💡 وصول الموظفين</span>
                {t("staff_access_tip", language)}
              </div>
            </div>
          </div>

          {/* Local POS Staff Management */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-slate-800">
                  {t("pos_staff", language)}
                </h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  {t("pos_staff_desc", language)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <form
                onSubmit={handleAddLocalStaff}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder={t("staff_name", language)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm disabled:bg-slate-50"
                  />
                  <select
                    value={newStaffRole}
                    onChange={(e) =>
                      setNewStaffRole(e.target.value as "manager" | "staff")
                    }
                    className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="staff">{t("normal_staff", language)}</option>
                    <option value="manager">
                      {t("staff_manager", language)}
                    </option>
                  </select>
                  <input
                    type="password"
                    maxLength={4}
                    value={newStaffPin}
                    onChange={(e) =>
                      setNewStaffPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder={t("pin_code_placeholder", language)}
                    className="w-full sm:w-32 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm tracking-widest text-center disabled:bg-slate-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newStaffName.trim() || newStaffPin.length !== 4}
                  className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 transition-colors"
                >
                  {t("add_local_staff", language)}
                </button>
              </form>

              <div className="flex flex-col gap-2 mt-2">
                {staffMembers.map((staff, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">
                          {staff.name}
                        </span>
                        {staff.role === "manager" && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">
                            مدير موظفين
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        الرمز: ****
                      </span>
                    </div>
                    <button
                      onClick={() => removeStaff(staff.name)}
                      className="text-red-500 hover:text-red-700 text-[12px] font-medium"
                    >
                      حذف
                    </button>
                  </div>
                ))}
                {staffMembers.length === 0 && (
                  <div className="text-center p-4 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    {t("no_local_staff", language)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Services Management Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-slate-800">
                  الخدمات المخصصة للوكالة
                </h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  تحديد أنواع خدمات إضافية غير المدمجة (مثل تأجير سيارات، تأمين،
                  شحن)
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <form
                onSubmit={handleAddCustomServiceType}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newCustomServiceType}
                  onChange={(e) => setNewCustomServiceType(e.target.value)}
                  placeholder="مثال: شحن جوي، تأمين سفر..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={!newCustomServiceType.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 transition-colors whitespace-nowrap"
                >
                  إضافة نوع خدمة
                </button>
              </form>

              <div className="flex flex-col gap-2 mt-2">
                {customBookingTypes.map((type, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {type}
                    </span>
                    <button
                      onClick={() => removeCustomBookingType(type)}
                      className="text-red-500 hover:text-red-700 text-[12px] font-medium"
                    >
                      إزالة
                    </button>
                  </div>
                ))}
                {customBookingTypes.length === 0 && (
                  <div className="text-center p-4 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    لم تقم بإضافة أي خدمات مخصصة للمكتب بعد. يمكنك إضافتها من
                    هنا لتظهر فوراً في تفصيل الحجوزات.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Payment Methods Management Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-slate-800">
                  تطبيقات بنكية ووسائل دفع إضافية
                </h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  أضف تطبيقات أو حسابات مثل بنكيلي، مصرفي، للوكالة لضبط الحسابات
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <form
                onSubmit={handleAddCustomPaymentMethod}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newCustomPaymentMethod}
                  onChange={(e) => setNewCustomPaymentMethod(e.target.value)}
                  placeholder="مثال: حساب مصرفي 2، السداد، ويسترن يونيون..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={!newCustomPaymentMethod.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:bg-slate-300 transition-colors whitespace-nowrap"
                >
                  إضافة
                </button>
              </form>

              <div className="flex flex-col gap-2 mt-2">
                {customPaymentMethods.map((method, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {method}
                    </span>
                    <button
                      onClick={() => removeCustomPaymentMethod(method)}
                      className="text-red-500 hover:text-red-700 text-[12px] font-medium"
                    >
                      إزالة
                    </button>
                  </div>
                ))}
                {customPaymentMethods.length === 0 && (
                  <div className="text-center p-4 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    لا توجد وسائل دفع مخصصة إضافية.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Daily Report */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">
                {t("daily_report", language)}
              </h2>
            </div>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span className="text-[13px] font-medium text-emerald-800">
                  {t("cash_in", language)}
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(dailyIncome)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-[13px] font-medium text-red-800">
                  {t("cash_out", language)}
                </span>
              </div>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(dailyExpense)}
              </p>
            </div>
            <div className="col-span-2 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-slate-600">
                  {t("net_cash_flow", language)}
                </span>
                <span
                  className={`text-[13px] font-bold ${dailyIncome - dailyExpense >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {dailyIncome - dailyExpense >= 0
                    ? t("surplus", language)
                    : t("deficit", language)}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(Math.abs(dailyIncome - dailyExpense))}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-[14px] font-bold text-slate-800 mb-3">
              {t("daily_bookings_summary", language)}
            </h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">
                  {t("created_bookings", language)}
                </span>
                <span className="font-bold text-slate-800">
                  {dailyBookings.length} {t("bookings_count", language)}
                </span>
              </li>
              <li className="flex justify-between items-center text-[13px]">
                <span className="text-slate-500">
                  {t("today_sales_volume", language)}
                </span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(
                    dailyBookings.reduce((sum, b) => sum + b.selling_price, 0),
                  )}
                </span>
              </li>
              <li className="flex justify-between items-center text-[13px] pt-3 border-t border-slate-50">
                <span className="text-slate-500 font-semibold">
                  {t("today_expected_profits", language)}
                </span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(dailyProfit)}
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
