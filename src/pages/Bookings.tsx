import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore, BookingStatus, Booking, Customer } from "../store/useStore";
import {
  formatCurrency,
  parseDescriptionWithStaff,
  handlePrint,
} from "../lib/utils";
import { t } from "../lib/translations";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  ScanLine,
  X,
  Printer,
  Download,
} from "lucide-react";
import VisaBookingModal from "../components/VisaBookingModal";
import toast from "react-hot-toast";

interface ServiceItem {
  id: string;
  type: string; // flight, hotel, visa, tour, passport, or custom booking type
  description: string;
  cost_price: number;
  selling_price: number;
  pnr: string;
  national_id: string;
  passport_number: string;
  receipt_number: string;
  expected_date: string;
  supplier_id: string;
}

const initialService = (): ServiceItem => ({
  id: `item-${Date.now()}-${Math.random()}`,
  type: "flight",
  description: "",
  cost_price: 0,
  selling_price: 0,
  pnr: "",
  national_id: "",
  passport_number: "",
  receipt_number: "",
  expected_date: "",
  supplier_id: "",
});

export default function Bookings() {
  const {
    bookings,
    customers,
    suppliers,
    addBooking,
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    addTransaction,
    addCustomer,
    updateCustomer,
    language,
    activeStaff,
    customBookingTypes,
    addCustomBookingType,
    removeCustomBookingType,
    customPaymentMethods,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisaModalOpen, setIsVisaModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  // Form specific state
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [advancePaymentMethod, setAdvancePaymentMethod] =
    useState<string>("cash");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Service Items inside the booking
  const [formServices, setFormServices] = useState<ServiceItem[]>([
    initialService(),
  ]);

  // Helper to check and parse multi-service booking JSON
  const getMultiServices = (description: string): ServiceItem[] | null => {
    const { text } = parseDescriptionWithStaff(description);
    if (!text) return null;
    try {
      if (text.trim().startsWith("{")) {
        const parsed = JSON.parse(text);
        if (
          parsed &&
          typeof parsed === "object" &&
          parsed.is_multi &&
          Array.isArray(parsed.services)
        ) {
          return parsed.services as ServiceItem[];
        }
      }
    } catch (e) {}
    return null;
  };

  useEffect(() => {
    if (location.state?.openAddModalWith) {
      if (location.state.openAddModalWith === "visa") {
        setIsVisaModalOpen(true);
      } else {
        const typeRequested = location.state.openAddModalWith;
        setFormServices([
          {
            ...initialService(),
            type: typeRequested,
          },
        ]);
        setEditingBooking(null);
        setIsModalOpen(true);
      }
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (editingBooking) {
      setSelectedCustomerId(editingBooking.customer_id);

      const parsed = getMultiServices(editingBooking.description);
      if (parsed) {
        setFormServices(
          parsed.map((s, index) => ({
            ...s,
            id: s.id || `item-${index}-${Math.random()}`,
          })),
        );
      } else {
        // Fallback or single service booking
        setFormServices([
          {
            id: "1",
            type: editingBooking.type,
            description: parseDescriptionWithStaff(editingBooking.description)
              .text,
            cost_price: editingBooking.cost_price,
            selling_price: editingBooking.selling_price,
            pnr: "",
            national_id: editingBooking.national_id || "",
            passport_number: "",
            receipt_number: editingBooking.receipt_number || "",
            expected_date: editingBooking.expected_date || "",
            supplier_id: editingBooking.supplier_id || "",
          },
        ]);
      }
    } else {
      setSelectedCustomerId("");
      setFormServices([initialService()]);
    }
  }, [editingBooking]);

  // Sync total costs
  useEffect(() => {
    const totalCost = formServices.reduce(
      (sum, s) => sum + (Number(s.cost_price) || 0),
      0,
    );
    const totalSelling = formServices.reduce(
      (sum, s) => sum + (Number(s.selling_price) || 0),
      0,
    );
    setCostPrice(totalCost);
    setSellingPrice(totalSelling);
  }, [formServices]);

  const updateServiceItem = (itemId: string, updates: Partial<ServiceItem>) => {
    setFormServices((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    );
  };

  const addServiceItem = () => {
    setFormServices((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        type: "flight",
        description: "",
        cost_price: 0,
        selling_price: 0,
        pnr: "",
        national_id: "",
        passport_number: "",
        receipt_number: "",
        expected_date: "",
        supplier_id: "",
      },
    ]);
  };

  const removeServiceItem = (itemId: string) => {
    if (formServices.length <= 1) {
      toast.error("يجب أن يحتوي الحجز على خدمة واحدة على الأقل");
      return;
    }
    setFormServices((prev) => prev.filter((item) => item.id !== itemId));
  };

  const visibleBookings = bookings.filter((b) => {
    if (activeStaff && activeStaff.role !== "manager") {
      const { staffName } = parseDescriptionWithStaff(b.description);
      return staffName === activeStaff.name;
    }
    return true;
  });

  const filteredBookings = visibleBookings.filter((b) => {
    const customer = customers.find((c) => c.id === b.customer_id);
    const searchLower = (searchTerm || "").toLowerCase();

    // Check main details
    if ((customer?.name || "").toLowerCase().includes(searchLower)) return true;

    const parsedServices = getMultiServices(b.description);
    if (parsedServices) {
      return parsedServices.some(
        (s) =>
          (s.description || "").toLowerCase().includes(searchLower) ||
          (s.type || "").toLowerCase().includes(searchLower) ||
          (s.pnr || "").toLowerCase().includes(searchLower) ||
          (s.national_id || "").toLowerCase().includes(searchLower),
      );
    } else {
      const { text } = parseDescriptionWithStaff(b.description);
      return (
        text.toLowerCase().includes(searchLower) ||
        (b.type || "").toLowerCase().includes(searchLower)
      );
    }
  });

  const handleOpenAddModal = () => {
    setEditingBooking(null);
    setFormServices([initialService()]);
    setAdvancePayment(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setAdvancePayment(0);
    setIsModalOpen(true);
  };

  const handleAddBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let customerIdToUse = selectedCustomerId;

    if (!customerIdToUse) {
      toast.error("الرجاء اختيار العميل أو إضافة عميل جديد");
      return;
    }

    // Add new customer inline if selected 'new'
    if (selectedCustomerId === "new") {
      const newCustomerName = formData.get("new_customer_name") as string;
      const newCustomerPhone = formData.get("new_customer_phone") as string;
      const firstNationalId = formServices[0]?.national_id || "";

      const newCustomer = await addCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
        email: "",
        national_id: firstNationalId || undefined,
        passport_number: undefined,
        notes: "",
      });
      if (newCustomer) {
        customerIdToUse = newCustomer.id;
      } else {
        return;
      }
    } else {
      // Check if we need to update existing customer's passport or national id
      const existingCustomer = customers.find((c) => c.id === customerIdToUse);
      if (existingCustomer) {
        const updates: Partial<Customer> = {};
        const firstNationalId = formServices[0]?.national_id || "";
        if (
          firstNationalId &&
          existingCustomer.national_id !== firstNationalId
        ) {
          updates.national_id = firstNationalId;
        }
        if (Object.keys(updates).length > 0) {
          updateCustomer(customerIdToUse, updates);
        }
      }
    }

    // Process type and serialization
    let finalType: any = "tour";
    let finalDescription = "";

    if (formServices.length === 1) {
      const s = formServices[0];
      const isStandard = [
        "flight",
        "hotel",
        "visa",
        "tour",
        "passport",
      ].includes(s.type);
      if (isStandard) {
        finalType = s.type;
        const parts = [];
        if (s.type === "passport" || s.type === "visa") {
          if (s.national_id) parts.push(`الرقم الوطني: ${s.national_id}`);
          if (s.passport_number) parts.push(`رقم الجواز: ${s.passport_number}`);
          if (s.receipt_number) parts.push(`رقم الإيصال: ${s.receipt_number}`);
          if (s.expected_date) parts.push(`موعد الاستلام: ${s.expected_date}`);
          if (s.description) parts.push(`التفاصيل: ${s.description}`);
        } else {
          if (s.pnr) parts.push(`PNR: ${s.pnr}`);
          if (s.description) parts.push(`التفاصيل: ${s.description}`);
        }
        finalDescription = parts.join(" | ") || "بدون وصف";
      } else {
        // Custom type -> serialize
        finalType = "tour";
        finalDescription = JSON.stringify({
          is_multi: true,
          services: formServices,
        });
      }
    } else {
      // Multiple services -> always serialize
      finalType = "tour";
      finalDescription = JSON.stringify({
        is_multi: true,
        services: formServices,
      });
    }

    const bookingData: Partial<Booking> = {
      customer_id: customerIdToUse,
      supplier_id: formServices[0]?.supplier_id || undefined,
      type: finalType,
      description: finalDescription,
      cost_price: costPrice,
      selling_price: sellingPrice,
      status: formData.get("status") as any,
      national_id: formServices[0]?.national_id || undefined,
      receipt_number: formServices[0]?.receipt_number || undefined,
      expected_date: formServices[0]?.expected_date || undefined,
    };

    if (editingBooking) {
      await updateBooking(editingBooking.id, bookingData);
    } else {
      const newBooking = await addBooking(
        bookingData as Omit<Booking, "id" | "agency_id" | "created_at">,
      );
      // Handle Quick Payment
      if (newBooking && advancePayment > 0) {
        await addTransaction({
          booking_id: newBooking.id,
          type: "income",
          amount: advancePayment,
          description: `دفعة مقدمة - حجز خدمات مجمعة`,
          payment_method: advancePaymentMethod,
          date: new Date().toISOString(),
        });
      }
    }

    setIsModalOpen(false);
    setEditingBooking(null);
    setCostPrice(0);
    setSellingPrice(0);
    setFormServices([initialService()]);
    setAdvancePayment(0);
    setAdvancePaymentMethod("cash");
  };

  const handleDelete = () => {
    if (bookingToDelete) {
      deleteBooking(bookingToDelete.id);
      setBookingToDelete(null);
    }
  };

  const typeLabels: Record<string, string> = {
    flight: "طيران",
    hotel: "فندق",
    visa: "تأشيرة",
    tour: "جولة سياحية",
    passport: "جواز سفر",
  };

  const statusLabels: Record<BookingStatus, string> = {
    pending: "معلق",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    documents_received: "استلام المستندات",
    processing: "قيد المعالجة",
    ready: "جاهز للاستلام",
    delivered: "تم التسليم",
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "confirmed":
      case "delivered":
        return "bg-emerald-50 text-emerald-700";
      case "pending":
      case "documents_received":
      case "processing":
        return "bg-amber-50 text-amber-700";
      case "ready":
        return "bg-blue-50 text-blue-700";
      case "cancelled":
      default:
        return "bg-red-50 text-red-700";
    }
  };

  return (
    <div
      className="flex flex-col gap-6"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("search_booking", language)}
              className="bg-slate-100 rounded-full pr-10 pl-4 py-2 w-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors w-full sm:w-auto">
            <Filter className="w-4 h-4" />
            {t("filter", language)}
          </button>

          <button
            onClick={handlePrint}
            className="border px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" />
            {t("print", language) || "طباعة"}
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsVisaModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ScanLine className="w-4 h-4" />
            {t("issue_visa", language)}
          </button>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t("add_booking", language)}
          </button>
        </div>
      </div>

      <section
        id="bookings-table-container"
        className="print-section bg-white rounded-xl border border-slate-200 p-5 flex flex-col shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-[0px]">
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("booking_date", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("booking_number", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("customer", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  الخدمات المشمولة
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  الوصف والتفاصيل
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("cost", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("selling_price", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("profit", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("status", language)}
                </th>
                <th className="py-3 px-2 border-b-2 border-slate-100 text-slate-400 text-[13px] font-semibold whitespace-nowrap">
                  {t("actions", language)}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const customer = customers.find(
                  (c) => c.id === booking.customer_id,
                );
                const profit = booking.selling_price - booking.cost_price;
                const parsedMulti = getMultiServices(booking.description);
                const { staffName } = parseDescriptionWithStaff(
                  booking.description,
                );

                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50/85 transition-colors"
                  >
                    <td
                      className="py-3.5 px-2 border-b border-slate-100/50 text-[13px] text-slate-500 whitespace-nowrap font-medium"
                      dir="ltr"
                    >
                      {booking.created_at
                        ? new Date(booking.created_at).toLocaleDateString(
                            "en-GB",
                          )
                        : "-"}
                    </td>
                    <td
                      className="py-3.5 px-2 border-b border-slate-100/50 text-[13px] text-slate-500 whitespace-nowrap font-medium"
                      dir="ltr"
                    >
                      #{booking.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[14px] text-slate-800 font-bold whitespace-nowrap">
                      {customer?.name || "ـ"}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[13px] text-slate-600">
                      {parsedMulti ? (
                        <div className="flex flex-wrap gap-1">
                          {parsedMulti.map((srv, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200"
                            >
                              {typeLabels[srv.type] || srv.type}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100">
                          {typeLabels[booking.type] || booking.type}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[13px] text-slate-600 min-w-[200px]">
                      {parsedMulti ? (
                        <div className="flex flex-col gap-1.5 py-1">
                          {parsedMulti.map((srv, idx) => (
                            <div
                              key={idx}
                              className="text-[12px] text-slate-600 border-r-2 border-emerald-400 pr-2 py-0.5 bg-slate-50/50 p-1.5 rounded-md"
                            >
                              <span className="font-bold text-slate-700">
                                ({typeLabels[srv.type] || srv.type}):
                              </span>{" "}
                              <span>{srv.description || "بدون وصف"}</span>
                              {srv.pnr && (
                                <span className="mr-2 text-[10px] bg-blue-50 text-blue-700 px-1 py-0.1 select-all font-mono rounded">
                                  PNR: {srv.pnr}
                                </span>
                              )}
                            </div>
                          ))}
                          {staffName && (
                            <span className="w-fit inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200">
                              👤 {staffName}
                            </span>
                          )}
                        </div>
                      ) : (
                        (() => {
                          const { text } = parseDescriptionWithStaff(
                            booking.description,
                          );
                          return (
                            <div className="flex flex-col gap-1">
                              <span className="line-clamp-2">{text}</span>
                              {staffName && (
                                <span className="w-fit inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200">
                                  👤 {staffName}
                                </span>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[14px] text-slate-600 whitespace-nowrap font-medium">
                      {formatCurrency(booking.cost_price)}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[14px] text-slate-800 font-bold whitespace-nowrap">
                      {formatCurrency(booking.selling_price)}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[14px] text-emerald-600 font-bold whitespace-nowrap">
                      {formatCurrency(profit)}
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[14px] text-slate-800 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold ${getStatusColor(booking.status)}`}
                      >
                        {statusLabels[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 border-b border-slate-100/50 text-[14px] text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={booking.status}
                          onChange={(e) =>
                            updateBookingStatus(
                              booking.id,
                              e.target.value as BookingStatus,
                            )
                          }
                          className="text-xs border border-slate-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white cursor-pointer"
                        >
                          {booking.type === "passport" ? (
                            <>
                              <option value="documents_received">
                                استلام المستندات
                              </option>
                              <option value="processing">قيد المعالجة</option>
                              <option value="ready">جاهز للاستلام</option>
                              <option value="delivered">تم التسليم</option>
                              <option value="cancelled">ملغي</option>
                            </>
                          ) : (
                            <>
                              <option value="pending">معلق</option>
                              <option value="confirmed">مؤكد</option>
                              <option value="cancelled">ملغي</option>
                            </>
                          )}
                        </select>
                        <button
                          onClick={() => handleOpenEditModal(booking)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="تعديل الحجز"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBookingToDelete(booking)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="حذف الحجز"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col transition-all">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-[17px] font-bold text-slate-800">
                {editingBooking
                  ? "تعديل الحجز وتفاصيل الخدمات"
                  : "إضافة حجز جديد (متعدد الخدمات)"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBooking(null);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddBooking}
              className="space-y-5 overflow-y-auto flex-1 pr-1 pl-1"
            >
              {/* Select Customer */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-120 space-y-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">
                    {t("customer", language)}
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    name="customer_id"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white cursor-pointer"
                  >
                    <option value="">اختر العميل...</option>
                    <option value="new" className="text-emerald-600 font-bold">
                      {t("new_customer", language)}
                    </option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomerId === "new" && (
                  <div className="bg-emerald-50/55 p-3 rounded-lg border border-emerald-100/80 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-emerald-800 mb-1">
                        {t("customer_name", language)}
                      </label>
                      <input
                        required
                        name="new_customer_name"
                        type="text"
                        className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-emerald-800 mb-1">
                        {t("phone_number", language)}
                      </label>
                      <input
                        required
                        name="new_customer_phone"
                        type="tel"
                        dir="ltr"
                        className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-right text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Service Cards list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-100/50 px-3 py-2 rounded-lg">
                  <span className="text-xs font-bold text-slate-600">
                    جدول الخدمات المسجلة في هذا الحجز
                  </span>
                  <button
                    type="button"
                    onClick={addServiceItem}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />+ إضافة خدمة للحجز
                  </button>
                </div>

                {formServices.map((service, index) => (
                  <div
                    key={service.id}
                    className="relative bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-[13px] font-bold text-slate-700">
                        الخدمة #{index + 1}
                      </span>
                      {formServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeServiceItem(service.id)}
                          className="p-1 px-2 text-rose-500 hover:bg-rose-50 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف الخدمة
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                          نوع الخدمة المشمولة
                        </label>
                        <div className="flex gap-1.5">
                          <select
                            value={service.type}
                            onChange={(e) =>
                              updateServiceItem(service.id, {
                                type: e.target.value,
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="flight">طيران</option>
                            <option value="hotel">فندق</option>
                            <option value="visa">تأشيرة</option>
                            <option value="tour">جولة سياحية</option>
                            <option value="passport">جواز سفر</option>
                            {customBookingTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const name = prompt(
                                "أدخل اسم الخدمة المخصصة الجديدة (مثال: تأمين صحي، شحن بري):",
                              );
                              if (name && name.trim()) {
                                addCustomBookingType(name.trim());
                                updateServiceItem(service.id, {
                                  type: name.trim(),
                                });
                              }
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                            title="إضافة نوع مخصص للوكالة"
                          >
                            + مخصص
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                          المورد (Suppliers)
                        </label>
                        <select
                          value={service.supplier_id || ""}
                          onChange={(e) =>
                            updateServiceItem(service.id, {
                              supplier_id: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">لا يوجد...</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Condition Fields based on internal item type */}
                    {service.type === "passport" || service.type === "visa" ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                              الرقم الوطني
                            </label>
                            <input
                              value={service.national_id || ""}
                              onChange={(e) =>
                                updateServiceItem(service.id, {
                                  national_id: e.target.value,
                                })
                              }
                              type="text"
                              placeholder="رقم الهوية الوطنية للعميل"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          {service.type === "visa" ? (
                            <div>
                              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                                رقم جواز السفر
                              </label>
                              <input
                                value={service.passport_number || ""}
                                onChange={(e) =>
                                  updateServiceItem(service.id, {
                                    passport_number: e.target.value,
                                  })
                                }
                                type="text"
                                placeholder="رقم جواز السفر"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                                رقم الإيصال الإداري
                              </label>
                              <input
                                value={service.receipt_number || ""}
                                onChange={(e) =>
                                  updateServiceItem(service.id, {
                                    receipt_number: e.target.value,
                                  })
                                }
                                type="text"
                                placeholder="رقم المعاملة في الإدارة"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                          {service.type === "visa" && (
                            <div>
                              <label className="block text-[12px] font-semibold text-slate-600 mb-1 font-medium">
                                رقم الإيصال
                              </label>
                              <input
                                value={service.receipt_number || ""}
                                onChange={(e) =>
                                  updateServiceItem(service.id, {
                                    receipt_number: e.target.value,
                                  })
                                }
                                type="text"
                                placeholder="رقم المعاملة"
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          )}
                          <div
                            className={
                              service.type !== "visa" ? "col-span-2" : ""
                            }
                          >
                            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                              تاريخ الاستلام المتوقع والجاهزية
                            </label>
                            <input
                              value={service.expected_date || ""}
                              onChange={(e) =>
                                updateServiceItem(service.id, {
                                  expected_date: e.target.value,
                                })
                              }
                              type="date"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                            ملاحظات إضافية على الخدمة
                          </label>
                          <input
                            required
                            value={service.description || ""}
                            onChange={(e) =>
                              updateServiceItem(service.id, {
                                description: e.target.value,
                              })
                            }
                            type="text"
                            placeholder="مثال: استخراج لأول مرة، مستعجل"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 animate-fadeIn">
                          <div className="col-span-2">
                            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                              بيانات الخدمة والوصف الكامل
                            </label>
                            <input
                              required
                              value={service.description || ""}
                              onChange={(e) =>
                                updateServiceItem(service.id, {
                                  description: e.target.value,
                                })
                              }
                              type="text"
                              placeholder="مثال: تفاصيل الطيران نواكشوط - تونس فندق 5 نجوم"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                              رمز الحجز (PNR / Ref)
                            </label>
                            <input
                              value={service.pnr || ""}
                              onChange={(e) =>
                                updateServiceItem(service.id, {
                                  pnr: e.target.value,
                                })
                              }
                              type="text"
                              placeholder="اختياري"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/30">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                          تكلفة الخدمة (Cost)
                        </label>
                        <input
                          required
                          value={service.cost_price || ""}
                          onChange={(e) =>
                            updateServiceItem(service.id, {
                              cost_price: Number(e.target.value),
                            })
                          }
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                          سعر البيع للعميل (Selling)
                        </label>
                        <input
                          required
                          value={service.selling_price || ""}
                          onChange={(e) =>
                            updateServiceItem(service.id, {
                              selling_price: Number(e.target.value),
                            })
                          }
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic overall Profit Calculator */}
              {(sellingPrice > 0 || costPrice > 0) && (
                <div
                  className={`p-4 rounded-xl text-sm flex justify-between font-bold border ${sellingPrice - costPrice >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"}`}
                >
                  <span>إجمالي الحجز المجمع:</span>
                  <div className="flex gap-4">
                    <span>التكلفة: {formatCurrency(costPrice)}</span>
                    <span>البيع: {formatCurrency(sellingPrice)}</span>
                    <span>
                      الربح الإجمالي: {formatCurrency(sellingPrice - costPrice)}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Downpayment Receipt Creation */}
              {!editingBooking && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">
                      {t("advance_payment", language)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={advancePayment || ""}
                      onChange={(e) =>
                        setAdvancePayment(Number(e.target.value))
                      }
                      placeholder="المبلغ المدفوع كدفعة أولى (اختياري)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white"
                    />
                  </div>
                  {advancePayment > 0 && (
                    <div>
                      <label className="block text-[13px] font-semibold text-slate-600 mb-1">
                        {t("payment_method", language)}
                      </label>
                      <select
                        value={advancePaymentMethod}
                        onChange={(e) =>
                          setAdvancePaymentMethod(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white cursor-pointer"
                      >
                        {paymentMethodsList.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.label}
                          </option>
                        ))}
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    سيتم تلقائياً إصدار سند قبض مالي بهذا المبلغ وسيكون الحجز
                    مدفوعاً جزئياً.
                  </p>
                </div>
              )}

              {/* General Booking status */}
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  الحالة الإجمالية للحجز
                </label>
                <select
                  defaultValue={editingBooking?.status}
                  required
                  name="status"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white cursor-pointer"
                >
                  <option value="pending">معلق (Pending)</option>
                  <option value="confirmed">مؤكد (Confirmed)</option>
                  <option value="cancelled">ملغي (Cancelled)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingBooking(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-md shadow-emerald-250"
                >
                  {editingBooking
                    ? "حفظ الحجز المعدل"
                    : "تأكيد وحفظ الحجز المجمع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-[17px] font-bold">تأكيد الحذف</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              هل أنت متأكد من حذف الحجز رقم{" "}
              <strong>
                #{bookingToDelete.id.substring(0, 8).toUpperCase()}
              </strong>
              ؟<br />
              <span className="text-[12px] text-slate-500">
                هذا الإجراء لا يمكن التراجع عنه.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBookingToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                حذف الحجز
              </button>
            </div>
          </div>
        </div>
      )}

      {isVisaModalOpen && (
        <VisaBookingModal
          onClose={() => setIsVisaModalOpen(false)}
          language={language}
          initialScanMode={true}
        />
      )}
    </div>
  );
}
