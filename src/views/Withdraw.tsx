import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Landmark, TrendingUp, Info, History, Check } from 'lucide-react';
import { useUser } from '../context/UserContext.tsx';
import { getUserTransactions, supabase } from '../lib/supabase.ts';

export default function Withdraw() {
  const { balance, session, transactions, refreshBalance } = useUser();
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount > balance) {
      alert('Saldo insuficiente!');
      return;
    }

    if (withdrawAmount < 5) {
      alert('O valor mínimo de saque é R$ 5,00');
      return;
    }

    setIsSubmitting(true);
    
    if (session?.user?.id) {
      if (!supabase) {
        const newTx = {
          id: Math.random().toString(36).substr(2, 9),
          user_id: session.user.id,
          amount: withdrawAmount,
          type: 'withdrawal',
          status: 'pending',
          store: 'Saque PIX',
          pix_key: pixKey,
          created_at: new Date().toISOString()
        };
        const localTxs = JSON.parse(localStorage.getItem(`txs_${session.user.id}`) || '[]');
        localStorage.setItem(`txs_${session.user.id}`, JSON.stringify([newTx, ...localTxs]));
        
        // Também salvar no pool global para o Admin ler e autorizar
        const globalTxs = JSON.parse(localStorage.getItem('demo_global_transactions') || '[]');
        localStorage.setItem('demo_global_transactions', JSON.stringify([newTx, ...globalTxs]));

        await refreshBalance();
        
        alert('Solicitação de saque enviada! (Modo Demo: Seu saldo será atualizado após ser aprovado no Painel Gestor)');
        setPixKey('');
        setAmount('');
        setIsSubmitting(false);
        return;
      }

      try {
        const { error } = await supabase.from('transactions').insert([{
          user_id: session.user.id,
          amount: withdrawAmount,
          type: 'withdrawal',
          status: 'pending',
          store: 'Saque PIX',
          pix_key: pixKey
        }]);

        if (error) {
          if (error.code === 'PGRST205' || error.code === 'PGRST204') {
            const isMissingColumn = error.code === 'PGRST204';
            console.warn(isMissingColumn ? 'Coluna pix_key ausente. Usando fallback local.' : 'Tabela transactions não encontrada no saque. Usando fallback local.');
            
            const newTx = {
              id: Math.random().toString(36).substr(2, 9),
              user_id: session.user.id,
              amount: withdrawAmount,
              type: 'withdrawal',
              status: 'pending',
              store: 'Saque PIX',
              pix_key: pixKey,
              created_at: new Date().toISOString()
            };
            const localTxs = JSON.parse(localStorage.getItem(`txs_${session.user.id}`) || '[]');
            localStorage.setItem(`txs_${session.user.id}`, JSON.stringify([newTx, ...localTxs]));
            
            // Também salvar no pool global
            const globalTxs = JSON.parse(localStorage.getItem('demo_global_transactions') || '[]');
            localStorage.setItem('demo_global_transactions', JSON.stringify([newTx, ...globalTxs]));

            if (isMissingColumn) {
              alert('AVISO: Seu banco de dados precisa ser atualizado! Salvamos seu saque localmente. Vá no Painel Gestor > Configuração para atualizar!');
            } else {
              alert('Aviso: Banco de dados não configurado. Saque registrado localmente por enquanto.');
            }
          } else {
            throw error;
          }
        }
        
        await refreshBalance();
        
        alert('Solicitação de saque enviada! Seu saldo será atualizado após a aprovação.');
        setPixKey('');
        setAmount('');
      } catch (err: any) {
        console.error('Withdraw error:', err);
        alert('Erro ao solicitar saque: ' + err.message);
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="pb-32 px-5 py-6 animate-in slide-in-from-right-4 duration-500">
      {/* Wallet Hero */}
      <section className="mb-8 relative overflow-hidden rounded-2xl bg-primary text-white p-6 shadow-xl shadow-primary/20">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Saldo Disponível</p>
          <h1 className="text-3xl font-headline font-bold mt-1">R$ {balance.toFixed(2).replace('.', ',')}</h1>
          <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-full text-[10px] font-bold">
            <Check size={14} className="bg-white text-primary rounded-full p-0.5" />
            CONTA ATIVA
          </div>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Landmark size={120} />
        </div>
      </section>

      {/* Withdrawal Form */}
      <section className="mb-10">
        <div className="glass-card p-6 rounded-2xl border border-white">
          <h2 className="text-xl font-headline font-bold text-on-surface mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-primary" />
            Solicitar Saque
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] ml-1">Chave PIX</label>
              <input 
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, E-mail ou Celular"
                required
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] ml-1">Valor do Saque</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-secondary text-sm">R$</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  step="0.01"
                  min="5"
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="p-4 bg-tertiary-container/10 border-l-4 border-tertiary rounded-r-xl flex gap-3">
              <Info size={20} className="text-tertiary shrink-0" />
              <p className="text-[11px] text-on-tertiary-container leading-relaxed">
                Mínimo R$ 5,00. Analisado e processado em até <span className="font-bold">24 horas</span>.
              </p>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || balance < 5}
              className="w-full bg-primary hover:bg-primary/90 text-white font-headline font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-outline-variant/50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processando...' : 'Solicitar Saque via PIX'}
            </button>
          </form>
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="text-lg font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
          <History size={20} className="text-secondary" />
          Meus Saques
        </h2>
        <div className="space-y-3">
          {transactions.filter(t => t.type === 'withdrawal').length === 0 ? (
            <p className="text-xs text-secondary italic text-center py-4">Nenhum saque solicitado ainda.</p>
          ) : (
            transactions.filter(t => t.type === 'withdrawal').map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-xl flex justify-between items-center border border-outline-variant/10 shadow-sm">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-outline-variant/20 rounded-full flex items-center justify-center text-secondary">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">R$ {tx.amount.toFixed(2).replace('.', ',')}</p>
                    <p className="text-[10px] text-secondary">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tx.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                  }`}>
                    {tx.status === 'completed' ? 'Pago' : (tx.status === 'pending' ? 'Pendente' : tx.status)}
                  </span>
                  <p className="text-[9px] text-outline mt-1 font-mono uppercase truncate w-24">PIX: {tx.pix_key}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
