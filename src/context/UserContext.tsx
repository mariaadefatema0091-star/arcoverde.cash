import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getUserBalance, getUserTransactions } from '../lib/supabase.ts';

interface UserContextType {
  session: any;
  balance: number;
  transactions: any[];
  refreshBalance: (forcedUserId?: string) => Promise<void>;
  isLoading: boolean;
  setDemoSession: (session: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = async (forcedUserId?: string) => {
    const userId = forcedUserId || session?.user?.id;
    if (userId) {
      const [b, txs] = await Promise.all([
        getUserBalance(userId),
        getUserTransactions(userId)
      ]);
      setBalance(b);
      setTransactions(txs);
    }
  };

  const setDemoSession = (newSession: any) => {
    setSession(newSession);
    if (newSession?.user?.id) {
      refreshBalance(newSession.user.id);
    } else {
      setBalance(0);
      setTransactions([]);
    }
  };

  useEffect(() => {
    if (!supabase) {
      const localSessionStr = localStorage.getItem('demo_user_session');
      if (localSessionStr) {
        try {
          const parsed = JSON.parse(localSessionStr);
          setSession(parsed);
          refreshBalance(parsed.user.id);
        } catch (e) {
          console.error("Error reading demo user session:", e);
        }
      }
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        refreshBalance(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        refreshBalance(session.user.id);
      } else {
        setBalance(0);
        setTransactions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ session, balance, transactions, refreshBalance, isLoading, setDemoSession }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
