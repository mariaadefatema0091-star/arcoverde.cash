import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, DollarSign, Plus, 
  Image as ImageIcon, Wallet, Tag, Store, 
  Trash2, RefreshCw, LogOut, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, onSnapshot, orderBy, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  where
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../lib/firebase.ts';
import { MOCK_MISSIONS } from '../constants.ts';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'finance' | 'missions' | 'settings'>('finance');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Logout function
  const handleLogout = async () => {
    if (!isFirebaseConfigured) {
      localStorage.removeItem('demo_admin_logged_in');
      navigate('/admin/login');
      return;
    }
    await signOut(auth);
    navigate('/admin/login');
  };

  // Load Missions (Real-time)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      const fetchMissionsLocal = () => {
        const cached = localStorage.getItem('demo_missions');
        if (cached) {
          try {
            setMissions(JSON.parse(cached));
          } catch (e) {
            setMissions(MOCK_MISSIONS);
          }
        } else {
          localStorage.setItem('demo_missions', JSON.stringify(MOCK_MISSIONS));
          setMissions(MOCK_MISSIONS);
        }
        setIsLoading(false);
      };
      
      fetchMissionsLocal();
      window.addEventListener('storage', fetchMissionsLocal);
      return () => window.removeEventListener('storage', fetchMissionsLocal);
    }

    const q = query(collection(db, 'missions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMissions(missionsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error loading missions:", error);
      if (missions.length === 0) setMissions(MOCK_MISSIONS);
    });
    return () => unsubscribe();
  }, []);

  // Load Transactions (Real-time withdrawals)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      const fetchTransactionsLocal = () => {
        const cached = localStorage.getItem('demo_global_transactions');
        if (cached) {
          try {
            const allTxs = JSON.parse(cached);
            const pendingWithdrawals = allTxs.filter((tx: any) => tx.type === 'withdrawal' && tx.status === 'pending');
            setRequests(pendingWithdrawals);
          } catch (e) {
            setRequests([]);
          }
        } else {
          setRequests([]);
        }
      };
      
      fetchTransactionsLocal();
      window.addEventListener('storage', fetchTransactionsLocal);
      
      // Polling rápido para sincronização na mesma página
      const interval = setInterval(fetchTransactionsLocal, 2000);
      
      return () => {
        window.removeEventListener('storage', fetchTransactionsLocal);
        clearInterval(interval);
      };
    }

    const q = query(
      collection(db, 'transactions'), 
      where('type', '==', 'withdrawal'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
    }, (error) => {
      console.error("Error loading requests:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'completed' | 'rejected') => {
    if (!isFirebaseConfigured) {
      try {
        const cachedGlobal = localStorage.getItem('demo_global_transactions');
        let userId = '';
        if (cachedGlobal) {
          const txs = JSON.parse(cachedGlobal);
          const updated = txs.map((tx: any) => {
            if (tx.id === id) {
              tx.status = newStatus;
              userId = tx.user_id;
            }
            return tx;
          });
          localStorage.setItem('demo_global_transactions', JSON.stringify(updated));
        }

        if (userId) {
          const cachedUser = localStorage.getItem(`txs_${userId}`);
          if (cachedUser) {
            const userTxs = JSON.parse(cachedUser);
            const userUpdated = userTxs.map((tx: any) => {
              if (tx.id === id) {
                tx.status = newStatus;
              }
              return tx;
            });
            localStorage.setItem(`txs_${userId}`, JSON.stringify(userUpdated));
          }
        }

        const cached = localStorage.getItem('demo_global_transactions');
        if (cached) {
          const allTxs = JSON.parse(cached);
          const pending = allTxs.filter((tx: any) => tx.type === 'withdrawal' && tx.status === 'pending');
          setRequests(pending);
        }

        alert(newStatus === 'completed' ? 'Saque marcado como PAGO com sucesso!' : 'Saque recusado.');
      } catch (err: any) {
        alert('Erro ao atualizar: ' + err.message);
      }
      return;
    }

    try {
      await updateDoc(doc(db, 'transactions', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      alert(newStatus === 'completed' ? 'Saque marcado como PAGO!' : 'Saque recusado.');
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  const handleCreateMission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const missionData = {
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      category: formData.get('category') as string,
      reward: parseFloat(formData.get('reward') as string),
      image: formData.get('image') as string || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      status: 'available',
      questions: [
        `O atendimento no estabelecimento "${formData.get('title')}" foi adequado?`,
        `A variedade de opções atendeu a sua expectativa?`,
        `As instalações físicas estavam limpas e organizadas?`,
        `O tempo de espera para concluir a compra foi aceitável?`,
        `Você indicaria este estabelecimento local para outros amigos?`
      ]
    };

    if (!isFirebaseConfigured) {
      try {
        const cached = localStorage.getItem('demo_missions') || '[]';
        const currentMissions = JSON.parse(cached);
        const updated = [{ ...missionData, createdAt: new Date().toISOString() }, ...currentMissions];
        localStorage.setItem('demo_missions', JSON.stringify(updated));
        
        setMissions(updated);
        setShowCreateModal(false);
        alert('Missão criada localmente com sucesso!');
      } catch (err: any) {
        alert('Erro ao criar missão: ' + err.message);
      }
      return;
    }

    const firebaseMissionData = {
      title: missionData.title,
      category: missionData.category,
      reward: missionData.reward,
      image: missionData.image,
      status: missionData.status,
      questions: missionData.questions,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'missions'), firebaseMissionData);
      setShowCreateModal(false);
      alert('Missão criada com sucesso!');
    } catch (err: any) {
      alert('Erro ao criar missão: ' + err.message);
    }
  };

  const deleteMission = async (id: string) => {
    if (confirm('Deseja realmente excluir esta missão?')) {
      if (!isFirebaseConfigured) {
        try {
          const cached = localStorage.getItem('demo_missions') || '[]';
          const currentMissions = JSON.parse(cached);
          const filtered = currentMissions.filter((m: any) => m.id !== id);
          localStorage.setItem('demo_missions', JSON.stringify(filtered));
          setMissions(filtered);
          alert('Missão excluída localmente.');
        } catch (err: any) {
          alert('Erro ao excluir: ' + err.message);
        }
        return;
      }

      try {
        await deleteDoc(doc(db, 'missions', id));
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-32 animate-in fade-in duration-700">
      <header className="bg-white px-5 py-4 flex justify-between items-center border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <h1 className="font-headline font-bold text-primary tracking-tight">Painel Gestor</h1>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="text-secondary hover:text-error transition-colors">
            <LogOut size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary overflow-hidden border">
            <img src={`https://ui-avatars.com/api/?name=${auth.currentUser?.email || 'Admin'}`} alt="Admin" />
          </div>
        </div>
      </header>

      <div className="bg-white px-5 border-b sticky top-[65px] z-40">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('finance')}
            className={`py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'finance' ? 'border-primary text-primary' : 'border-transparent text-secondary'
            }`}
          >
            Financeiro
          </button>
          <button 
            onClick={() => setActiveTab('missions')}
            className={`py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'missions' ? 'border-primary text-primary' : 'border-transparent text-secondary'
            }`}
          >
            Missões
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-secondary'
            }`}
          >
            Configuração
          </button>
        </div>
      </div>

      <main className="px-5 mt-6">
        {activeTab === 'finance' ? (
          <div className="animate-in slide-in-from-left-4 duration-500 space-y-6">
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
              <div className="min-w-[200px] bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Clock size={20} /></div>
                  <span className="text-[10px] text-red-500 font-bold">Pendentes</span>
                </div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Aguardando Saque</p>
                <p className="text-lg font-headline font-bold">{requests.length} Pedidos</p>
              </div>
              <div className="min-w-[200px] bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={20} /></div>
                </div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Média de Saque</p>
                <p className="text-lg font-headline font-bold">R$ 150,00</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="p-4 border-b bg-surface-container-low flex justify-between items-center">
                <h3 className="font-headline font-bold text-sm">Saques Pendentes</h3>
                <RefreshCw size={18} className="text-secondary" />
              </div>
              
              <div className="divide-y divide-outline-variant/10">
                {requests.length === 0 ? (
                  <div className="p-10 text-center">
                    <Clock className="mx-auto text-outline-variant mb-2" size={32} />
                    <p className="text-sm text-secondary">Nenhum saque pendente no momento.</p>
                  </div>
                ) : (
                  requests.map((req) => (
                    <div key={req.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary-container text-primary font-bold flex items-center justify-center">
                            U
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-tight">{req.userId?.substring(0, 8)}...</p>
                            <p className="text-[10px] text-secondary leading-tight mt-0.5">
                              {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : 'Recent'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-headline font-bold text-primary">R$ {req.amount?.toFixed(2).replace('.', ',')}</p>
                          <p className="text-[10px] text-secondary font-mono mt-0.5">{req.pixKey || 'PIX não informado'}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          className="px-4 py-2 text-xs font-bold text-error bg-error/10 rounded-lg active:scale-95 transition-transform"
                        >
                          Recusar
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'completed')}
                          className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg shadow-sm active:scale-95 transition-transform"
                        >
                          Pagar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'missions' ? (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg">Gerenciar Missões</h3>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-white p-2 rounded-full shadow-lg active:scale-95 transition-transform"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {missions.length === 0 && !isLoading && (
                <div className="p-10 text-center bg-white rounded-2xl border border-dashed">
                  <p className="text-sm text-secondary">Nenhuma missão cadastrada no Firebase.</p>
                  <button onClick={() => setShowCreateModal(true)} className="text-primary font-bold text-xs mt-2 underline">Criar Primeira Missão</button>
                </div>
              )}
              {missions.map((mission) => (
                <div key={mission.id} className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/10 flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={mission.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{mission.category}</span>
                      <span className="text-[10px] font-bold text-primary">R$ {mission.reward?.toFixed(2)}</span>
                    </div>
                    <h4 className="font-headline font-bold text-on-surface">{mission.title}</h4>
                    <p className="text-[10px] text-secondary mt-1">Status: {mission.status === 'available' ? 'Ativa' : 'Bloqueada'}</p>
                  </div>
                    <button 
                      onClick={() => deleteMission(mission.id)}
                      className="self-center p-2 text-secondary hover:text-error transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
              <h3 className="font-headline font-bold text-lg mb-4 text-primary">
                {!isFirebaseConfigured ? 'Simulação de Parcerias' : 'Configurações do Firebase'}
              </h3>
              <p className="text-sm text-secondary mb-6">
                {!isFirebaseConfigured 
                  ? 'Você está visualizando o banco local no Modo Demonstração. As missões criadas aqui ficarão salvas localmente e estarão disponíveis imediatamente para jogar.'
                  : 'O painel agora está integrado ao Firebase Firestore. Os dados são sincronizados em tempo real entre todos os dispositivos.'}
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <p className="text-xs font-bold text-secondary mb-1">E-mail do Admin</p>
                  <p className="text-sm font-bold text-on-surface">
                    {isFirebaseConfigured ? auth.currentUser?.email : 'admin@casharcoverde.com (Modo Demo)'}
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-[11px] text-primary font-bold">Dica de Segurança:</p>
                  <p className="text-[11px] text-secondary mt-1">
                    {!isFirebaseConfigured
                      ? 'No Modo Demonstração, todas as configurações e aprovações PIX de saque acontecem instantaneamente no armazenamento local do seu navegador.'
                      : 'Não compartilhe sua senha administrativa. O acesso é restrito aos emails autorizados nas Security Rules.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[32px] z-[101] p-8 pb-12 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8" />
              <h3 className="text-2xl font-headline font-bold text-primary mb-6">Nova Missão</h3>
              
              <form onSubmit={handleCreateMission} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary flex items-center gap-2">
                    <Store size={14} /> Nome da Loja
                  </label>
                  <input name="title" required placeholder="Ex: Farmácia Central" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary flex items-center gap-2">
                      <Tag size={14} /> Categoria
                    </label>
                    <select name="category" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 outline-none text-sm">
                      <option>Saúde</option>
                      <option>Gastronomia</option>
                      <option>Supermercado</option>
                      <option>Varejo</option>
                      <option>Moda</option>
                      <option>Serviços</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary flex items-center gap-2">
                      <Wallet size={14} /> Recompensa (R$)
                    </label>
                    <input name="reward" type="number" step="0.01" required placeholder="5,00" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 outline-none text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary flex items-center gap-2">
                    <ImageIcon size={14} /> URL da Imagem
                  </label>
                  <input name="image" placeholder="https://..." className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 outline-none text-sm" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 text-xs font-bold text-secondary bg-surface-container-low rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 text-xs font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20"
                  >
                    Salvar Missão
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="mt-8 px-5 text-center text-[10px] text-secondary/60">
        <p>© 2024 Cash Arcoverde - Gestão Firebase</p>
        <p className="mt-1 italic">Ambiente Seguro. Último login: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
}
