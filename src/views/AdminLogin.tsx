import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Eye, EyeOff, Loader2, Wallet, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase.ts';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isFirebaseConfigured) {
      setTimeout(() => {
        localStorage.setItem('demo_admin_logged_in', 'true');
        navigate('/admin');
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O App.tsx ou Admin.tsx vai verificar se o usuário é admin
      navigate('/admin');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError('Credenciais inválidas ou acesso negado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px]"
      >
        <header className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">Painel Administrativo</h1>
          <p className="text-secondary text-sm mt-2">Acesso restrito para gestores</p>
        </header>

        <section className="bg-white rounded-[32px] p-8 shadow-xl border border-outline-variant/10">
          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 text-xs flex flex-col gap-1.5 animate-in fade-in duration-300">
              <span className="font-bold text-amber-800">⭐ Modo Admin de Demonstração</span>
              <p className="opacity-90 leading-relaxed text-[10px]">
                O Firebase não está configurado. Você pode entrar usando qualquer e-mail e senha para explorar o painel gestor local!
              </p>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-[11px] font-bold"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] ml-1">E-mail do Administrador</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@casharcoverde.com"
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] ml-1">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-primary text-white font-headline font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Entrar no Painel
                  <Wallet size={20} />
                </>
              )}
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-[10px] text-secondary">
              Problemas com acesso? Contate o suporte técnico.
            </p>
          </footer>
        </section>

        <button 
          onClick={() => navigate('/')}
          className="mt-8 w-full text-secondary text-xs font-bold hover:text-primary transition-colors"
        >
          Voltar para o App
        </button>
      </motion.div>
    </div>
  );
}
