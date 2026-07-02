import { create } from "zustand";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export type Role = "admin" | "agent";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "documents_received"
  | "processing"
  | "ready"
  | "delivered";
export type BookingType = "flight" | "hotel" | "visa" | "tour" | "passport";
export type TransactionType = "income" | "expense" | "operating_expense";

export interface User {
  id: string;
  agency_id: string;
  name: string;
  role: Role;
  email?: string;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string | null;
  agencyCreatedAt?: string;
}

export interface Supplier {
  id: string;
  agency_id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface Employee {
  id: string;
  agency_id: string;
  name: string;
  position: string;
  phone: string;
  salary: number;
  join_date: string;
}

export interface Customer {
  id: string;
  agency_id: string;
  name: string;
  phone: string;
  email: string;
  national_id?: string;
  passport_number?: string;
  notes: string;
}

export interface Booking {
  id: string;
  agency_id: string;
  customer_id: string;
  supplier_id?: string;
  type: BookingType;
  description: string;
  cost_price: number;
  selling_price: number;
  status: BookingStatus;
  created_at?: string;
  national_id?: string;
  receipt_number?: string;
  expected_date?: string;
}

export interface Transaction {
  id: string;
  agency_id: string;
  booking_id?: string;
  customer_id?: string;
  supplier_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  payment_method?: string;
  employee_id?: string;
  date: string;
}

export interface LocalStaff {
  id?: string;
  name: string;
  pin: string;
  role?: "manager" | "staff" | "staff_2";
}

export type Language = "ar" | "fr";

interface AppState {
  user: User | null;
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  bookings: Booking[];
  transactions: Transaction[];
  isLoading: boolean;
  language: Language;

  // Local Staff (POS Mode)
  staffMembers: LocalStaff[];
  activeStaff: LocalStaff | null;
  loadStaffList: () => Promise<void>;
  addStaff: (
    name: string,
    pin: string,
    role: "manager" | "staff" | "staff_2",
  ) => Promise<void>;
  removeStaff: (name: string) => Promise<void>;
  setActiveStaff: (staff: LocalStaff | null) => void;

  // Auth
  login: (user: User) => void;
  logout: () => void;
  setLanguage: (lang: Language) => void;

  // Fetching
  fetchData: () => Promise<void>;

  // Subscription
  isSubscriptionExpired: () => boolean;

  // Mutations
  addCustomer: (
    customer: Omit<Customer, "id" | "agency_id">,
  ) => Promise<Customer | undefined>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (
    supplier: Omit<Supplier, "id" | "agency_id">,
  ) => Promise<Supplier | undefined>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addEmployee: (
    employee: Omit<Employee, "id" | "agency_id" | "created_at">,
  ) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addBooking: (
    booking: Omit<Booking, "id" | "agency_id" | "created_at">,
  ) => Promise<Booking | null>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "agency_id">,
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Custom Booking Types
  customBookingTypes: string[];
  addCustomBookingType: (type: string) => Promise<void>;
  removeCustomBookingType: (type: string) => Promise<void>;

  // Custom Payment Methods
  customPaymentMethods: string[];
  addCustomPaymentMethod: (method: string) => Promise<void>;
  removeCustomPaymentMethod: (method: string) => Promise<void>;

  loadAgencySettings: () => Promise<void>;
  saveAgencySettingsToDb: (updates: Record<string, any>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  customers: [],
  suppliers: [],
  employees: [],
  bookings: [],
  transactions: [],
  isLoading: true,
  language: "ar",

  staffMembers: [],
  activeStaff: null,
  customBookingTypes: [],
  customPaymentMethods: [],

  loadStaffList: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("agency_staff")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        const mappedData = data.map((staff: any) => {
          if (staff.name && staff.name.endsWith("___staff_2")) {
            return { ...staff, name: staff.name.replace("___staff_2", ""), role: "staff_2" };
          }
          return staff;
        });
        set({ staffMembers: mappedData });
        localStorage.setItem(`staff_${user.agency_id}`, JSON.stringify(mappedData));
      } else {
        const stored = localStorage.getItem(`staff_${user.agency_id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const migrated = parsed.map((item: any) =>
            typeof item === "string" ? { name: item, pin: "0000" } : item,
          );
          set({ staffMembers: migrated });
        }
      }
    } catch {}
  },

  addStaff: async (
    name: string,
    pin: string,
    role: "manager" | "staff" | "staff_2" = "staff",
  ) => {
    const { user, staffMembers } = get();
    // Allow up to 10 staff maybe? The user removed limits or maybe they want more than 3 now. Let's just remove the 3 staff limit or keep it?
    // "الموظفين الاخرين موظفين عاديين" implies maybe more than 3. Let's keep a higher limit, say 15.
    if (!user || staffMembers.length >= 15) {
      toast.error("لا يمكن إضافة أكثر من 15 موظف");
      return;
    }
    if (staffMembers.some((s) => s.name === name)) return;

    const dbName = role === "staff_2" ? `${name}___staff_2` : name;
    const dbRole = role === "staff_2" ? "staff" : role;

    const { data, error } = await supabase
      .from("agency_staff")
      .insert([{ agency_id: user.agency_id, name: dbName, pin, role: dbRole }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error in addStaff:", error);
      toast.error(error.message || "حدث خطأ في قاعدة البيانات أثناء إضافة الموظف");
      return;
    }

    const mappedData = { ...data, name: data.name.replace("___staff_2", ""), role };
    const newList = [...staffMembers, mappedData];
    localStorage.setItem(`staff_${user.agency_id}`, JSON.stringify(newList));
    set({ staffMembers: newList });
    toast.success("تم إضافة الموظف بنجاح");
  },

  removeStaff: async (name: string) => {
    const { user, staffMembers, activeStaff } = get();
    if (!user) return;
    
    // Only the main admin (when no local staff is active) can remove staff
    if (activeStaff) {
      toast.error("لا يمكن حذف الموظف إلا من قبل أدمن الوكالة (المدير الأساسي)");
      return;
    }

    const staff = staffMembers.find((s) => s.name === name);
    const dbName = staff?.role === "staff_2" ? `${name}___staff_2` : name;

    const { error } = await supabase
      .from("agency_staff")
      .delete()
      .eq("name", dbName)
      .eq("agency_id", user.agency_id);

    if (error) {
      console.error("Supabase delete error in removeStaff:", error);
      toast.error(error.message || "حدث خطأ أثناء حذف الموظف");
      return;
    }

    const newList = staffMembers.filter((s) => s.name !== name);
    localStorage.setItem(`staff_${user.agency_id}`, JSON.stringify(newList));

    set({
      staffMembers: newList,
      activeStaff: activeStaff?.name === name ? null : activeStaff,
    });
    toast.success("تم إزالة الموظف");
  },

  setActiveStaff: (staff: LocalStaff | null) => set({ activeStaff: staff }),

  login: (user) => {
    set({ user });
    get().loadStaffList();
    get().loadAgencySettings();
    get().fetchData();
  },

  logout: async () => {
    // Only attempt to sign out if we have an active session to prevent infinite loop loops in AuthGuard
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await supabase.auth.signOut();
    }
    set({
      user: null,
      customers: [],
      bookings: [],
      transactions: [],
      isLoading: false,
      customBookingTypes: [],
      customPaymentMethods: [],
    });
  },

  setLanguage: (lang) => set({ language: lang }),

  loadAgencySettings: async () => {
    const { user } = get();
    if (!user) return;

    // Load local storage first
    try {
      const storedTypes = localStorage.getItem(
        `custom_booking_types_${user.agency_id}`,
      );
      if (storedTypes) set({ customBookingTypes: JSON.parse(storedTypes) });
      const storedMethods = localStorage.getItem(
        `custom_payment_methods_${user.agency_id}`,
      );
      if (storedMethods)
        set({ customPaymentMethods: JSON.parse(storedMethods) });
    } catch (e) {}

    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("agency_id", user.agency_id)
        .eq("name", "__agency_settings__")
        .maybeSingle();

      if (!error && data && data.notes) {
        const parsed = JSON.parse(data.notes);
        if (Array.isArray(parsed.customBookingTypes)) {
          set({ customBookingTypes: parsed.customBookingTypes });
          localStorage.setItem(
            `custom_booking_types_${user.agency_id}`,
            JSON.stringify(parsed.customBookingTypes),
          );
        }
        if (Array.isArray(parsed.customPaymentMethods)) {
          set({ customPaymentMethods: parsed.customPaymentMethods });
          localStorage.setItem(
            `custom_payment_methods_${user.agency_id}`,
            JSON.stringify(parsed.customPaymentMethods),
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  saveAgencySettingsToDb: async (updates: Record<string, any>) => {
    const { user } = get();
    if (!user) return;
    try {
      const { data: existing, error } = await supabase
        .from("customers")
        .select("*")
        .eq("agency_id", user.agency_id)
        .eq("name", "__agency_settings__")
        .maybeSingle();

      let currentSettings = {};
      if (existing && existing.notes) {
        try {
          currentSettings = JSON.parse(existing.notes);
        } catch (e) {}
      }

      const newSettings = { ...currentSettings, ...updates };
      const jsonStr = JSON.stringify(newSettings);

      if (existing) {
        await supabase
          .from("customers")
          .update({ notes: jsonStr })
          .eq("id", existing.id);
      } else {
        await supabase.from("customers").insert([
          {
            agency_id: user.agency_id,
            name: "__agency_settings__",
            notes: jsonStr,
            phone: "",
            email: "",
          },
        ]);
      }
    } catch (e) {
      console.error("Failed to save settings to DB:", e);
    }
  },

  addCustomBookingType: async (type: string) => {
    const { user, customBookingTypes } = get();
    if (!user) return;
    const trimmed = type.trim();
    if (!trimmed || customBookingTypes.includes(trimmed)) return;
    const newList = [...customBookingTypes, trimmed];
    localStorage.setItem(
      `custom_booking_types_${user.agency_id}`,
      JSON.stringify(newList),
    );
    set({ customBookingTypes: newList });
    toast.success("تم إضافة نوع الخدمة المخصصة بنجاح");
    await get().saveAgencySettingsToDb({ customBookingTypes: newList });
  },

  removeCustomBookingType: async (type: string) => {
    const { user, customBookingTypes } = get();
    if (!user) return;
    const newList = customBookingTypes.filter((t) => t !== type);
    localStorage.setItem(
      `custom_booking_types_${user.agency_id}`,
      JSON.stringify(newList),
    );
    set({ customBookingTypes: newList });
    toast.success("تم إزالة نوع الخدمة المخصصة بنجاح");
    await get().saveAgencySettingsToDb({ customBookingTypes: newList });
  },

  addCustomPaymentMethod: async (method: string) => {
    const { user, customPaymentMethods } = get();
    if (!user) return;
    const trimmed = method.trim();
    if (!trimmed || customPaymentMethods.includes(trimmed)) return;
    const newList = [...customPaymentMethods, trimmed];
    localStorage.setItem(
      `custom_payment_methods_${user.agency_id}`,
      JSON.stringify(newList),
    );
    set({ customPaymentMethods: newList });
    toast.success("تم إضافة وسيلة دفع بنجاح");
    await get().saveAgencySettingsToDb({ customPaymentMethods: newList });
  },

  removeCustomPaymentMethod: async (method: string) => {
    const { user, customPaymentMethods } = get();
    if (!user) return;
    const newList = customPaymentMethods.filter((t) => t !== method);
    localStorage.setItem(
      `custom_payment_methods_${user.agency_id}`,
      JSON.stringify(newList),
    );
    set({ customPaymentMethods: newList });
    toast.success("تم إزالة وسيلة الدفع بنجاح");
    await get().saveAgencySettingsToDb({ customPaymentMethods: newList });
  },

  isSubscriptionExpired: () => {
    const { user } = get();
    if (!user) return true;

    if (user.subscriptionPlan === "premium") {
      if (!user.subscriptionExpiresAt) return false;
      return new Date(user.subscriptionExpiresAt) < new Date();
    }

    // Free plan
    if (!user.agencyCreatedAt) return false;

    const createdDate = new Date(user.agencyCreatedAt);
    const trialEndDate = new Date(
      createdDate.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    return new Date() > trialEndDate;
  },

  fetchData: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true });

    try {
      const [customersRes, suppliersRes, employeesRes, bookingsRes, txRes] =
        await Promise.all([
          supabase
            .from("customers")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("suppliers")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("employees")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("bookings")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("transactions")
            .select("*")
            .order("date", { ascending: false }),
        ]);

      const rawCustomers = customersRes.data || [];
      const cleanCustomers = rawCustomers.filter(
        (c) => c.name !== "__agency_settings__",
      );
      const settingsCust = rawCustomers.find(
        (c) => c.name === "__agency_settings__",
      );
      let dbCustomTypes: string[] = [];
      let dbCustomMethods: string[] = [];

      if (settingsCust && settingsCust.notes) {
        try {
          const parsed = JSON.parse(settingsCust.notes);
          if (Array.isArray(parsed.customBookingTypes)) {
            dbCustomTypes = parsed.customBookingTypes;
          }
          if (Array.isArray(parsed.customPaymentMethods)) {
            dbCustomMethods = parsed.customPaymentMethods;
          }
        } catch (e) {
          console.error(e);
        }
      }

      set({
        customers: cleanCustomers,
        suppliers: suppliersRes.data || [],
        employees: employeesRes.data || [],
        bookings: bookingsRes.data || [],
        transactions: txRes.data || [],
        customBookingTypes:
          dbCustomTypes.length > 0 ? dbCustomTypes : get().customBookingTypes,
        customPaymentMethods:
          dbCustomMethods.length > 0
            ? dbCustomMethods
            : get().customPaymentMethods,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomer: async (customer) => {
    const { user, isSubscriptionExpired } = get();
    if (!user) return undefined;

    if (isSubscriptionExpired()) {
      toast.error(
        "انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة بيانات.",
      );
      return undefined;
    }

    // Toast Loading...
    const toastId = toast.loading("جاري إضافة العميل...");

    const { data, error } = await supabase
      .from("customers")
      .insert([{ ...customer, agency_id: user.agency_id }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ customers: [data, ...state.customers] }));
      toast.success("تمت إضافة العميل بنجاح", { id: toastId });
      return data;
    } else {
      console.error(error);
      toast.error("حدث خطأ أثناء إضافة العميل", { id: toastId });
      return undefined;
    }
  },

  updateCustomer: async (id, updates) => {
    const { user } = get();
    const { error, data } = await supabase
      .from("customers")
      .update({ ...updates, agency_id: user?.agency_id })
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      }));
      toast.success("تم تحديث بيانات العميل");
    } else {
      console.error(error || "No rows updated. RLS policy might be blocking.");
      toast.error("حدث خطأ أثناء تحديث بيانات العميل");
    }
  },

  deleteCustomer: async (id) => {
    const { error, data } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      }));
      toast.success("تم حذف العميل");
    } else {
      console.error(error || "No rows deleted.");
      toast.error("حدث خطأ أثناء حذف العميل");
    }
  },

  addSupplier: async (supplier) => {
    const { user, isSubscriptionExpired } = get();
    if (!user) return undefined;

    if (isSubscriptionExpired()) {
      toast.error(
        "انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة بيانات.",
      );
      return undefined;
    }

    const toastId = toast.loading("جاري إضافة المورد...");

    const { data, error } = await supabase
      .from("suppliers")
      .insert([{ ...supplier, agency_id: user.agency_id }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ suppliers: [data, ...state.suppliers] }));
      toast.success("تمت إضافة المورد بنجاح", { id: toastId });
      return data;
    } else {
      console.error(error);
      toast.error("حدث خطأ أثناء إضافة المورد", { id: toastId });
      return undefined;
    }
  },

  updateSupplier: async (id, updates) => {
    const { user } = get();
    const { error, data } = await supabase
      .from("suppliers")
      .update({ ...updates, agency_id: user?.agency_id })
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        suppliers: state.suppliers.map((s) =>
          s.id === id ? { ...s, ...updates } : s,
        ),
      }));
      toast.success("تم تحديث بيانات المورد");
    } else {
      console.error(error || "No rows updated.");
      toast.error("حدث خطأ أثناء تحديث بيانات المورد");
    }
  },

  deleteSupplier: async (id) => {
    const { error, data } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
      }));
      toast.success("تم حذف المورد");
    } else {
      console.error(error || "No rows deleted.");
      toast.error("حدث خطأ أثناء حذف المورد");
    }
  },

  addEmployee: async (employee) => {
    const { user, isSubscriptionExpired } = get();
    if (!user) return;

    if (isSubscriptionExpired()) {
      toast.error(
        "انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة بيانات.",
      );
      return;
    }

    const toastId = toast.loading("جاري إضافة الموظف...");

    const { data, error } = await supabase
      .from("employees")
      .insert([{ ...employee, agency_id: user.agency_id }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ employees: [data, ...state.employees] }));
      toast.success("تمت إضافة الموظف بنجاح", { id: toastId });
    } else {
      console.error(error);
      toast.error("حدث خطأ أثناء إضافة الموظف", { id: toastId });
    }
  },

  updateEmployee: async (id, updates) => {
    const { user } = get();
    const { error, data } = await supabase
      .from("employees")
      .update({ ...updates, agency_id: user?.agency_id })
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        employees: state.employees.map((e) =>
          e.id === id ? { ...e, ...updates } : e,
        ),
      }));
      toast.success("تم تحديث بيانات الموظف");
    } else {
      console.error(error || "No rows updated.");
      toast.error("حدث خطأ أثناء تحديث بيانات الموظف");
    }
  },

  deleteEmployee: async (id) => {
    const { error, data } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
      }));
      toast.success("تم حذف الموظف");
    } else {
      console.error(error || "No rows deleted.");
      toast.error("حدث خطأ أثناء حذف الموظف");
    }
  },

  addBooking: async (booking) => {
    const { user, activeStaff, isSubscriptionExpired } = get();
    if (!user) return null;

    if (isSubscriptionExpired()) {
      toast.error(
        "انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة الحجوزات.",
      );
      return null;
    }

    const finalDescription = activeStaff
      ? `${booking.description} | @staff:${activeStaff.name}`
      : booking.description;

    const toastId = toast.loading("جاري إضافة الحجز...");

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          ...booking,
          description: finalDescription,
          agency_id: user.agency_id,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ bookings: [data, ...state.bookings] }));
      toast.success("تمت إضافة الحجز بنجاح", { id: toastId });
      return data;
    } else {
      console.error(error);
      toast.error("حدث خطأ أثناء إضافة الحجز", { id: toastId });
      return null;
    }
  },

  updateBooking: async (id, updates) => {
    const { user } = get();
    const { error, data } = await supabase
      .from("bookings")
      .update({ ...updates, agency_id: user?.agency_id })
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === id ? { ...b, ...updates } : b,
        ),
      }));
      toast.success("تم تحديث الحجز بنجاح");
    } else {
      console.error(error || "No rows updated.");
      toast.error("حدث خطأ أثناء تحديث الحجز");
    }
  },

  deleteBooking: async (id) => {
    const { error, data } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) }));
      toast.success("تم حذف الحجز بنجاح");
    } else {
      console.error(error || "No rows deleted.");
      toast.error("حدث خطأ أثناء حذف الحجز");
    }
  },

  updateBookingStatus: async (id, status) => {
    // Optimistic Update
    const { user } = get();
    const previousBookings = get().bookings;
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));

    const { error, data } = await supabase
      .from("bookings")
      .update({ status, agency_id: user?.agency_id })
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      // Revert on error
      set({ bookings: previousBookings });
      toast.error("لم يتم تحديث حالة الحجز، حدث خطأ ما!");
      console.error(error || "No rows updated.");
    } else {
      toast.success("تم تحديث حالة الحجز");
    }
  },

  addTransaction: async (transaction) => {
    const { user, activeStaff, isSubscriptionExpired } = get();
    if (!user) return;

    if (isSubscriptionExpired()) {
      toast.error(
        "انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة تسجيل الحركات.",
      );
      return;
    }

    const finalDescription = activeStaff
      ? `${transaction.description} | @staff:${activeStaff.name}`
      : transaction.description;

    const toastId = toast.loading("جاري تسجيل الحركة المالية...");

    // Handle undefined booking_id for Supabase
    const payload = {
      ...transaction,
      description: finalDescription,
      agency_id: user.agency_id,
      booking_id: transaction.booking_id || null, // Ensure null instead of empty string or undefined
      customer_id: transaction.customer_id || null,
      supplier_id: transaction.supplier_id || null,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ transactions: [data, ...state.transactions] }));
      toast.success("تم تسجيل الحركة المالية بنجاح", { id: toastId });
    } else {
      console.error(error);
      toast.error("خطأ! لم يتم تسجيل الحركة المالية", { id: toastId });
    }
  },

  updateTransaction: async (id, updates) => {
    const { user } = get();
    const { error, data } = await supabase
      .from("transactions")
      .update({ ...updates, agency_id: user?.agency_id })
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        ),
      }));
      toast.success("تم تحديث الحركة المالية بنجاح");
    } else {
      console.error(error || "No rows updated.");
      toast.error("حدث خطأ أثناء تحديث الحركة");
    }
  },

  deleteTransaction: async (id) => {
    const { error, data } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .select();
    if (!error && data && data.length > 0) {
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
      toast.success("تم حذف الحركة المالية");
    } else {
      console.error(error || "No rows deleted.");
      toast.error("حدث خطأ أثناء حذف الحركة المالية");
    }
  },
}));
