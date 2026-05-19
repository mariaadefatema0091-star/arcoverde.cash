/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Dashboard from './views/Dashboard.tsx';
import Auth from './views/Auth.tsx';
import Missions from './views/Missions.tsx';
import MissionReview from './views/MissionReview.tsx';
import Withdraw from './views/Withdraw.tsx';
import Admin from './views/Admin.tsx';
import AdminLogin from './views/AdminLogin.tsx';
import TopBar from './components/TopBar.tsx';
import BottomNav from './components/BottomNav.tsx';
import WithdrawalNotifications from './components/WithdrawalNotifications.tsx';
import { UserProvider, useUser } from './context/UserContext.tsx';
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './lib/firebase.ts';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const isLocalAdmin = localStorage.getItem('demo_admin_logged_in') === 'true';
      setIsAdmin(isLocalAdmin);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Para simplificar, permitimos qualquer usuário logado no Firebase (que deve ser o admin)
        // O controle real é feito nas Security Rules do Firestore
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isAdmin === null) return null;
  if (!isAdmin) return <Navigate to="/admin/login" />;

  return <>{children}</>;
}

function Layout() {
  const location = useLocation();
  const { session, isLoading } = useUser();

  const isAuthPage = location.pathname === '/auth';
  const isAdminPage = location.pathname.startsWith('/admin');
  const showNav = !isAuthPage && !isAdminPage;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redireciona para /auth se não houver sessão e não estiver nas páginas restritas
  if (!session && !isAuthPage && !isAdminPage) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      {showNav && <TopBar />}
      
      <main className="max-w-md mx-auto min-h-screen relative">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/missions/review" element={<MissionReview />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              } 
            />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/profile" element={<Auth />} />
          </Routes>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}
      {showNav && <WithdrawalNotifications />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <UserProvider>
        <Layout />
      </UserProvider>
    </Router>
  );
}

