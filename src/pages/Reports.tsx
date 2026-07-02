import React, { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { formatCurrency, parseDescriptionWithStaff } from "../lib/utils";
import {
  Download,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Briefcase,
  FileText,
  Camera,
  Plane,
  Building,
  Target,
  PieChart,
  Users,
  Receipt,
  Map,
  Filter,
  Calendar,
  Award,
  BarChart3,
  Percent,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  DollarSign,
  Activity,
  UserCheck,
  Layers,
} from "lucide-react";
import { t } from "../lib/translations";

export default function Reports() {
  const { transactions, bookings, language, staffMembers, employees } = useStore();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "staff" | "expenses">("overview");

  // Quick Date Range Handler
  const setQuickDate = (type: "today" | "week" | "month" | "last_month" | "year" | "all") => {
    const now = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (type === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }

    if (type === "today") {
      const today = formatDate(now);
      setDateFrom(today);
      setDateTo(today);
      return;
    }

    if (type === "week") {
      const firstDayOfWeek = new Date(now);
      const day = now.getDay(); // 0 is Sunday
      firstDayOfWeek.setDate(now.getDate() - day);
      setDateFrom(formatDate(firstDayOfWeek));
      setDateTo(formatDate(now));
      return;
    }

    if (type === "month") {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(formatDate(firstDayOfMonth));
      setDateTo(formatDate(now));
      return;
    }

    if (type === "last_month") {
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(formatDate(firstDayOfLastMonth));
      setDateTo(formatDate(lastDayOfLastMonth));
      return;
    }

    if (type === "year") {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      setDateFrom(formatDate(firstDayOfYear));
      setDateTo(formatDate(now));
      return;
    }
  };

  // Collect all staff / employee names
  const allStaffNames = useMemo(() => {
    const names = new Set<string>();
    staffMembers?.forEach((s) => {
      if (s.name) names.add(s.name);
    });
    employees?.forEach((e) => {
      if (e.name) names.add(e.name);
    });
    bookings.forEach((b) => {
      const { staffName } = parseDescriptionWithStaff(b.description || "");
      if (staffName) names.add(staffName);
    });
    transactions.forEach((t) => {
      const { staffName } = parseDescriptionWithStaff(t.description || "");
      if (staffName) names.add(staffName);
    });
    return Array.from(names);
  }, [staffMembers, employees, bookings, transactions]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Service Type filter
      if (selectedServiceType !== "all" && b.type !== selectedServiceType) {
        return false;
      }

      // 2. Staff filter
      if (selectedStaff !== "all") {
        const { staffName } = parseDescriptionWithStaff(b.description || "");
        const relatedTx = transactions.find((t) => t.booking_id === b.id);
        const txStaffName = relatedTx
          ? parseDescriptionWithStaff(relatedTx.description || "").staffName
          : null;
        if (staffName !== selectedStaff && txStaffName !== selectedStaff) {
          return false;
        }
      }

      // 3. Date filter
      let targetDate = b.created_at ? new Date(b.created_at) : null;
      if (!targetDate) {
        const relatedTx = transactions.find((t) => t.booking_id === b.id);
        if (relatedTx) targetDate = new Date(relatedTx.date);
      }
      if (!targetDate && (dateFrom || dateTo)) return false;
      if (targetDate) {
        if (dateFrom && targetDate < new Date(dateFrom)) return false;
        if (dateTo) {
          const endOfDateTo = new Date(dateTo);
          endOfDateTo.setHours(23, 59, 59, 999);
          if (targetDate > endOfDateTo) return false;
        }
      }
      return true;
    });
  }, [bookings, dateFrom, dateTo, selectedServiceType, selectedStaff, transactions]);

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Staff filter
      if (selectedStaff !== "all") {
        const { staffName } = parseDescriptionWithStaff(t.description || "");
        const relatedBooking = t.booking_id ? bookings.find((b) => b.id === t.booking_id) : null;
        const bookingStaff = relatedBooking
          ? parseDescriptionWithStaff(relatedBooking.description || "").staffName
          : null;
        if (staffName !== selectedStaff && bookingStaff !== selectedStaff) {
          return false;
        }
      }

      // 2. Service Type filter
      if (selectedServiceType !== "all") {
        if (t.booking_id) {
          const relatedBooking = bookings.find((b) => b.id === t.booking_id);
          if (!relatedBooking || relatedBooking.type !== selectedServiceType) {
            return false;
          }
        } else {
          // Exclude general agency transactions when filtering by a specific service type
          return false;
        }
      }

      // 3. Date filter
      if (dateFrom && new Date(t.date) < new Date(dateFrom)) return false;
      if (dateTo) {
        const endOfDateTo = new Date(dateTo);
        endOfDateTo.setHours(23, 59, 59, 999);
        if (new Date(t.date) > endOfDateTo) return false;
      }
      return true;
    });
  }, [transactions, dateFrom, dateTo, selectedServiceType, selectedStaff, bookings]);

  // Transactions Summaries (Cash flow)
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense" || t.type === "operating_expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  // Bookings Summaries (Revenues & Costs)
  const totalBookingCost = filteredBookings.reduce(
    (sum, b) => sum + (b.cost_price || 0),
    0,
  );
  const totalBookingRevenue = filteredBookings.reduce(
    (sum, b) => sum + (b.selling_price || 0),
    0,
  );
  const bookingGrossProfit = totalBookingRevenue - totalBookingCost;

  // Operating Expenses Only (Rent, salaries, bills not directly tied to a booking supplier cost)
  const operatingExpensesOnly = filteredTransactions
    .filter((t) => t.type === "operating_expense" || (t.type === "expense" && !t.booking_id))
    .reduce((sum, t) => sum + t.amount, 0);

  const netOperatingProfit = bookingGrossProfit - operatingExpensesOnly;
  const operatingMargin = totalBookingRevenue > 0 ? (netOperatingProfit / totalBookingRevenue) * 100 : 0;

  // Services Breakdown Analysis
  const servicesBreakdown = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; cost: number; profit: number }> = {};
    filteredBookings.forEach((b) => {
      const t = b.type || "other";
      if (!map[t]) {
        map[t] = { count: 0, revenue: 0, cost: 0, profit: 0 };
      }
      map[t].count += 1;
      map[t].revenue += b.selling_price || 0;
      map[t].cost += b.cost_price || 0;
      map[t].profit += (b.selling_price || 0) - (b.cost_price || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].profit - a[1].profit);
  }, [filteredBookings]);

  // Staff Performance Breakdown
  const staffPerformance = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; cost: number; profit: number }> = {};
    filteredBookings.forEach((b) => {
      let { staffName } = parseDescriptionWithStaff(b.description || "");
      if (!staffName) {
        const relatedTx = transactions.find((t) => t.booking_id === b.id);
        if (relatedTx) {
          staffName = parseDescriptionWithStaff(relatedTx.description || "").staffName;
        }
      }
      const name = staffName || "الإدارة / غير محدد";
      if (!map[name]) {
        map[name] = { count: 0, revenue: 0, cost: 0, profit: 0 };
      }
      map[name].count += 1;
      map[name].revenue += b.selling_price || 0;
      map[name].cost += b.cost_price || 0;
      map[name].profit += (b.selling_price || 0) - (b.cost_price || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].profit - a[1].profit);
  }, [filteredBookings, transactions]);

  const getBookingTypeLabel = (type: string) => {
    switch (type) {
      case "flight":
        return "تذاكر طيران";
      case "hotel":
        return "حجوزات فندقية";
      case "visa":
        return "تأشيرات";
      case "tour":
        return "رحلات سياحية";
      case "passport":
        return "جوازات واستمارات";
      default:
        return type;
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case "flight":
        return <Plane className="w-5 h-5 text-blue-500" />;
      case "hotel":
        return <Building className="w-5 h-5 text-indigo-500" />;
      case "visa":
        return <FileText className="w-5 h-5 text-emerald-500" />;
      case "tour":
        return <Map className="w-5 h-5 text-orange-500" />;
      case "passport":
        return <BookOpen className="w-5 h-5 text-purple-500" />;
      default:
        return <Briefcase className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div
      className="space-y-6 print-section"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="hidden print:block mb-8 text-center border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-800">
          التقرير الشامل للوكالة
        </h1>
        <p className="text-slate-500 mt-2">
          {dateFrom || dateTo
            ? `الفترة: ${dateFrom || "البداية"} إلى ${dateTo || "النهاية"}`
            : `تاريخ إصدار التقرير: ${new Date().toLocaleDateString("en-GB")}`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            التقارير والإحصائيات المتقدمة
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            تحليل مرن وشامل للأداء المالي والتشغيلي للوكالة والموظفين
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">تصدير التقرير PDF</span>
        </button>
      </div>

      {/* Advanced Filter Bar & Quick Dates */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>نظام الفرز والتواريخ السريعة:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setQuickDate("today")}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              اليوم
            </button>
            <button
              onClick={() => setQuickDate("week")}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => setQuickDate("month")}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setQuickDate("last_month")}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              الشهر السابق
            </button>
            <button
              onClick={() => setQuickDate("year")}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              هذا العام
            </button>
            <button
              onClick={() => setQuickDate("all")}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              كل الأوقات
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>من تاريخ</span>
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>إلى تاريخ</span>
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>تصفية حسب نوع الخدمة</span>
            </label>
            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 font-medium"
            >
              <option value="all">جميع الخدمات</option>
              <option value="flight">تذاكر طيران</option>
              <option value="visa">تأشيرات</option>
              <option value="hotel">حجوزات فندقية</option>
              <option value="tour">رحلات سياحية</option>
              <option value="passport">جوازات واستمارات</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>تصفية حسب الموظف المسؤول</span>
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-slate-50/50 font-medium"
            >
              <option value="all">جميع الموظفين (الكل)</option>
              {allStaffNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(dateFrom || dateTo || selectedServiceType !== "all" || selectedStaff !== "all") && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              يتم عرض النتائج المفلترة:{" "}
              <strong className="text-slate-800">{filteredBookings.length}</strong> خدمة |{" "}
              <strong className="text-slate-800">{filteredTransactions.length}</strong> حركة مالية
            </span>
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSelectedServiceType("all");
                setSelectedStaff("all");
              }}
              className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط جميع الفلاتر</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs for Report Sections */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-indigo-600"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>الملخص المالي والخزينة</span>
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "expenses"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-indigo-600"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>مقارنة الإيرادات والمصروفات</span>
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "services"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-indigo-600"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>تحليل أداء الخدمات</span>
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "staff"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
              : "border-transparent text-slate-600 hover:text-indigo-600"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>تقرير أداء الموظفين</span>
        </button>
      </div>

      {/* Tab 1: Overview & Cash Flow */}
      {(activeTab === "overview" || window.matchMedia("print").matches) && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" />
            الملخص المالي للخزينة (المقبوضات والمدفوعات)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 flex items-center justify-between shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-left" dir="ltr">
                <div className="text-[13px] font-semibold text-emerald-800 text-right">
                  المقبوضات (إيرادات)
                </div>
                <p className="text-2xl font-bold text-emerald-600 text-right">
                  {formatCurrency(totalIncome, t("currency", language))}
                </p>
              </div>
            </div>

            <div className="bg-red-50 rounded-2xl border border-red-100 p-5 flex items-center justify-between shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="text-left" dir="ltr">
                <div className="text-[13px] font-semibold text-red-800 text-right">
                  المدفوعات (مصروفات)
                </div>
                <p className="text-2xl font-bold text-red-600 text-right">
                  {formatCurrency(totalExpense, t("currency", language))}
                </p>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-5 flex items-center justify-between shadow-sm ${
                netCashFlow >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  netCashFlow >= 0 ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                }`}
              >
                <Receipt className="w-6 h-6" />
              </div>
              <div className="text-left" dir="ltr">
                <div
                  className={`text-[13px] font-semibold text-right ${
                    netCashFlow >= 0 ? "text-blue-800" : "text-orange-800"
                  }`}
                >
                  صافي حركة الخزينة
                </div>
                <p
                  className={`text-2xl font-bold text-right ${
                    netCashFlow >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  {formatCurrency(netCashFlow, t("currency", language))}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pt-4">
            <Target className="w-5 h-5 text-blue-500" />
            ملخص المبيعات والحجوزات المتوقعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-500 mb-1">
                إجمالي تكلفة الخدمات المؤداة
              </div>
              <p className="text-xl font-bold text-slate-800 mt-2">
                {formatCurrency(totalBookingCost, t("currency", language))}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-500 mb-1">
                إجمالي قيمة مبيعات الخدمات (الدخل المتوقع)
              </div>
              <p className="text-xl font-bold text-slate-800 mt-2">
                {formatCurrency(totalBookingRevenue, t("currency", language))}
              </p>
            </div>
            <div className="bg-slate-800 rounded-2xl border border-slate-900 p-5 shadow-sm text-white">
              <div className="text-sm font-semibold text-slate-300 mb-1">
                أرباح المبيعات التقريبية (قبل المصاريف التشغيلية)
              </div>
              <p className="text-2xl font-bold text-emerald-400 mt-2">
                {formatCurrency(bookingGrossProfit, t("currency", language))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Revenue vs Expenses Detailed Breakdown */}
      {(activeTab === "expenses" || window.matchMedia("print").matches) && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            مقارنة الإيرادات والمصروفات والربح التشغيلي الصافي
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المبيعات (الدخل)</span>
                <span className="text-lg font-bold text-slate-800 font-mono">
                  {formatCurrency(totalBookingRevenue, t("currency", language))}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 block mb-1">تكلفة الحجوزات المباشرة</span>
                <span className="text-lg font-bold text-amber-600 font-mono">
                  {formatCurrency(totalBookingCost, t("currency", language))}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-500 block mb-1">المصروفات العامة والتشغيلية</span>
                <span className="text-lg font-bold text-red-600 font-mono">
                  {formatCurrency(operatingExpensesOnly, t("currency", language))}
                </span>
              </div>
              <div className={`p-4 rounded-xl border ${netOperatingProfit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <span className={`text-xs font-bold block mb-1 ${netOperatingProfit >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                  الربح التشغيلي الصافي
                </span>
                <span className={`text-lg font-bold font-mono ${netOperatingProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {formatCurrency(netOperatingProfit, t("currency", language))}
                </span>
              </div>
            </div>

            {/* Visual Breakdown Progress Bar */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                <span>توزيع كل 100 أوقية من المبيعات:</span>
                <span className="text-indigo-600 font-bold">
                  هامش الربح التشغيلي: {operatingMargin.toFixed(1)}%
                </span>
              </div>
              {totalBookingRevenue > 0 ? (
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, (totalBookingCost / totalBookingRevenue) * 100)}%` }}
                    className="bg-amber-500 h-full"
                    title="تكلفة الخدمات المباشرة"
                  />
                  <div
                    style={{ width: `${Math.min(100, (operatingExpensesOnly / totalBookingRevenue) * 100)}%` }}
                    className="bg-red-500 h-full"
                    title="المصروفات التشغيلية"
                  />
                  <div
                    style={{ width: `${Math.max(0, Math.min(100, (netOperatingProfit / totalBookingRevenue) * 100))}%` }}
                    className="bg-emerald-600 h-full"
                    title="الربح الصافي"
                  />
                </div>
              ) : (
                <div className="w-full h-4 bg-slate-100 rounded-full flex items-center justify-center text-[10px] text-slate-400 font-medium">
                  لا توجد مبيعات لحساب التوزيع
                </div>
              )}
              <div className="flex flex-wrap items-center gap-6 text-xs font-semibold pt-1">
                <div className="flex items-center gap-1.5 text-amber-700">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span>تكلفة الخدمات المباشرة ({totalBookingRevenue > 0 ? ((totalBookingCost / totalBookingRevenue) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-700">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span>المصروفات التشغيلية ({totalBookingRevenue > 0 ? ((operatingExpensesOnly / totalBookingRevenue) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  <span>الربح الصافي ({operatingMargin.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Explanation Note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
              <strong>ملاحظة مالية مهمة:</strong> يمثل <em>الربح التشغيلي الصافي</em> النتيجة النهائية بعد طرح تكاليف الموردين المباشرة للمبيعات بالإضافة إلى المصروفات التشغيلية (رواتب، إيجار، فواتير...) المسجلة في الخزينة خلال الفترة المحددة.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Services Breakdown Analysis */}
      {(activeTab === "services" || window.matchMedia("print").matches) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              تحليل أداء وربحية الخدمات المقدمة
            </h2>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              {filteredBookings.length} خدمة إجمالاً
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {servicesBreakdown.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <span>لا توجد خدمات مسجلة في هذه الفترة وفق الفلاتر المحددة</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold">
                      <th className="p-4">نوع الخدمة</th>
                      <th className="p-4 text-center">عدد الحجوزات</th>
                      <th className="p-4 text-left">إجمالي المبيعات</th>
                      <th className="p-4 text-left">إجمالي التكلفة</th>
                      <th className="p-4 text-left">صافي الربح</th>
                      <th className="p-4 text-center">هامش الربح %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {servicesBreakdown.map(([type, stats]) => {
                      const margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
                      return (
                        <tr key={type} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center shrink-0">
                                {getBookingTypeIcon(type)}
                              </div>
                              <span className="font-bold text-slate-800">
                                {getBookingTypeLabel(type)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700">
                            {stats.count}
                          </td>
                          <td className="p-4 text-left font-mono text-slate-800">
                            {formatCurrency(stats.revenue, t("currency", language))}
                          </td>
                          <td className="p-4 text-left font-mono text-slate-500">
                            {formatCurrency(stats.cost, t("currency", language))}
                          </td>
                          <td className="p-4 text-left font-mono font-bold text-emerald-600">
                            {formatCurrency(stats.profit, t("currency", language))}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                margin >= 20
                                  ? "bg-emerald-50 text-emerald-700"
                                  : margin >= 10
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Employee Performance Report */}
      {(activeTab === "staff" || window.matchMedia("print").matches) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              تقرير أداء وإنتاجية الموظفين
            </h2>
            <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
              {staffPerformance.length} موظف / جهة
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {staffPerformance.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <span>لا توجد بيانات إنتاجية مسجلة في هذه الفترة</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold">
                      <th className="p-4">الموظف / المسؤول</th>
                      <th className="p-4 text-center">عدد الحجوزات المنفذة</th>
                      <th className="p-4 text-left">إجمالي المبيعات المحققة</th>
                      <th className="p-4 text-left">تكلفة الخدمات</th>
                      <th className="p-4 text-left">الربح الصافي المحقق</th>
                      <th className="p-4 text-center">مستوى الأداء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {staffPerformance.map(([name, stats], idx) => {
                      return (
                        <tr key={name} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-slate-100 text-slate-700"
                              }`}>
                                {idx + 1}
                              </div>
                              <span className="font-bold text-slate-800">{name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700">
                            {stats.count}
                          </td>
                          <td className="p-4 text-left font-mono text-slate-800">
                            {formatCurrency(stats.revenue, t("currency", language))}
                          </td>
                          <td className="p-4 text-left font-mono text-slate-500">
                            {formatCurrency(stats.cost, t("currency", language))}
                          </td>
                          <td className="p-4 text-left font-mono font-bold text-emerald-600">
                            {formatCurrency(stats.profit, t("currency", language))}
                          </td>
                          <td className="p-4 text-center">
                            {idx === 0 && stats.profit > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                <span>الأعلى إنتاجية</span>
                              </span>
                            ) : stats.profit > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                نشط ومثمر
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                قياسي
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
