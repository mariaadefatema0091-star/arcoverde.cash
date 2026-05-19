import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Lock, CheckCircle2, Clock } from 'lucide-react';
import { MOCK_MISSIONS } from '../constants.ts';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext.tsx';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase.ts';

export default function Missions() {
  const { session } = useUser();
  const [filter, setFilter] = useState('Todas');
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>(MOCK_MISSIONS);
  const categories = ['Todas', 'Gastronomia', 'Supermercado', 'Varejo', 'Moda', 'Serviços'];

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Load missions from local storage
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
      return;
    }

    // Carregar missões do Firebase
    const q = query(collection(db, 'missions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const missionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMissions(missionsData);
      }
    }, (error) => {
      console.error("Firebase Missions Error:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkCooldown = () => {
      if (!session?.user?.id) return;
      const lastMission = localStorage.getItem(`last_mission_${session.user.id}`);
      if (lastMission) {
        const diff = Date.now() - parseInt(lastMission);
        const cooldown = 24 * 60 * 60 * 1000; // 24h
        
        if (diff < cooldown) {
          const remaining = cooldown - diff;
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${minutes}min`);
        } else {
          setTimeLeft(null);
        }
      }
    };

    checkCooldown();
    const timer = setInterval(checkCooldown, 60000);
    return () => clearInterval(timer);
  }, [session]);

  const filteredMissions = filter === 'Todas' 
    ? missions 
    : missions.filter(m => m.category === filter);

  return (
    <div className="pb-32 animate-in fade-in duration-500">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-headline font-bold text-on-surface">Missões em Arcoverde</h1>
        <p className="text-sm text-secondary">Avalie os parceiros locais e ganhe recompensas.</p>
      </header>

      {/* Notice Card */}
      <section className="mx-5 my-6 p-4 bg-tertiary-container/10 border-l-4 border-tertiary rounded-r-2xl flex gap-3 shadow-sm">
        <Info className="text-tertiary shrink-0" size={20} />
        <div>
          <p className="text-xs text-on-tertiary-container leading-relaxed">
            Você pode realizar apenas <span className="font-bold">1 missão a cada 24 horas</span>.
          </p>
          {timeLeft && (
            <p className="text-[10px] text-tertiary font-bold mt-1 flex items-center gap-1">
              <Clock size={12} /> Próxima missão disponível em: {timeLeft}
            </p>
          )}
        </div>
      </section>

      {/* Filter Chips */}
      <div className="flex gap-2 mx-5 overflow-x-auto pb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                : 'bg-white text-secondary border border-outline-variant/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Missions Grid */}
      <section className="mx-5 space-y-5">
        <AnimatePresence mode="popLayout">
          {filteredMissions.map((mission, index) => {
            const isFirstMission = index === 0 && filter === 'Todas';
            const lastMissionTime = session?.user?.id ? localStorage.getItem(`last_mission_${session.user.id}`) : null;
            const isBlockedByTime = !!timeLeft;
            
            // Lógica: A primeira missão SEMPRE é liberada se o cronômetro estiver limpo.
            // Outras missões mostram "Aguarde" mais explicitamente.
            const status = isBlockedByTime ? 'blocked' : 'available';

            return (
              <motion.div
                key={mission.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass-card p-4 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all ${
                  status === 'blocked' ? 'opacity-70 grayscale-[0.5]' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="relative h-40 w-full rounded-xl overflow-hidden bg-outline-variant/30">
                  <img 
                    src={mission.image} 
                    alt={mission.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <div className="bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={8} className="text-white" />
                      </div>
                      <span className="text-[8px] font-bold text-on-surface/80 uppercase">Parceiro Oficial</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      status === 'available' ? 'bg-primary-container text-white border border-primary/20' : 'bg-secondary text-white'
                    }`}>
                      {status === 'available' ? 'Liberada' : 'Bloqueada'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{mission.category}</span>
                  <h3 className="font-headline font-bold text-lg text-on-surface">{mission.title}</h3>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${
                    status === 'available' ? 'text-primary' : 'text-secondary'
                  }`}>
                    {status === 'available' ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                    <span>
                      {status === 'available' 
                        ? `Recompensa Total: R$ ${mission.reward.toFixed(2)}` 
                        : `Missão disponível em breve...`}
                    </span>
                  </div>
                </div>

                {status === 'available' ? (
                  <Link
                    to={`/missions/review?id=${mission.id}`}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-headline font-bold text-center text-sm shadow-md transition-all active:scale-95"
                  >
                    INICIAR PESQUISA
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-outline-variant/50 text-secondary/50 py-3.5 rounded-xl font-headline font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock size={16} />
                    {timeLeft ? `AGUARDE ${timeLeft}` : 'BLOQUEADO'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>
    </div>
  );
}
