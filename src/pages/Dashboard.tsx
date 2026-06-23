import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore, TransactionType } from "../store/useStore";
import {
  formatCurrency,
  parseDescriptionWithStaff,
  cn,
} from "../lib/utils";
import { t } from "../lib/translations";
import {
  FileText,
  Copy,
  PlaneTakeoff,
  ReceiptText,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Printer,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const {
    transactions,
    addTransaction,
    language,
    activeStaff,
    staffMembers,
    user,
    customPaymentMethods,
  } = useStore();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedStaffName, setSelectedStaffName] = useState<string>("all");
  const navigate = useNavigate();

  const basePaymentMethodsList = [
    { id: "cash", label: language === "ar" ? "نقدي" : "Cash" },
    { id: "bankily", label: language === "ar" ? "بنكيلي" : "Bankily" },
    { id: "masrivi", label: language === "ar" ? "مصرفي" : "Masrivi" },
    { id: "sedad", label: language === "ar" ? "سداد" : "Sedad" },
  ];

  const paymentMethodsList = [
    ...basePaymentMethodsList,
    ...(customPaymentMethods || []).map((method) => ({
      id: method,
      label: method,
    })),
  ];

  // Enforce staff constraint
  React.useEffect(() => {
    if (activeStaff?.role === "staff") {
      setSelectedStaffName(activeStaff.name);
    }
  }, [activeStaff]);

  // Quick Action Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionType, setActionType] = useState<TransactionType>("income");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  // Filter Transactions by Selected Date and Staff
  const dailyTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    let tDate = "";
    try {
      tDate = new Date(t.date).toISOString().split("T")[0];
    } catch (e) {
      return false; // Skip invalid dates
    }
    if (tDate !== selectedDate) return false;

    // Admin/Manager filtering
    if (selectedStaffName !== "all") {
      const { staffName } = parseDescriptionWithStaff(t.description);
      if (selectedStaffName === "admin") {
        if (staffName) return false;
      } else {
        if (staffName !== selectedStaffName) return false;
      }
    }
    return true;
  });

  const totalIncome = dailyTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = dailyTransactions
    .filter((t) => t.type === "expense" || t.type === "operating_expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const openQuickAction = (
    title: string,
    type: TransactionType,
    defaultAmount: number,
    defaultDesc: string,
  ) => {
    setActionTitle(title);
    setActionType(type);
    setAmount(defaultAmount);
    setDescription(defaultDesc);
    setPaymentMethod("cash");
    setIsModalOpen(true);
  };

  const handleQuickActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("الرجاء إدخال مبلغ صحيح");
      return;
    }

    await addTransaction({
      type: actionType,
      amount: amount,
      description: description,
      payment_method: paymentMethod,
      date: new Date().toISOString(),
    });

    setIsModalOpen(false);
  };

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (window !== window.top) {
      toast(
        "لتتمكن من الطباعة بنجاح، يرجى فتح التطبيق في نافذة جديدة باستخدام الزر (Open App in New Tab) ↗️",
        { duration: 6000, icon: "💡" },
      );
    }
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div
      className="flex flex-col gap-6"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t("daily_journal", language)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("daily_journal_desc", language)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(!activeStaff || activeStaff.role === "manager") &&
            staffMembers.length > 0 && (
              <select
                value={selectedStaffName}
                onChange={(e) => setSelectedStaffName(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كل العمليات</option>
                {staffMembers.map((staff) => (
                  <option key={staff.name} value={staff.name}>
                    {staff.name}
                  </option>
                ))}
                <option value="admin">المدير فقط</option>
              </select>
            )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* POS Quick Buttons */}
      {selectedDate === new Date().toISOString().split("T")[0] && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() =>
              openQuickAction(
                t("form", language),
                "income",
                100,
                t("form", language),
              )
            }
            className="bg-white border hover:border-emerald-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <FileText className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {t("form", language)}
            </span>
          </button>

          <button
            onClick={() =>
              openQuickAction(
                t("photocopy", language),
                "income",
                50,
                t("photocopy", language),
              )
            }
            className="bg-white border hover:border-emerald-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <Copy className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {t("photocopy", language)}
            </span>
          </button>

          <button
            onClick={() =>
              navigate("/bookings", { state: { openAddModalWith: "visa" } })
            }
            className="bg-white border hover:border-emerald-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <PlaneTakeoff className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {t("visa", language)}
            </span>
          </button>

          <button
            onClick={() =>
              openQuickAction(
                t("expense_quick", language),
                "operating_expense",
                0,
                t("expense_quick", language),
              )
            }
            className="bg-white border hover:border-red-500 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md group"
          >
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
              <ReceiptText className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {t("expense_quick", language)}
            </span>
          </button>
        </div>
      )}

      {/* Daily Summary */}
      <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-700 rounded-full opacity-50 blur-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-sm flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-emerald-400" />{" "}
              {t("total_income", language)}
            </span>
            <span className="text-2xl font-bold">
              {formatCurrency(totalIncome, t("currency", language))}
            </span>
          </div>
          <div className="flex flex-col gap-1 md:border-x border-slate-700 md:px-6">
            <span className="text-slate-400 text-sm flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-red-400" />{" "}
              {t("total_expense", language)}
            </span>
            <span className="text-2xl font-bold">
              {formatCurrency(totalExpense, t("currency", language))}
            </span>
          </div>
          <div className="flex flex-col gap-1 md:px-6">
            <span className="text-slate-400 text-sm">
              {t("net_balance", language)}
            </span>
            <span
              className={`text-3xl font-extrabold ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {formatCurrency(netBalance, t("currency", language))}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Ledger Details */}
      <section
        id="daily-ledger-container"
        ref={printRef}
        className="print-section bg-white rounded-xl border border-slate-200 flex flex-col flex-1 min-h-[300px]"
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 text-[15px]">
            {t("daily_transactions", language)}{" "}
            <span className="no-print mx-2 text-slate-400">
              ({selectedDate})
            </span>
          </h3>
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm"
              title="طباعة (Print)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          {dailyTransactions.length > 0 ? (
            <div className="space-y-3">
              {dailyTransactions
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((tObj) => (
                  <div
                    key={tObj.id}
                    className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${tObj.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                      >
                        {tObj.type === "income" ? (
                          <ArrowDownCircle className="w-5 h-5" />
                        ) : (
                          <ArrowUpCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        {(() => {
                          const { text, staffName } = parseDescriptionWithStaff(
                            tObj.description,
                          );
                          return (
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800 text-sm">
                                {text}
                              </p>
                              {staffName && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                  👤 {staffName}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(tObj.date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {tObj.payment_method && (
                            <span className="mx-2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-medium">
                              {t(tObj.payment_method as any, language)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`font-bold text-sm ${tObj.type === "income" ? "text-emerald-600" : "text-red-600"}`}
                      dir="ltr"
                    >
                      {tObj.type === "income" ? "+" : "-"}
                      {formatCurrency(tObj.amount, t("currency", language))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <ReceiptText className="w-12 h-12 mb-3 opacity-20" />
              <p>{t("no_transactions", language)}</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">
              {actionTitle}
            </h3>
            <form onSubmit={handleQuickActionSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("amount", language)} ({t("currency", language)})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-lg font-bold"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                    {t("description", language)}
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                    {t("payment_method", language)}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white"
                  >
                    {paymentMethodsList.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.label}
                      </option>
                    ))}
                    <option value="other">{t("other", language)}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t("cancel", language)}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${actionType === "income" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
                >
                  {t("save", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
