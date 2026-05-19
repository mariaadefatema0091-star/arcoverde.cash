import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Info, CheckCircle2, PartyPopper, ArrowRight, Plane, Store } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.ts';
import { useUser } from '../context/UserContext.tsx';
import { MOCK_MISSIONS } from '../constants.ts';

export default function MissionReview() {
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get('id') || 'm1';
  
  // Encontrar a missão nas missões locais ou mock
  const [mission] = useState<any>(() => {
    const cached = localStorage.getItem('demo_missions');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.find((m: any) => m.id === missionId) || MOCK_MISSIONS.find(m => m.id === missionId) || MOCK_MISSIONS[0];
      } catch (e) {}
    }
    return MOCK_MISSIONS.find(m => m.id === missionId) || MOCK_MISSIONS[0];
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{question: string, answer: string}[]>([]);
  const [isFinalStep, setIsFinalStep] = useState(false);
  
  const [finalRating, setFinalRating] = useState(0);
  const [finalComment, setFinalComment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { session, refreshBalance } = useUser();
  const navigate = useNavigate();

  const questions = mission.questions || ["O serviço geral foi satisfatório?"];
  const labels = ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"];
  const stepReward = Number((mission.reward / (questions.length + 1)).toFixed(2));

  const handleAnswer = (answer: 'Sim' | 'Não') => {
    setAnswers([...answers, { question: questions[currentStep], answer }]);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinalStep(true);
    }
  };

  const handleSubmit = async () => {
    if (finalRating === 0) {
      alert('Por favor, avalie a empresa com estrelas.');
      return;
    }
    if (!session?.user?.id) {
      alert('Você precisa estar logado para completar missões.');
      navigate('/auth');
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (!supabase) {
        // Fluxo local para Modo de Demonstração (sem Supabase)
        const newTx = {
          id: Math.random().toString(36).substr(2, 9),
          user_id: session.user.id,
          amount: mission.reward,
          type: 'cashback',
          status: 'completed',
          store: mission.title,
          metadata: { answers, rating: finalRating, comment: finalComment },
          created_at: new Date().toISOString()
        };

        // Salvar nas transações pessoais
        const localTxs = JSON.parse(localStorage.getItem(`txs_${session.user.id}`) || '[]');
        localStorage.setItem(`txs_${session.user.id}`, JSON.stringify([newTx, ...localTxs]));

        // Salvar também no pool global demo para os relatórios do Admin local
        const globalTxs = JSON.parse(localStorage.getItem('demo_global_transactions') || '[]');
        localStorage.setItem('demo_global_transactions', JSON.stringify([newTx, ...globalTxs]));

        // Marcar cooldown de 24h
        localStorage.setItem(`last_mission_${session.user.id}`, Date.now().toString());

        await refreshBalance();
        setIsSuccess(true);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      const { error } = await supabase.from('transactions').insert([{
        user_id: session.user.id,
        amount: mission.reward,
        type: 'cashback',
        status: 'completed',
        store: mission.title,
        metadata: { 
          answers, 
          rating: finalRating, 
          comment: finalComment 
        }
      }]);

      if (error) {
        if (error.code === 'PGRST205') {
          const newTx = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: session.user.id,
            amount: mission.reward,
            type: 'cashback',
            status: 'completed',
            store: mission.title,
            metadata: { answers, rating: finalRating, comment: finalComment },
            created_at: new Date().toISOString()
          };
          const localTxs = JSON.parse(localStorage.getItem(`txs_${session.user.id}`) || '[]');
          localStorage.setItem(`txs_${session.user.id}`, JSON.stringify([newTx, ...localTxs]));
          
          // Salvar também no pool global demo
          const globalTxs = JSON.parse(localStorage.getItem('demo_global_transactions') || '[]');
          localStorage.setItem('demo_global_transactions', JSON.stringify([newTx, ...globalTxs]));

          alert('Configuração de banco incompleta. Recompensa salva localmente!');
        } else throw error;
      }

      // Marcar tempo da última missão
      localStorage.setItem(`last_mission_${session.user.id}`, Date.now().toString());

      await refreshBalance();
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 3000);

    } catch (err: any) {
      alert(err.message || 'Erro ao salvar missão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <PartyPopper size={48} className="text-primary animate-bounce" />
        </div>
        <h2 className="text-3xl font-headline font-bold text-primary mb-2">Parabéns!</h2>
        <p className="text-on-surface-variant font-medium">Você completou a pesquisa da <span className="font-bold">{mission.title}</span>.</p>
        <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-sm">Você ganhou:</p>
          <p className="text-2xl font-black text-primary">R$ {mission.reward.toFixed(2)}</p>
        </div>
        <p className="text-xs text-secondary mt-8 italic">Voltando ao início...</p>
      </div>
    );
  }

  return (
    <div className="pb-32 px-5 py-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
            {isFinalStep ? 'Finalizando' : `Pergunta ${currentStep + 1} de ${questions.length}`}
          </span>
          <span className="text-xs font-bold text-primary italic">
            Acumulando: R$ {mission.reward.toFixed(2)}
          </span>
        </div>
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${((isFinalStep ? questions.length + 1 : currentStep + 1) / (questions.length + 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!isFinalStep ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <section className="glass-card p-6 rounded-2xl flex flex-col items-center text-center shadow-lg">
              <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center mb-4 text-primary shadow-inner">
                {mission.id === 'm1' ? <Plane size={32} /> : <Store size={32} />}
              </div>
              <h2 className="text-xl font-headline font-bold text-on-surface leading-tight">{mission.title}</h2>
            </section>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10 text-center">
              <h3 className="font-headline font-bold text-lg mb-8">{questions[currentStep]}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer('Sim')}
                  className="py-6 rounded-2xl bg-primary/5 border-2 border-primary/10 text-primary font-bold text-xl hover:bg-primary hover:text-white transition-all active:scale-95"
                >
                  SIM
                </button>
                <button
                  onClick={() => handleAnswer('Não')}
                  className="py-6 rounded-2xl bg-error/5 border-2 border-error/10 text-error font-bold text-xl hover:bg-error hover:text-white transition-all active:scale-95"
                >
                  NÃO
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="final"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 text-center">
              <h3 className="font-headline font-bold text-lg mb-6">Como você avalia a {mission.title} no geral?</h3>
              <div className="flex justify-center gap-1 sm:gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFinalRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star 
                      size={40} 
                      className={`transition-all ${
                        star <= finalRating ? 'fill-tertiary-container text-tertiary-container scale-110' : 'text-outline-variant'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <p className={`text-sm font-bold h-5 ${finalRating > 0 ? 'text-primary' : 'text-secondary'}`}>
                {finalRating > 0 ? labels[finalRating - 1] : 'Clique nas estrelas'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
              <label className="block font-headline font-bold mb-3 text-sm" htmlFor="comment">
                Algum comentário adicional? (Opcional)
              </label>
              <textarea
                id="comment"
                rows={3}
                value={finalComment}
                onChange={(e) => setFinalComment(e.target.value)}
                placeholder="Ex: Gostei muito da pontualidade..."
                className="w-full rounded-xl border-outline-variant bg-surface-container-low p-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={finalRating === 0 || isSubmitting}
              className={`w-full py-4 rounded-2xl font-headline font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                finalRating > 0 
                  ? 'bg-primary text-white shadow-primary/20' 
                  : 'bg-outline-variant/50 text-secondary/50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Star size={24} />
                </motion.div>
              ) : (
                <>
                  Concluir e Receber R$ {mission.reward.toFixed(2)}
                  <CheckCircle2 size={24} />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
