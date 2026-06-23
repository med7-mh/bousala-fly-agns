import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  RefreshCw,
  ScanLine,
  UserPlus,
  CreditCard,
  UploadCloud,
  FileImage,
} from "lucide-react";
import { useStore, Customer, Supplier, Booking } from "../store/useStore";
import toast from "react-hot-toast";
import { Type } from "@google/genai";
import { getGeminiClient } from "../lib/gemini";

interface VisaBookingModalProps {
  onClose: () => void;
  language?: string;
  initialScanMode?: boolean;
}

export default function VisaBookingModal({
  onClose,
  language = "ar",
  initialScanMode = false,
}: VisaBookingModalProps) {
  const {
    customers,
    suppliers,
    addBooking,
    addCustomer,
    addTransaction,
    activeStaff,
    customPaymentMethods,
  } = useStore();

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

  const [mrzInput, setMrzInput] = useState("");
  const [scanMode, setScanMode] = useState(initialScanMode);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualGivenNames, setManualGivenNames] = useState("");
  const [manualSurname, setManualSurname] = useState("");
  const [manualPassport, setManualPassport] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [scannedName, setScannedName] = useState("");
  const [scannedSurname, setScannedSurname] = useState("");
  const [scannedPassport, setScannedPassport] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [description, setDescription] = useState("تأشيرة");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [advancePayment, setAdvancePayment] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (scanMode && scanInputRef.current && !isAnalyzing) {
      scanInputRef.current.focus();
    }
  }, [scanMode, isAnalyzing]);

  const filteredCustomers = customers
    .filter(
      (c) =>
        c.name.includes(customerSearch) ||
        c.phone?.includes(customerSearch) ||
        c.passport_number?.includes(customerSearch),
    )
    .slice(0, 5);

  const visaSuppliers = suppliers; // Should probably filter for visa agents if there was a category

  // Fast parsing for MRZ (Machine Readable Zone of Passport TD3)
  const parseMRZ = (mrzText: string, showError = true) => {
    // 2 lines of 44 chars or 3 lines of 30 or continuous string
    const text = mrzText.replace(/\s+/g, "").toUpperCase();
    if (text.length >= 60) {
      // Tolerate shorter strings for TD1/TD2

      // Try to find the start of the P line (Passport) or I/A/C (ID Card)
      const pIndex = text.search(/[P|I|A|C]/);

      if (pIndex !== -1) {
        // Very basic parsing for demo - in production use a dedicated MRZ library
        const mrzData = text.substring(pIndex);

        let givenNames = "";
        let surname = "";
        let passportNum = "";

        if (mrzData[0] === "P") {
          // Passport TD3
          const line1 = mrzData.substring(0, 44);
          const line2 = mrzData.substring(44, 88);
          const nameData = line1.substring(5).split("<<");
          surname = (nameData[0] || "")
            .replace(/</g, " ")
            .replace(/[^A-Z ]/g, "")
            .trim();
          givenNames = (nameData[1] || "")
            .replace(/</g, " ")
            .replace(/[^A-Z ]/g, "")
            .trim();
          passportNum = line2
            .substring(0, 9)
            .replace(/</g, "")
            .replace(/O/g, "0");
        } else {
          // ID Card TD1
          const line1 = mrzData.substring(0, 30);
          const line2 = mrzData.substring(30, 60);
          const line3 = mrzData.substring(60, 90);
          passportNum = line1
            .substring(5, 14)
            .replace(/</g, "")
            .replace(/O/g, "0");
          const nameData = line3.split("<<");
          surname = (nameData[0] || "")
            .replace(/</g, " ")
            .replace(/[^A-Z ]/g, "")
            .trim();
          givenNames = (nameData[1] || "")
            .replace(/</g, " ")
            .replace(/[^A-Z ]/g, "")
            .trim();
        }

        if (surname || givenNames || passportNum) {
          setScannedName(givenNames || "مجهول");
          setScannedSurname(surname || "مجهول");
          setScannedPassport(passportNum || "غير_معروف");

          // Check if customer exists
          const existingCustomer = customers.find(
            (c) =>
              (c.passport_number &&
                passportNum &&
                c.passport_number.includes(passportNum)) ||
              (c.national_id &&
                passportNum &&
                c.national_id.includes(passportNum)) ||
              (c.name.toUpperCase().includes(givenNames) &&
                givenNames.length > 2),
          );

          if (existingCustomer) {
            setCustomerId(existingCustomer.id);
            setCustomerSearch(existingCustomer.name);
            toast.success("تم العثور على العميل من قاعدة البيانات");
          } else {
            setCustomerId("new"); // create new automatically
            toast.success(
              "تم استخراج البيانات بنجاح - سيتم إنشاء ملف عميل جديد",
            );
          }

          setScanMode(false);
          setMrzInput("");
          return true; // Success
        }
      }
    }

    if (showError) {
      toast.error(
        "لم نتمكن من قراءة البيانات بدقة، يرجى إدخال البيانات يدوياً",
      );
    }
    setMrzInput("");
    return false; // Failed
  };

  const handleMrzKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseMRZ(mrzInput);
    }
  };

  // --- Drag and Drop File Handlers ---
  const handleDrag = function (e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function (e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImage(e.target.files[0]);
    }
  };

  const handleImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة فقط");
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeProgress(0);

    // Simulate upload and inference progress
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 10) + 5;
      if (currentProgress > 90) currentProgress = 90;
      setAnalyzeProgress(currentProgress);
    }, 500);

    try {
      const base64EncodeString = await new Promise<string>(
        (resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result.split(",")[1]);
            } else {
              reject(new Error("Failed to convert to base64"));
            }
          };
          reader.onerror = (error) => reject(error);
        },
      );

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64EncodeString,
                mimeType: file.type,
              },
            },
            {
              text: "Extract the Given Names, Surname, and Document/Passport Number from this ID/Passport. If it is an ID, the Given Names represent the first and middle name, and the Surname represents the last name or family name. Extract exactly as they appear. Also resolve any Arabic names to English if possible, or provide them exactly.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              givenNames: {
                type: Type.STRING,
                description: "The first names or given names",
              },
              surname: {
                type: Type.STRING,
                description: "The last name or surname",
              },
              documentNumber: {
                type: Type.STRING,
                description: "The passport number or national ID number",
              },
            },
            required: ["givenNames", "surname", "documentNumber"],
          },
        },
      });

      let jsonStr = response.text?.trim() || "{}";
      // Clean up markdown wrapper if present
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr
          .replace(/^```json\n?/, "")
          .replace(/\n?```$/, "")
          .trim();
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr
          .replace(/^```\n?/, "")
          .replace(/\n?```$/, "")
          .trim();
      }

      const extractedData = JSON.parse(jsonStr);

      const givenNames = extractedData.givenNames?.toUpperCase() || "";
      const surname = extractedData.surname?.toUpperCase() || "";
      const passportNum = extractedData.documentNumber?.toUpperCase() || "";

      if (surname || givenNames || passportNum) {
        setScannedName(givenNames || "مجهول");
        setScannedSurname(surname || "مجهول");
        setScannedPassport(passportNum || "غير_معروف");

        // Check if customer exists
        const existingCustomer = customers.find(
          (c) =>
            (c.passport_number &&
              passportNum &&
              c.passport_number.includes(passportNum)) ||
            (c.national_id &&
              passportNum &&
              c.national_id.includes(passportNum)) ||
            (c.name.toUpperCase().includes(givenNames) &&
              givenNames.length > 2),
        );

        if (existingCustomer) {
          setCustomerId(existingCustomer.id);
          setCustomerSearch(existingCustomer.name);
          toast.success("تم العثور على العميل من قاعدة البيانات");
        } else {
          setCustomerId("new"); // create new automatically
          toast.success("تم استخراج البيانات بنجاح - سيتم إنشاء ملف عميل جديد");
        }

        setScanMode(false);
      } else {
        toast.error(
          "لم نتمكن من العثور على بيانات واضحة في الصورة، يرجى الإدخال اليدوي",
        );
        setIsManualEntry(true);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        "حدث خطأ أثناء تحليل الصورة: " + (err?.message || "خطأ غير معروف"),
      );
      setIsManualEntry(true);
    } finally {
      clearInterval(progressInterval);
      setAnalyzeProgress(100);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalyzeProgress(0);
      }, 600);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!costPrice || !sellingPrice) {
      toast.error("الرجاء تعبئة الأسعار");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustomerId = customerId;

      // Auto create new customer if scanned or manual entry
      if (customerId === "new" || isManualEntry) {
        if (isManualEntry && (!manualGivenNames || !manualSurname)) {
          toast.error("الرجاء إدخال الاسم الأول واسم العائلة");
          setIsSubmitting(false);
          return;
        }

        const customerName = isManualEntry
          ? `${manualGivenNames} ${manualSurname}`.trim()
          : `${scannedName} ${scannedSurname}`.trim();
        const passportNum = isManualEntry ? manualPassport : scannedPassport;
        const phone = isManualEntry ? manualPhone : "";

        const newCust = await addCustomer({
          name: customerName,
          phone: phone,
          email: "",
          passport_number: passportNum,
          notes: isManualEntry
            ? "تم إضافة العميل يدوياً"
            : "تم الإنشاء تلقائياً عبر السكانر",
        });
        if (newCust) {
          finalCustomerId = newCust.id;
        } else {
          toast.error("فشل إنشاء العميل");
          setIsSubmitting(false);
          return;
        }
      }

      const bookingData = {
        customer_id: finalCustomerId,
        supplier_id: supplierId || undefined,
        type: "visa" as const,
        description: description,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        status: "pending" as const,
      };

      const newBooking = await addBooking(bookingData);

      if (newBooking && advancePayment && Number(advancePayment) > 0) {
        await addTransaction({
          booking_id: newBooking.id,
          type: "income",
          amount: Number(advancePayment),
          description: `دفعة مقدمة - تأشيرة - ${activeStaff ? " الموظف: " + activeStaff.name : ""}`,
          payment_method: paymentMethod,
          date: new Date().toISOString(),
        });
      }

      toast.success("تمت إضافة التأشيرة بنجاح");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 p-4 sm:p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-300">
              <ScanLine className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                إصدار تأشيرة السفر
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                سجل التأشيرة أو امسح صورة الجواز للإدخال السريع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {/* DRAG AND DROP ZONE */}
          <div
            className={`mb-6 p-6 rounded-2xl border-2 border-dashed transition-all duration-200 relative overflow-hidden ${
              dragActive
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : isAnalyzing
                  ? "border-emerald-500 bg-emerald-50"
                  : scanMode
                    ? "border-purple-400 bg-purple-50"
                    : "border-slate-300 bg-slate-100 hover:border-slate-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (!isAnalyzing && !scanMode && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Hidden Input for direct MRZ scanner keyboard emulation */}
            <input
              ref={scanInputRef}
              type="text"
              value={mrzInput}
              onChange={(e) => setMrzInput(e.target.value)}
              onKeyDown={handleMrzKeyDown}
              className={`absolute top-0 right-0 w-1 h-1 opacity-0 ${scanMode ? "z-20" : "-z-10"}`}
              autoComplete="off"
            />

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center text-emerald-700 py-4">
                <div className="w-16 h-16 mb-4 relative drop-shadow-sm">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-emerald-100"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-500 ease-out"
                      strokeDasharray={`${analyzeProgress}, 100`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-emerald-600 text-lg">
                    {analyzeProgress}%
                  </div>
                </div>
                <h4 className="font-bold text-lg mb-1">جاري تحليل الصورة...</h4>
                <p className="text-sm opacity-80">
                  يتم استخراج البيانات باستخدام الذكاء الاصطناعي
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="flex gap-4 mb-4">
                  <div
                    className={`p-4 rounded-full ${scanMode ? "bg-purple-100 text-purple-600" : "bg-white shadow text-blue-500"}`}
                  >
                    <UploadCloud className="w-8 h-8" />
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-1">
                  اسحب وأفلت صورة الجواز هنا
                </h4>
                <p className="text-slate-500 text-sm mb-4">
                  أو انقر لاختيار ملف من جهازك. يدعم (JPG, PNG)
                </p>

                <div className="flex items-center w-full gap-4">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    أو للسكانر السريع
                  </span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScanMode(!scanMode);
                    if (!scanMode) setCustomerId("");
                  }}
                  className={`mt-4 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
                    scanMode
                      ? "bg-purple-600 hover:bg-purple-700 text-white animate-pulse"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <ScanLine className="w-4 h-4" />
                  {scanMode
                    ? "وضع القارئ السريع يعمل (جاهز للمسح)..."
                    : "تفعيل قارئ MRZ السريع (الباركود)"}
                </button>
              </div>
            )}
          </div>

          <form id="visa-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-slate-800">بيانات العميل</h4>
                </div>

                {!scannedPassport ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث لاختيار عميل موجود..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setCustomerId("");
                        }}
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {customerSearch && !customerId && (
                      <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setCustomerId(c.id);
                                setCustomerSearch(c.name);
                              }}
                              className="p-3 border-b border-slate-100 hover:bg-emerald-50 cursor-pointer text-sm"
                            >
                              <div className="font-semibold">{c.name}</div>
                              {c.passport_number && (
                                <div className="text-xs text-slate-500">
                                  جواز: {c.passport_number}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-slate-500 text-center">
                            لا توجد نتائج
                          </div>
                        )}
                      </div>
                    )}

                    {!customerSearch && !customerId && !isManualEntry && (
                      <div className="text-center p-4 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm bg-slate-50">
                        الرجاء اختيار العميل للبدء
                        <br />
                        أو استخدم إسقاط الصورة للأعلى لاستخراج البيانات
                        <div className="mt-4 border-t border-slate-200 pt-3">
                          <button
                            type="button"
                            onClick={() => setIsManualEntry(true)}
                            className="text-blue-600 font-semibold text-sm hover:underline"
                          >
                            + إضافة عميل جديد يدوياً
                          </button>
                        </div>
                      </div>
                    )}

                    {isManualEntry && !scannedPassport && (
                      <div className="space-y-3 bg-blue-50 border border-blue-200 p-4 rounded-xl relative">
                        <button
                          type="button"
                          onClick={() => setIsManualEntry(false)}
                          className="absolute top-3 left-3 text-slate-500 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-2">
                          إضافة بيانات العميل يدوياً
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">
                              الاسم الأول *
                            </label>
                            <input
                              type="text"
                              placeholder="محمد..."
                              value={manualGivenNames}
                              onChange={(e) =>
                                setManualGivenNames(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">
                              اسم العائلة *
                            </label>
                            <input
                              type="text"
                              placeholder="الغامدي..."
                              value={manualSurname}
                              onChange={(e) => setManualSurname(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">
                            رقم الجواز / الهوية
                          </label>
                          <input
                            type="text"
                            placeholder="A12345678"
                            value={manualPassport}
                            onChange={(e) => setManualPassport(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">
                            رقم الجوال
                          </label>
                          <input
                            type="text"
                            placeholder="0500000000"
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}

                    {customerId && customerId !== "new" && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex justify-between items-center text-sm font-semibold">
                        <span>العميل: {customerSearch}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerId("");
                            setCustomerSearch("");
                          }}
                          className="text-emerald-600 hover:text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded"
                        >
                          تغيير
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 bg-blue-50 border border-blue-200 p-4 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
                    <div className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-2">
                      بيانات الجواز المستخرجة
                    </div>
                    <div>
                      <div className="text-xs text-blue-700 mb-1 font-semibold">
                        الاسم الأول (Given Names)
                      </div>
                      <div
                        className="font-mono bg-white px-2 py-1 border border-blue-100 rounded text-slate-800"
                        dir="ltr"
                      >
                        {scannedName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-700 mb-1 font-semibold">
                        اسم العائلة (Surname)
                      </div>
                      <div
                        className="font-mono bg-white px-2 py-1 border border-blue-100 rounded text-slate-800"
                        dir="ltr"
                      >
                        {scannedSurname}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-700 mb-1 font-semibold">
                        رقم الجواز (Passport No.)
                      </div>
                      <div
                        className="font-mono bg-white px-2 py-1 border border-blue-100 rounded text-slate-800"
                        dir="ltr"
                      >
                        {scannedPassport}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScannedPassport("");
                        setScannedName("");
                        setScannedSurname("");
                        setCustomerId("");
                      }}
                      className="w-full mt-2 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg text-sm transition-colors"
                    >
                      إلغاء وإعادة المحاولة
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <h4 className="font-bold text-slate-800">
                    بيانات العملية المالية
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    المورد ( السفارة / الوكيل )
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">-- اختر المورد --</option>
                    {visaSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    بيان التأشيرة (أرقام التأشيرة أو نوعها)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: تأشيرة عمل - السعودية..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-red-600 mb-1">
                      سعر التكلفة *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={costPrice}
                      onChange={(e) =>
                        setCostPrice(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="w-full px-3 py-2 border border-red-200 bg-red-50 focus:bg-white rounded-lg text-sm focus:ring-2 focus:ring-red-500 text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-600 mb-1">
                      سعر البيع *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={sellingPrice}
                      onChange={(e) =>
                        setSellingPrice(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50 focus:bg-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-slate-700">
                      استلام دفعة مقدمة الآن (عربون)
                    </label>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="المبلغ المستلم"
                        value={advancePayment}
                        onChange={(e) =>
                          setAdvancePayment(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        className="w-full px-3 py-2 border border-blue-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-left"
                        dir="ltr"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        {paymentMethodsList.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.label}
                          </option>
                        ))}
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                  </div>
                  {Number(sellingPrice) > 0 && Number(advancePayment) > 0 && (
                    <div className="mt-2 text-xs font-semibold flex justify-between bg-white px-2 py-1.5 border border-slate-100 rounded">
                      <span className="text-slate-500">
                        المتبقي على العميل:
                      </span>
                      <span className="text-red-500">
                        {Number(sellingPrice) - Number(advancePayment)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="visa-form"
            disabled={(!customerId && !isManualEntry) || isSubmitting}
            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> جاري الحفظ...
              </>
            ) : (
              "حفظ وإصدار"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
