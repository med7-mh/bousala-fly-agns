import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Lazy loaded components for Code Splitting and faster load times on mobile
const Landing = lazy(() => import('./pages/Landing'));
const DownloadPage = lazy(() => import('./pages/Download'));
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Settings = lazy(() => import('./pages/Settings'));
const Employees = lazy(() => import('./pages/Employees'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const Reports = lazy(() => import('./pages/Reports'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

function AuthGuard({ children }: { children: React.ReactNode }) {
  const login = useStore(state => state.login);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    
    // Fallback timer to force unblock after 5 seconds if Supabase hangs
    const timeoutTimer = setTimeout(() => {
      console.warn("Auth initialization timed out, forcing unblock.");
      if (isSubscribed) setIsInitializing(false);
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session && isSubscribed) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*, agencies(created_at, subscription_plan, subscription_expires_at)')
            .eq('id', session.user.id)
            .single();
          
          if (data && isSubscribed) {
            const agencyInfo = Array.isArray(data.agencies) ? data.agencies[0] : (data.agencies as any);
            login({
              id: data.id,
              agency_id: data.agency_id,
              name: data.full_name,
              role: data.role,
              email: session.user.email,
              subscriptionPlan: agencyInfo?.subscription_plan || 'free',
              subscriptionExpiresAt: agencyInfo?.subscription_expires_at || null,
              agencyCreatedAt: agencyInfo?.created_at || new Date().toISOString(),
            });
          } else if (error && isSubscribed) {
            console.error("Auth Guard Profile Error:", error);
            if (error.code === 'PGRST116') {
              await supabase.auth.signOut();
              useStore.setState({ user: null, customers: [], bookings: [], transactions: [], isLoading: false });
            }
          }
        } else if (isSubscribed) {
          useStore.setState({ user: null, customers: [], bookings: [], transactions: [], isLoading: false });
        }
      } catch (err) {
        console.error("Initialize Auth Error:", err);
      } finally {
        if (isSubscribed) {
          clearTimeout(timeoutTimer);
          setIsInitializing(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore initial session load if handled by getSession
      if (event === 'INITIAL_SESSION') return;
      
      if (session) {
        // Fire and forget, don't block the onAuthStateChange listener
        supabase.from('profiles').select('*, agencies(created_at, subscription_plan, subscription_expires_at)').eq('id', session.user.id).single()
          .then(({ data, error }) => {
            if (!isSubscribed) return;
            if (data) {
              const agencyInfo = Array.isArray(data.agencies) ? data.agencies[0] : (data.agencies as any);
              login({
                id: data.id,
                agency_id: data.agency_id,
                name: data.full_name,
                role: data.role,
                email: session.user.email,
                subscriptionPlan: agencyInfo?.subscription_plan || 'free',
                subscriptionExpiresAt: agencyInfo?.subscription_expires_at || null,
                agencyCreatedAt: agencyInfo?.created_at || new Date().toISOString(),
              });
            } else if (error) {
              console.error("Auth Guard Profile Error on Change:", error);
              if (error.code === 'PGRST116') {
                // Do not await signOut here to prevent Supabase GoTrue lock deadlock
                supabase.auth.signOut().catch(() => {});
                useStore.setState({ user: null, customers: [], bookings: [], transactions: [], isLoading: false });
              }
            }
          });
      } else if (isSubscribed) {
        useStore.setState({ user: null, customers: [], bookings: [], transactions: [], isLoading: false });
      }
    });

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutTimer);
      subscription.unsubscribe();
    };
  }, []); // Run once on mount

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">جاري تهيئة النظام...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'inherit',
            fontSize: '14px',
            direction: 'rtl'
          }
        }} 
      />
      <BrowserRouter>
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="employees" element={<Employees />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<AdminCoupons />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthGuard>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
