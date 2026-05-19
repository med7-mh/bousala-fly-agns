import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export type Role = 'admin' | 'agent';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'documents_received' | 'processing' | 'ready' | 'delivered';
export type BookingType = 'flight' | 'hotel' | 'visa' | 'tour' | 'passport';
export type TransactionType = 'income' | 'expense' | 'operating_expense';

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
  role?: 'manager' | 'staff';
}

export type Language = 'ar' | 'fr';

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
  addStaff: (name: string, pin: string, role: 'manager' | 'staff') => Promise<void>;
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
  addCustomer: (customer: Omit<Customer, 'id' | 'agency_id'>) => Promise<Customer | undefined>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'agency_id'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id' | 'agency_id' | 'created_at'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'agency_id' | 'created_at'>) => Promise<Booking | null>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'agency_id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  customers: [],
  suppliers: [],
  employees: [],
  bookings: [],
  transactions: [],
  isLoading: true,
  language: 'ar',
  
  staffMembers: [],
  activeStaff: null,

  loadStaffList: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('agency_staff')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (!error && data) {
         set({ staffMembers: data });
      } else {
        const stored = localStorage.getItem(`staff_${user.agency_id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const migrated = parsed.map((item: any) => 
            typeof item === 'string' ? { name: item, pin: '0000' } : item
          );
          set({ staffMembers: migrated });
        }
      }
    } catch { }
  },

  addStaff: async (name: string, pin: string, role: 'manager' | 'staff' = 'staff') => {
    const { user, staffMembers } = get();
    // Allow up to 10 staff maybe? The user removed limits or maybe they want more than 3 now. Let's just remove the 3 staff limit or keep it?
    // "الموظفين الاخرين موظفين عاديين" implies maybe more than 3. Let's keep a higher limit, say 15.
    if (!user || staffMembers.length >= 15) {
      toast.error('لا يمكن إضافة أكثر من 15 موظف');
      return;
    }
    if (staffMembers.some(s => s.name === name)) return;
    
    const { data, error } = await supabase
      .from('agency_staff')
      .insert([{ agency_id: user.agency_id, name, pin, role }])
      .select()
      .single();

    let newList;
    if (error) {
       newList = [...staffMembers, { name, pin, role }];
       localStorage.setItem(`staff_${user.agency_id}`, JSON.stringify(newList));
    } else {
       newList = [...staffMembers, data];
    }
    set({ staffMembers: newList });
    toast.success('تم إضافة الموظف بنجاح');
  },

  removeStaff: async (name: string) => {
    const { user, staffMembers, activeStaff } = get();
    if (!user) return;
    
    await supabase.from('agency_staff').delete().eq('name', name).eq('agency_id', user.agency_id);
    
    const newList = staffMembers.filter(s => s.name !== name);
    localStorage.setItem(`staff_${user.agency_id}`, JSON.stringify(newList));
    
    set({ 
      staffMembers: newList,
      activeStaff: activeStaff?.name === name ? null : activeStaff 
    });
    toast.success('تم إزالة الموظف');
  },

  setActiveStaff: (staff: LocalStaff | null) => set({ activeStaff: staff }),

  login: (user) => {
    set({ user });
    get().loadStaffList();
    get().fetchData();
  },

  logout: async () => {
    // Only attempt to sign out if we have an active session to prevent infinite loop loops in AuthGuard
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await supabase.auth.signOut();
    }
    set({ user: null, customers: [], bookings: [], transactions: [], isLoading: false });
  },

  setLanguage: (lang) => set({ language: lang }),
  
  isSubscriptionExpired: () => {
    const { user } = get();
    if (!user) return true;
    
    if (user.subscriptionPlan === 'premium') {
      if (!user.subscriptionExpiresAt) return false;
      return new Date(user.subscriptionExpiresAt) < new Date();
    }
    
    // Free plan
    if (!user.agencyCreatedAt) return false;
    
    const createdDate = new Date(user.agencyCreatedAt);
    const trialEndDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return new Date() > trialEndDate;
  },

  fetchData: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true });

    try {
      const [customersRes, suppliersRes, employeesRes, bookingsRes, txRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
      ]);

      set({
        customers: customersRes.data || [],
        suppliers: suppliersRes.data || [],
        employees: employeesRes.data || [],
        bookings: bookingsRes.data || [],
        transactions: txRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomer: async (customer) => {
    const { user, isSubscriptionExpired } = get();
    if (!user) return undefined;
    
    if (isSubscriptionExpired()) {
       toast.error('انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة بيانات.');
       return undefined;
    }

    // Toast Loading...
    const toastId = toast.loading('جاري إضافة العميل...');

    const { data, error } = await supabase
      .from('customers')
      .insert([{ ...customer, agency_id: user.agency_id }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ customers: [data, ...state.customers] }));
      toast.success('تمت إضافة العميل بنجاح', { id: toastId });
      return data;
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء إضافة العميل', { id: toastId });
      return undefined;
    }
  },

  updateCustomer: async (id, updates) => {
    const { error } = await supabase.from('customers').update(updates).eq('id', id);
    if (!error) {
      set((state) => ({ customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
      toast.success('تم تحديث بيانات العميل');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث بيانات العميل');
    }
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
      toast.success('تم حذف العميل');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء حذف العميل');
    }
  },

  addSupplier: async (supplier) => {
    const { user, isSubscriptionExpired } = get();
    if (!user) return;

    if (isSubscriptionExpired()) {
       toast.error('انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة بيانات.');
       return;
    }

    const toastId = toast.loading('جاري إضافة المورد...');

    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...supplier, agency_id: user.agency_id }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ suppliers: [data, ...state.suppliers] }));
      toast.success('تمت إضافة المورد بنجاح', { id: toastId });
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء إضافة المورد', { id: toastId });
    }
  },

  updateSupplier: async (id, updates) => {
    const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
    if (!error) {
      set((state) => ({ suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)) }));
      toast.success('تم تحديث بيانات المورد');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث بيانات المورد');
    }
  },

  deleteSupplier: async (id) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) {
      set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
      toast.success('تم حذف المورد');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء حذف المورد');
    }
  },

  addEmployee: async (employee) => {
    const { user, isSubscriptionExpired } = get();
    if (!user) return;

    if (isSubscriptionExpired()) {
       toast.error('انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة بيانات.');
       return;
    }

    const toastId = toast.loading('جاري إضافة الموظف...');

    const { data, error } = await supabase
      .from('employees')
      .insert([{ ...employee, agency_id: user.agency_id }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ employees: [data, ...state.employees] }));
      toast.success('تمت إضافة الموظف بنجاح', { id: toastId });
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء إضافة الموظف', { id: toastId });
    }
  },

  updateEmployee: async (id, updates) => {
    const { error } = await supabase.from('employees').update(updates).eq('id', id);
    if (!error) {
      set((state) => ({ employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) }));
      toast.success('تم تحديث بيانات الموظف');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث بيانات الموظف');
    }
  },

  deleteEmployee: async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      set((state) => ({ employees: state.employees.filter((e) => e.id !== id) }));
      toast.success('تم حذف الموظف');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء حذف الموظف');
    }
  },

  addBooking: async (booking) => {
    const { user, activeStaff, isSubscriptionExpired } = get();
    if (!user) return null;

    if (isSubscriptionExpired()) {
       toast.error('انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة إضافة الحجوزات.');
       return null;
    }

    const finalDescription = activeStaff 
      ? `${booking.description} | @staff:${activeStaff.name}`
      : booking.description;

    const toastId = toast.loading('جاري إضافة الحجز...');

    const { data, error } = await supabase
      .from('bookings')
      .insert([{ ...booking, description: finalDescription, agency_id: user.agency_id }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ bookings: [data, ...state.bookings] }));
      toast.success('تمت إضافة الحجز بنجاح', { id: toastId });
      return data;
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء إضافة الحجز', { id: toastId });
      return null;
    }
  },

  updateBooking: async (id, updates) => {
    const { error } = await supabase.from('bookings').update(updates).eq('id', id);
    if (!error) {
      set((state) => ({ bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)) }));
      toast.success('تم تحديث الحجز بنجاح');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث الحجز');
    }
  },

  deleteBooking: async (id) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) {
      set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) }));
      toast.success('تم حذف الحجز بنجاح');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء حذف الحجز');
    }
  },

  updateBookingStatus: async (id, status) => {
    // Optimistic Update
    const previousBookings = get().bookings;
    set((state) => ({
      bookings: state.bookings.map(b => b.id === id ? { ...b, status } : b)
    }));

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      // Revert on error
      set({ bookings: previousBookings });
      toast.error('لم يتم تحديث حالة الحجز، حدث خطأ ما!');
      console.error(error);
    } else {
      toast.success('تم تحديث حالة الحجز');
    }
  },

  addTransaction: async (transaction) => {
    const { user, activeStaff, isSubscriptionExpired } = get();
    if (!user) return;

    if (isSubscriptionExpired()) {
       toast.error('انتهت الفترة التجريبية. يرجى تفعيل الاشتراك لمواصلة تسجيل الحركات.');
       return;
    }

    const finalDescription = activeStaff
      ? `${transaction.description} | @staff:${activeStaff.name}`
      : transaction.description;

    const toastId = toast.loading('جاري تسجيل الحركة المالية...');

    // Handle undefined booking_id for Supabase
    const payload = {
      ...transaction,
      description: finalDescription,
      agency_id: user.agency_id,
      booking_id: transaction.booking_id || null // Ensure null instead of empty string or undefined
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ transactions: [data, ...state.transactions] }));
      toast.success('تم تسجيل الحركة المالية بنجاح', { id: toastId });
    } else {
      console.error(error);
      toast.error('خطأ! لم يتم تسجيل الحركة المالية', { id: toastId });
    }
  },

  updateTransaction: async (id, updates) => {
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (!error) {
      set((state) => ({ transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)) }));
      toast.success('تم تحديث الحركة المالية بنجاح');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث الحركة');
    }
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
      toast.success('تم حذف الحركة المالية');
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء حذف الحركة المالية');
    }
  }
}));
