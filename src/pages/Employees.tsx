import React, { useState } from "react";
import { useStore, Employee } from "../store/useStore";
import {
  Plus,
  Search,
  UserCircle,
  Briefcase,
  Phone,
  Calendar,
  DollarSign,
  Wallet,
  FileText,
  X,
  Printer,
  Download,
} from "lucide-react";
import {
  formatCurrency,
  parseDescriptionWithStaff,
  cn,
  handlePrint,
} from "../lib/utils";
import { t } from "../lib/translations";
import toast from "react-hot-toast";

export default function Employees() {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addTransaction,
    language,
    activeStaff,
    transactions,
    customPaymentMethods,
  } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

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

  const filteredEmployees = employees.filter((e) => {
    const searchLower = (searchTerm || "").toLowerCase();
    return (
      (e.name || "").toLowerCase().includes(searchLower) ||
      (e.position || "").toLowerCase().includes(searchLower) ||
      (e.phone || "").includes(searchTerm)
    );
  });

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleOpenPayModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPayModalOpen(true);
  };

  const handleOpenStatementModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsStatementOpen(true);
  };

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const employeeData = {
      name: formData.get("name") as string,
      position: formData.get("position") as string,
      phone: formData.get("phone") as string,
      salary: Number(formData.get("salary")) || 0,
      join_date: formData.get("join_date") as string,
    };

    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, employeeData);
    } else {
      await addEmployee(employeeData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "هل أنت متأكد من حذف هذا الموظف/العامل؟ لن يتم حذف عملياته المالية المرتبطة باليومية ولكن سيفقد الربط.",
      )
    ) {
      await deleteEmployee(id);
    }
  };

  const handlePaySalary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const description = formData.get("description") as string;
    const paymentMethod = formData.get("payment_method") as string;

    if (amount <= 0) {
      toast.error("المبلغ يجب أن يكون أكبر من 0");
      return;
    }

    let finalDescription = description;
    if (activeStaff) {
      finalDescription = `${description} | الموظف: ${activeStaff.name}`;
    }

    await addTransaction({
      type: "operating_expense",
      amount,
      description: finalDescription,
      payment_method: paymentMethod,
      employee_id: selectedEmployee.id,
      date: new Date().toISOString(),
    });

    setIsPayModalOpen(false);
    toast.success("تم تسجيل الدفعة بنجاح وإضافتها لليومية والمصروفات");
  };

  const getPaidAmount = (employeeId: string) => {
    return transactions
      .filter(
        (t) =>
          t.employee_id === employeeId &&
          (t.type === "expense" || t.type === "operating_expense"),
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {t("employees_list", language)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("employees_desc", language)}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t("add_employee", language)}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("search_employee", language)}
            className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => {
          const paidAmount = getPaidAmount(employee.id);

          return (
            <div
              key={employee.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-shadow hover:shadow-md"
            >
              <div className="p-5 border-b border-slate-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-slate-800">
                    {employee.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[13px] mt-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{employee.position || "غير محدد"}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {t("phone", language)}
                  </div>
                  <div className="font-semibold text-slate-700" dir="ltr">
                    {employee.phone || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {t("join_date", language)}
                  </div>
                  <div className="font-semibold text-slate-700">
                    {employee.join_date
                      ? new Date(employee.join_date).toLocaleDateString("en-GB")
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />{" "}
                    {t("basic_salary", language)}
                  </div>
                  <div className="font-bold text-slate-800">
                    {formatCurrency(employee.salary)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[12px] font-medium mb-1 flex items-center gap-1">
                    <Wallet className="w-3 h-3" />{" "}
                    {t("total_paid_to_employee", language)}
                  </div>
                  <div className="font-bold text-emerald-600">
                    {formatCurrency(paidAmount)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 border-t border-slate-100 flex gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => handleOpenPayModal(employee)}
                  className="flex-1 bg-emerald-100 text-emerald-700 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors whitespace-nowrap"
                >
                  {t("pay_amount", language)}
                </button>
                <button
                  onClick={() => handleOpenStatementModal(employee)}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors whitespace-nowrap"
                >
                  كشف حساب
                </button>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    onClick={() => handleOpenEditModal(employee)}
                    className="flex-1 sm:flex-none px-3 bg-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                  >
                    {t("edit", language)}
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="flex-1 sm:flex-none px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    {t("delete", language)}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            {t("no_employees", language)}
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold text-slate-800 mb-4">
              {editingEmployee
                ? t("edit", language)
                : t("add_employee", language)}
            </h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("employee_name", language)}
                </label>
                <input
                  defaultValue={editingEmployee?.name}
                  required
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("job_title", language)}
                </label>
                <input
                  defaultValue={editingEmployee?.position}
                  name="position"
                  type="text"
                  placeholder="مثال: عامل نظافة، موظف مبيعات..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("phone", language)}
                </label>
                <input
                  defaultValue={editingEmployee?.phone}
                  name="phone"
                  type="tel"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                    {t("basic_salary", language)}
                  </label>
                  <input
                    defaultValue={editingEmployee?.salary || 0}
                    required
                    name="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                    {t("join_date", language)}
                  </label>
                  <input
                    defaultValue={
                      editingEmployee?.join_date ||
                      new Date().toISOString().split("T")[0]
                    }
                    required
                    name="join_date"
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  {t("cancel", language)}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  {editingEmployee
                    ? t("save_changes", language)
                    : t("save", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary/Amount Modal */}
      {isPayModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <div className="mb-4">
              <h3 className="text-[17px] font-bold text-slate-800">
                {t("pay_salary", language)}
              </h3>
              <p className="text-[13px] text-slate-500 mt-1">
                للموظف:{" "}
                <span className="font-bold text-slate-700">
                  {selectedEmployee.name}
                </span>
              </p>
            </div>
            <form onSubmit={handlePaySalary} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("amount_to_pay", language)}
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  defaultValue={
                    selectedEmployee.salary > 0 ? selectedEmployee.salary : ""
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("payment_method", language)}
                </label>
                <select
                  name="payment_method"
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

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                  {t("description", language)}
                </label>
                <textarea
                  name="description"
                  required
                  defaultValue={`صرف راتب للموظف/العامل - الشهر الحالي`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm resize-none"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  {t("cancel", language)}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  {t("confirm_payment", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {isStatementOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div
            id="employee-statement-container"
            className="print-section bg-white rounded-xl p-6 w-full max-w-2xl border border-slate-200 shadow-xl max-h-[90vh] flex flex-col"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  كشف حساب موظف
                </h3>
                <p className="text-[14px] text-slate-500 mt-1">
                  الاسم:{" "}
                  <span className="font-bold text-slate-700">
                    {selectedEmployee.name}
                  </span>
                </p>
              </div>
              <div
                className="flex flex-wrap items-center justify-end gap-2 shrink-0 print:hidden"
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
                  onClick={() => setIsStatementOpen(false)}
                  className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-2">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-500 text-[13px] font-semibold">
                      التاريخ
                    </th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-500 text-[13px] font-semibold">
                      الوصف
                    </th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-500 text-[13px] font-semibold">
                      طريقة الدفع
                    </th>
                    <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-500 text-[13px] font-semibold">
                      المبلغ المسدد
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(
                      (t) =>
                        t.employee_id === selectedEmployee.id &&
                        (t.type === "expense" ||
                          t.type === "operating_expense"),
                    )
                    .map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50 border-b border-slate-50"
                      >
                        <td
                          className="py-3 px-2 text-sm text-slate-600 truncate"
                          dir="ltr"
                        >
                          {new Date(tx.date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-3 px-2 text-sm text-slate-700">
                          {parseDescriptionWithStaff(tx.description).text}
                        </td>
                        <td className="py-3 px-2 text-sm text-slate-500">
                          {t((tx.payment_method as any) || "cash", language)}
                        </td>
                        <td
                          className="py-3 px-2 text-sm font-bold text-emerald-600"
                          dir="ltr"
                        >
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  {transactions.filter(
                    (t) =>
                      t.employee_id === selectedEmployee.id &&
                      (t.type === "expense" || t.type === "operating_expense"),
                  ).length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-slate-500 text-sm"
                      >
                        لا توجد عمليات صرف مسجلة لهذا الموظف.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg flex justify-between items-center">
              <span className="font-bold text-slate-700">إجمالي المدفوعات</span>
              <span className="text-xl font-bold text-emerald-600" dir="ltr">
                {formatCurrency(getPaidAmount(selectedEmployee.id))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
