import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet } from 'lucide-react';

const NAMES = [
  'Severino B.', 'Cicero M.', 'Tarcisio S.', 'Edileusa G.', 'Damiao R.', 
  'Zezinho A.', 'Ronaldo F.', 'Marta J.', 'Junior P.', 'Luciana K.',
  'Josevaldo T.', 'Maria do Carmo S.', 'Genivaldo L.', 'Terezinha B.', 'Ednaldo F.'
];

export default function WithdrawalNotifications() {
  const [notification, setNotification] = useState<{name: string, amount: string} | null>(null);

  useEffect(() => {
    const playNotificationSound = () => {
      try {
        // Som suave e limpo
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => console.log("Áudio aguardando interação do usuário"));
      } catch (e) {
        console.error("Erro ao tocar som", e);
      }
    };

    const showNotification = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const amount = (Math.random() * (10 - 5) + 5).toFixed(2);
      
      // Toca som em todas agora
      playNotificationSound();

      setNotification({ name, amount });

      setTimeout(() => {
        setNotification(null);
      }, 4000);
    };

    // Primeira notificação após 3 segundos
    const initialDelay = setTimeout(showNotification, 3000);

    // Intervalo fixo de 10 segundos
    const interval = setInterval(showNotification, 10000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none flex justify-center">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-white/90 backdrop-blur-md border border-primary/20 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 max-w-xs"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-wider leading-none">Saque Realizado</p>
              <p className="text-xs text-on-surface mt-1">
                <span className="font-bold">{notification.name}</span> acabou de sacar <span className="font-bold text-primary">R$ {notification.amount.replace('.', ',')}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
