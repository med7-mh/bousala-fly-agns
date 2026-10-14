import React, { useState } from "react";
import { useStore, Customer } from "../store/useStore";
import {
  formatCurrency,
  getCleanDescription,
  handlePrint,
  parseDescriptionWithStaff,
} from "../lib/utils";
import { t } from "../lib/translations";
import {
  Plus,
  Search,
  Mail,
  Phone,
  FileText,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Printer,
  Download,
  Filter,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export default function Customers() {
  const {
    customers,
    bookings,
    transactions,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addTransaction,
    language,
    activeStaff,
  } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "debt" | "credit" | "zero">("all");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "highest_debt" | "highest_credit">("newest");

  const visibleBookings = bookings.filter((b) => {
    if (activeStaff && activeStaff.role !== "manager") {
      const { staffName } = parseDescriptionWithStaff(b.description);
      return staffName === activeStaff.name;
    }
    return true;
  });

  const visibleTransactions = transactions.filter((t) => {
    if (activeStaff && activeStaff.role !== "manager") {
      const { staffName } = parseDescriptionWithStaff(t.description);
      return staffName === activeStaff.name;
    }
    return true;
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(
    null,
  );
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  const customersWithMetrics = customers.map((customer) => {
    const customerBookings = visibleBookings.filter(
      (b) => b.customer_id === customer.id,
    );
    const totalBooked = customerBookings.reduce(
      (sum, b) => sum + b.selling_price,
      0,
    );

    const customerBookingIds = customerBookings.map((b) => b.id);
    const customerTransactions = visibleTransactions.filter(
      (t) =>
        t.customer_id === customer.id ||
        (t.booking_id && customerBookingIds.includes(t.booking_id)),
    );

    const totalPaid = customerTransactions.reduce((sum, t) => {
      if (t.type === "income") return sum + t.amount;
      if (t.type === "expense") return sum - t.amount;
      return sum;
    }, 0);

    const debt = totalBooked - totalPaid;

    return {
      ...customer,
      totalBooked,
      totalPaid,
      debt,
    };
  });

  const totalDebts = customersWithMetrics
    .filter((c) => c.debt > 0)
    .reduce((sum, c) => sum + c.debt, 0);

  const totalCredits = customersWithMetrics
    .filter((c) => c.debt < 0)
    .reduce((sum, c) => sum + Math.abs(c.debt), 0);

  const filteredCustomers = customersWithMetrics
    .filter((c) => {
      const searchLower = (searchTerm || "").toLowerCase();
      const matchesSearch =
        (c.name || "").toLowerCase().includes(searchLower) ||
        (c.phone || "").includes(searchTerm) ||
        (c.national_id || "").toLowerCase().includes(searchLower) ||
        (c.passport_number || "").toLowerCase().includes(searchLower) ||
        (c.email || "").toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (filterType === "debt") return c.debt > 0;
      if (filterType === "credit") return c.debt < 0;
      if (filterType === "zero") return c.debt === 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "", language === "fr" ? "fr" : "ar");
      if (sortBy === "highest_debt") return b.debt - a.debt;
      if (sortBy === "highest_credit") return a.debt - b.debt;
      return 0;
    });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customerData = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      national_id: formData.get("national_id") as string,
      passport_number: formData.get("passport_number") as string,
      notes: formData.get("notes") as string,
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerData);
    } else {
      const newCust = await addCustomer(customerData);
      const initialBalanceStr = formData.get("initial_balance") as string;
      const initialBalance = parseFloat(initialBalanceStr);
      if (newCust && !isNaN(initialBalance) && initialBalance !== 0) {
        await addTransaction({
          customer_id: newCust.id,
          type: initialBalance > 0 ? "expense" : "income",
          amount: Math.abs(initialBalance),
          description: language === "fr" ? "Solde initial du client" : "رصيد افتتاحي للعميل",
          payment_method: language === "fr" ? "Solde initial" : "رصيد افتتاحي",
          date: new Date().toISOString().split("T")[0],
        });
      }
    }

    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <div
      className="flex flex-col gap-6"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className={`w-4 h-4 absolute ${language === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-slate-400`} />
          <input
            type="text"
            placeholder={language === "fr" ? "Rechercher par nom, téléphone, NNI, passeport..." : t("search_customer", language)}
            className={`bg-slate-100 rounded-full ${language === "ar" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("add_customer", language)}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Filter and Sort Controls */}
        <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2.5">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>{language === "fr" ? "Filtrer les clients :" : "فرز وعرض العملاء:"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filterType === "all"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{language === "fr" ? "Tous" : "الكل"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterType === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {customersWithMetrics.length}
                </span>
              </button>
              <button
                onClick={() => setFilterType("debt")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filterType === "debt"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
                }`}
              >
                <span>{language === "fr" ? "Débiteurs (nous doivent)" : "عليهم ديون (لنا)"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterType === "debt" ? "bg-white/20 text-white" : "bg-amber-200/80 text-amber-800"}`}>
                  {customersWithMetrics.filter((c) => c.debt > 0).length}
                </span>
              </button>
              <button
                onClick={() => setFilterType("credit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filterType === "credit"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                }`}
              >
                <span>{language === "fr" ? "Créditeurs (en avance)" : "لهم أرصدة (مقدمات)"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterType === "credit" ? "bg-white/20 text-white" : "bg-emerald-200/80 text-emerald-800"}`}>
                  {customersWithMetrics.filter((c) => c.debt < 0).length}
                </span>
              </button>
              <button
                onClick={() => setFilterType("zero")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filterType === "zero"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
                }`}
              >
                <span>{language === "fr" ? "Soldés (0)" : "خالصين"}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterType === "zero" ? "bg-white/20 text-white" : "bg-blue-200/80 text-blue-800"}`}>
                  {customersWithMetrics.filter((c) => c.debt === 0).length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{language === "fr" ? "Trier par :" : "ترتيب حسب:"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSortBy("newest")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  sortBy === "newest"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {language === "fr" ? "Par défaut" : "الافتراضي"}
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  sortBy === "name"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {language === "fr" ? "Nom (A - Z)" : "الأبجدي (أ - ي)"}
              </button>
              <button
                onClick={() => setSortBy("highest_debt")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  sortBy === "highest_debt"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {language === "fr" ? "Dette max" : "الأعلى ديناً"}
              </button>
              <button
                onClick={() => setSortBy("highest_credit")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  sortBy === "highest_credit"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {language === "fr" ? "Avoir max" : "الأعلى رصيداً"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Boxes */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Debt Box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800">
                {language === "fr" ? "Total dettes clients" : "مجموع ديون على العملاء"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg md:text-xl font-bold text-amber-700 font-mono my-1">
              {formatCurrency(totalDebts)}
            </div>
            <span className="text-[11px] text-amber-600/90 font-medium">
              {language === "fr" ? "Total des créances dues à l'agence (débiteurs)" : "إجمالي المبالغ المستحقة للوكالة (عليهم)"}
            </span>
          </div>

          {/* Credit Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800">
                {language === "fr" ? "Total avoirs clients" : "مجموع أرصدة العملاء"}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg md:text-xl font-bold text-emerald-700 font-mono my-1">
              {formatCurrency(totalCredits)}
            </div>
            <span className="text-[11px] text-emerald-600/90 font-medium">
              {language === "fr" ? "Total des avances et soldes créditeurs (en compte)" : "إجمالي مبالغ ومقدمات العملاء (لهم)"}
            </span>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === "ar" ? "text-right" : "text-left"} border-collapse`}>
            <thead>
              <tr>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("name", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("phone_number_col", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("total_bookings", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("amount_paid", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("remaining_debt", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap text-center">
                  {t("actions", language)}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const { totalBooked, totalPaid, debt } = customer;

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 font-medium whitespace-nowrap">
                      {customer.name}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{customer.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-slate-800 whitespace-nowrap">
                      {formatCurrency(totalBooked)}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-emerald-600 font-medium whitespace-nowrap">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] font-bold whitespace-nowrap">
                      {debt > 0 ? (
                        <span className="text-amber-600">
                          {formatCurrency(debt)} {language === "fr" ? "(dû)" : "(عليه)"}
                        </span>
                      ) : debt < 0 ? (
                        <span className="text-emerald-600">
                          {formatCurrency(Math.abs(debt))} {language === "fr" ? "(avoir)" : "(له)"}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {formatCurrency(0)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-50 text-[14px] text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setStatementCustomer(customer)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                          title={t("customer_statement", language)}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(customer)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                          title={t("edit_customer", language)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(customer)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                          title={t("delete", language)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {t("no_customers", language)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">
              {editingCustomer
                ? (language === "fr" ? "Modifier la fiche client" : t("edit_customer_title", language))
                : (language === "fr" ? "Nouveau Client" : t("new_customer_title", language))}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("full_name", language)}
                </label>
                <input
                  defaultValue={editingCustomer?.name}
                  required
                  name="name"
                  type="text"
                  placeholder={language === "fr" ? "Nom et prénom du client..." : ""}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("phone_number_col", language)}
                </label>
                <input
                  defaultValue={editingCustomer?.phone}
                  required
                  name="phone"
                  type="tel"
                  dir="ltr"
                  placeholder={language === "fr" ? "Ex: +222 46 00 00 00" : ""}
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${language === "ar" ? "text-right" : "text-left"} text-sm`}
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("national_id", language)}
                </label>
                <input
                  defaultValue={editingCustomer?.national_id}
                  name="national_id"
                  type="text"
                  dir="ltr"
                  placeholder={language === "fr" ? "Numéro National d'Identification (NNI)..." : "يمكن مسحه بالباركود..."}
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${language === "ar" ? "text-right" : "text-left"} text-sm`}
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("passport_number", language)}
                </label>
                <input
                  defaultValue={editingCustomer?.passport_number}
                  name="passport_number"
                  type="text"
                  dir="ltr"
                  placeholder={language === "fr" ? "Numéro de passeport..." : "يمكن مسحه بالباركود..."}
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${language === "ar" ? "text-right" : "text-left"} text-sm`}
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("email", language)}
                </label>
                <input
                  defaultValue={editingCustomer?.email}
                  name="email"
                  type="email"
                  dir="ltr"
                  placeholder={language === "fr" ? "exemple@email.com" : ""}
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${language === "ar" ? "text-right" : "text-left"} text-sm`}
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("notes", language)}
                </label>
                <textarea
                  defaultValue={editingCustomer?.notes}
                  name="notes"
                  rows={3}
                  placeholder={language === "fr" ? "Remarques ou détails supplémentaires..." : ""}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                ></textarea>
              </div>
              {!editingCustomer && (
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100 mt-2">
                  <label className="block text-[13px] font-bold text-emerald-800 mb-1">
                    {language === "fr" ? "Solde initial (optionnel)" : "الرصيد الافتتاحي (اختياري)"}
                  </label>
                  <input
                    name="initial_balance"
                    type="number"
                    step="any"
                    placeholder="0"
                    dir="ltr"
                    className={`w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none ${language === "ar" ? "text-right" : "text-left"} text-sm bg-white font-mono font-semibold text-slate-800`}
                  />
                  {language === "fr" ? (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      * Valeur positive (ex: <span className="font-mono font-bold text-amber-700">500</span>) : le client a une ancienne dette due à l'agence.
                      <br />* Valeur négative (ex: <span className="font-mono font-bold text-emerald-700">-500</span>) : le client dispose d'un avoir / solde créditeur chez nous.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      * قيمة موجبة (مثال: <span className="font-mono font-bold text-amber-700">500</span>) تعني أن العميل عليه دين قديم للوكالة.
                      <br />* قيمة سالبة (مثال: <span className="font-mono font-bold text-emerald-700">-500</span>) تعني أن للعميل رصيد مسبق لدينا.
                    </p>
                  )}
                </div>
              )}
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
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {editingCustomer
                    ? (language === "fr" ? "Enregistrer les modifications" : t("save_changes", language))
                    : (language === "fr" ? "Enregistrer le client" : t("save", language))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-[17px] font-bold">
                {t("delete_confirmation", language)}
              </h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              {language === "fr" ? (
                <>
                  Êtes-vous sûr de vouloir supprimer le client{" "}
                  <strong>{customerToDelete.name}</strong> ?<br />
                  <span className="text-[12px] text-slate-500">
                    {t("cannot_undo", language)}
                  </span>
                </>
              ) : (
                <>
                  هل أنت متأكد من حذف العميل{" "}
                  <strong>{customerToDelete.name}</strong>؟<br />
                  <span className="text-[12px] text-slate-500">
                    {t("cannot_undo", language)}
                  </span>
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t("cancel", language)}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {language === "fr" ? "Supprimer le client" : "حذف العميل"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Account Statement Modal */}
      {statementCustomer && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div
            id="customer-statement-container"
            className="print-section bg-white rounded-xl p-6 w-full max-w-4xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[19px] font-bold text-slate-800">
                {language === "fr" ? "Relevé de compte client" : t("customer_statement", language)} : {statementCustomer.name}
              </h3>
              <div
                className="flex items-center gap-2 print:hidden"
                data-html2canvas-ignore="true"
              >
                <button
                  onClick={handlePrint}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
                  title={t("print", language)}
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStatementCustomer(null)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className={`w-full ${language === "ar" ? "text-right" : "text-left"} border-collapse`}>
                <thead>
                  <tr>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                      {t("date", language)}
                    </th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                      {t("description", language)}
                    </th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                      {language === "fr" ? "Débit (Réservation)" : "مدين (قيمة الحجز)"}
                    </th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                      {language === "fr" ? "Crédit (Paiement / Acompte)" : "دائن (مسدد)"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const cb = visibleBookings
                      .filter((b) => b.customer_id === statementCustomer.id)
                      .map((b) => ({
                        id: b.id,
                        date: new Date(b.created_at || "").getTime(),
                        dateStr: b.created_at,
                        desc: language === "fr" ? `Réservation : ${getCleanDescription(b.description)}` : `حجز: ${getCleanDescription(b.description)}`,
                        debit: b.selling_price,
                        credit: 0,
                      }));

                    const cp = visibleTransactions
                      .filter(
                        (t) =>
                          t.customer_id === statementCustomer.id ||
                          (t.booking_id &&
                            cb.map((b) => b.id).includes(t.booking_id)),
                      )
                      .map((t) => ({
                        id: t.id,
                        date: new Date(t.date || "").getTime(),
                        dateStr: t.date,
                        desc:
                          t.type === "income"
                            ? (language === "fr"
                                ? `Versement : ${t.description} (${t.payment_method || "Espèces"})`
                                : `دفعة: ${t.description} (${t.payment_method || "نقدي"})`)
                            : (language === "fr"
                                ? `Remboursement / Dépense : ${t.description} (${t.payment_method || "Espèces"})`
                                : `صرف/مسترد: ${t.description} (${t.payment_method || "نقدي"})`),
                        debit: t.type === "expense" ? t.amount : 0,
                        credit: t.type === "income" ? t.amount : 0,
                      }));

                    const ledger = [...cb, ...cp].sort(
                      (a, b) => a.date - b.date,
                    );

                    if (ledger.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            {language === "fr"
                              ? "Aucun mouvement financier enregistré pour ce client."
                              : "لا توجد حركات مالية مسجلة لهذا العميل."}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <>
                        {ledger.map((item, idx) => (
                          <tr
                            key={`${item.id}-${idx}`}
                            className="hover:bg-slate-50 border-b border-slate-50 last:border-0"
                          >
                            <td
                              className="py-3.5 px-2 text-[14px] text-slate-500 whitespace-nowrap"
                              dir="ltr"
                            >
                              {new Date(item.dateStr || "").toLocaleDateString(
                                language === "fr" ? "fr-FR" : "en-GB",
                              )}
                            </td>
                            <td className="py-3.5 px-2 text-[14px] text-slate-800">
                              {item.desc}
                            </td>
                            <td className="py-3.5 px-2 text-[14px] text-slate-800 font-medium">
                              {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                            </td>
                            <td className="py-3.5 px-2 text-[14px] text-emerald-600 font-medium">
                              {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
                {(() => {
                  const cb = visibleBookings
                    .filter((b) => b.customer_id === statementCustomer.id)
                    .map((b) => ({ debit: b.selling_price, credit: 0 }));
                  const cp = visibleTransactions
                    .filter(
                      (t) =>
                        t.customer_id === statementCustomer.id ||
                        (t.booking_id && visibleBookings.filter((b) => b.customer_id === statementCustomer.id).map((b) => b.id).includes(t.booking_id)),
                    )
                    .map((t) => ({
                      debit: t.type === "expense" ? t.amount : 0,
                      credit: t.type === "income" ? t.amount : 0,
                    }));
                  const allLedger = [...cb, ...cp];
                  if (allLedger.length === 0) return null;

                  const totalDebit = allLedger.reduce((sum, i) => sum + i.debit, 0);
                  const totalCredit = allLedger.reduce((sum, i) => sum + i.credit, 0);
                  const net = totalDebit - totalCredit;

                  return (
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 font-semibold text-[13px]">
                      <tr>
                        <td className="py-3 px-2 text-slate-700" colSpan={2}>
                          {language === "fr" ? "Total général :" : "المجموع الكلي:"}
                        </td>
                        <td className="py-3 px-2 text-slate-900 font-mono">
                          {formatCurrency(totalDebit)}
                        </td>
                        <td className="py-3 px-2 text-emerald-600 font-mono">
                          {formatCurrency(totalCredit)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 text-slate-600" colSpan={2}>
                          {language === "fr" ? "Solde net restant :" : "الرصيد الصافي المتبقي:"}
                        </td>
                        <td className="py-2.5 px-2" colSpan={2}>
                          {net > 0 ? (
                            <span className="text-amber-600 font-bold font-mono">
                              {formatCurrency(net)} {language === "fr" ? "(Débiteur / Reste à payer)" : "(متبقي عليه)"}
                            </span>
                          ) : net < 0 ? (
                            <span className="text-emerald-600 font-bold font-mono">
                              {formatCurrency(Math.abs(net))} {language === "fr" ? "(Créditeur / Avance client)" : "(رصيد له مسبق)"}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-bold">
                              {language === "fr" ? "Compte soldé (0)" : "الحساب خالص (0)"}
                            </span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
