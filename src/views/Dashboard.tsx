import { motion } from 'motion/react';
import { Flame, ArrowRight, ShoppingCart, Fuel, Group } from 'lucide-react';
import { MOCK_MISSIONS } from '../constants.ts';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext.tsx';
import { useEffect, useState } from 'react';
import { getUserTransactions } from '../lib/supabase.ts';

export default function Dashboard() {
  const { balance, transactions, session } = useUser();

  return (
    <div className="pb-32 animate-in fade-in duration-500">
      {/* Streak Section */}
      <section className="mx-5 my-6 p-4 rounded-2xl glass-card flex items-center gap-4 border border-outline-variant/30">
        <div className="w-14 h-14 bg-tertiary-fixed rounded-full flex flex-col items-center justify-center shadow-inner border shadow-tertiary/10">
          <Flame className="text-tertiary fill-tertiary" size={24} />
          <span className="font-bold text-xs text-tertiary">0</span>
        </div>
        <div className="flex-1">
          <h2 className="font-headline font-bold text-on-surface text-balance">Sua jornada começou!</h2>
          <p className="text-xs text-secondary mt-0.5">Próxima missão: <span className="font-bold text-primary">R$ 5,50</span></p>
          <div className="mt-3 h-1.5 w-full bg-outline-variant/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: balance > 0 ? '100%' : '10%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full reward-gradient" 
            />
          </div>
        </div>
      </section>

      {/* Bento Missions Grid */}
      <section className="mx-5 space-y-4">
        <div className="relative h-64 rounded-2xl overflow-hidden shadow-md group">
          <img 
            src={MOCK_MISSIONS[0].image} 
            alt={MOCK_MISSIONS[0].title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="bg-primary-container text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">Missão de Hoje</span>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="font-headline font-bold text-xl">{MOCK_MISSIONS[0].title}</h3>
                <p className="text-sm opacity-80">Faça suas compras e ganhe agora</p>
              </div>
              <div className="text-right">
                <span className="text-tertiary-container font-bold text-xl">+ R$ {MOCK_MISSIONS[0].reward.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-2xl flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div className="bg-primary/10 p-2 rounded-xl text-primary"><Fuel size={20} /></div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-none">Saldo Atual</span>
            </div>
            <div>
              <p className="text-xl font-headline font-bold text-primary">R$ {balance.toFixed(2).replace('.', ',')}</p>
              <p className="text-[10px] text-green-600 font-bold mt-1">Dinheiro disponível</p>
            </div>
          </div>
          
          <div className="glass-card p-4 rounded-2xl flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div className="bg-tertiary/10 p-2 rounded-xl text-tertiary"><Group size={20} /></div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-none">Missões</span>
            </div>
            <div className="flex flex-col">
              <p className="text-xl font-headline font-bold text-tertiary">{transactions.length}</p>
              <p className="text-[10px] text-secondary font-bold mt-1">Concluídas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Button */}
      <div className="mx-5 mt-6">
        <Link 
          to="/missions"
          className="w-full bg-primary hover:bg-primary/90 text-white font-headline font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 group"
        >
          Ver Todas as Missões
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Activity */}
      <section className="mx-5 mt-8">
        <h3 className="font-headline font-bold text-on-surface mb-4">Atividade Recente</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl text-center border-2 border-dashed border-outline-variant/20">
              <p className="text-secondary text-sm">Nenhuma atividade ainda. Comece sua primeira missão!</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-outline-variant/10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  tx.type === 'cashback' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                }`}>
                  {tx.type === 'cashback' ? <ShoppingCart size={24} /> : <Fuel size={24} />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface text-sm uppercase">{tx.store}</p>
                  <p className="text-[10px] text-secondary">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === 'cashback' ? 'text-primary' : 'text-on-surface'}`}>
                    {tx.type === 'cashback' ? '+' : '-'} R$ {FloatToBRL(tx.amount)}
                  </p>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">{tx.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Admin Access (Subtle) */}
      <div className="mx-5 mt-12 pb-10">
        <Link 
          to="/admin"
          className="text-[10px] text-outline-variant hover:text-primary font-bold uppercase tracking-widest block text-center py-4 border-t border-outline-variant/10"
        >
          Acessar Painel Gestor
        </Link>
      </div>
    </div>
  );
}

function FloatToBRL(val: number) {
  return val.toFixed(2).replace('.', ',');
}
