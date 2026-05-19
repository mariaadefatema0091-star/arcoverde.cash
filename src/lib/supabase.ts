import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Limpa a URL caso o usuário cole com /rest/v1/ ou barra no final
const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const isValidUrl = (url: string) => {
  try {
    return url && url.startsWith('http') && url.includes('.supabase.co');
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = !!(isValidUrl(supabaseUrl) && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl as string, supabaseAnonKey) 
  : null;

export async function getUserBalance(userId: string): Promise<number> {
  const localTxs = JSON.parse(localStorage.getItem(`txs_${userId}`) || '[]');
  const localBalance = localTxs.reduce((acc: number, tx: any) => {
    const amt = Number(tx.amount) || 0;
    // Saques reduzem o saldo imediatamente (ficam como 'reserva'), 
    // Recompensas só somam se estiverem 'completed'
    if (tx.type === 'withdrawal') return acc - amt;
    if (tx.type === 'cashback' && tx.status === 'completed') return acc + amt;
    return acc;
  }, 0);

  if (!supabase) return localBalance;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type, status')
      .eq('user_id', userId);
      
    if (error) throw error;
    if (!data) return localBalance;
    
    const dbBalance = data.reduce((acc: number, tx: any) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'withdrawal') return acc - amt;
      if (tx.type === 'cashback' && tx.status === 'completed') return acc + amt;
      return acc;
    }, 0);

    return dbBalance + localBalance;
  } catch (err) {
    console.warn("Retornando apenas saldo local devido a erro no DB:", err);
    return localBalance;
  }
}

export async function getUserTransactions(userId: string) {
  const localTxs = JSON.parse(localStorage.getItem(`txs_${userId}`) || '[]').map((tx: any) => ({
    ...tx,
    isLocal: true
  }));

  if (!supabase) return localTxs;
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Mesclar e remover duplicados por ID
    const dbData = data || [];
    const dbIds = new Set(dbData.map((tx: any) => tx.id));
    const uniqueLocal = localTxs.filter((tx: any) => !dbIds.has(tx.id));
    
    return [...dbData, ...uniqueLocal].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    console.warn("Retornando apenas transações locais devido a erro no DB:", err);
    return localTxs;
  }
}
