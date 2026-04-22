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
}

export interface Supplier {
  id: string;
  agency_id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface Customer {
  id: string;
  agency_id: string;
  name: string;
  phone: string;
  email: string;
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
  date: string;
}

interface AppState {
  user: User | null;
  customers: Customer[];
  suppliers: Supplier[];
  bookings: Booking[];
  transactions: Transaction[];
  isLoading: boolean;
  
  // Auth
  login: (user: User) => void;
  logout: () => void;
  
  // Fetching
  fetchData: () => Promise<void>;
  
  // Mutations
  addCustomer: (customer: Omit<Customer, 'id' | 'agency_id'>) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'agency_id'>) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id' | 'agency_id' | 'created_at'>) => Promise<Booking | null>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'agency_id'>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  customers: [],
  suppliers: [],
  bookings: [],
  transactions: [],
  isLoading: true,

  login: (user) => {
    set({ user });
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

  fetchData: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true });

    try {
      const [customersRes, suppliersRes, bookingsRes, txRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
      ]);

      set({
        customers: customersRes.data || [],
        suppliers: suppliersRes.data || [],
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
    const { user } = get();
    if (!user) return;

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
    } else {
      console.error(error);
      toast.error('حدث خطأ أثناء إضافة العميل', { id: toastId });
    }
  },

  addSupplier: async (supplier) => {
    const { user } = get();
    if (!user) return;

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

  addBooking: async (booking) => {
    const { user } = get();
    if (!user) return null;

    const toastId = toast.loading('جاري إضافة الحجز...');

    const { data, error } = await supabase
      .from('bookings')
      .insert([{ ...booking, agency_id: user.agency_id }])
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
    const { user } = get();
    if (!user) return;

    const toastId = toast.loading('جاري تسجيل الحركة المالية...');

    // Handle undefined booking_id for Supabase
    const payload = {
      ...transaction,
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
  }
}));
