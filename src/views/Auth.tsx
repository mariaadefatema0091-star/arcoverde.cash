import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Smartphone, Lock, Eye, EyeOff, ArrowRight, LogIn, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { useUser } from '../context/UserContext.tsx';

export default function Auth() {
  const { session, setDemoSession } = useUser();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!supabase) {
      localStorage.removeItem('demo_user_session');
      setDemoSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const handleDemoLogin = () => {
    const mockSession = {
      user: {
        id: 'u1',
        email: 'visitante@casharcoverde.com',
        user_metadata: {
          full_name: 'Visitante Arcoverde',
          phone: '(87) 99999-2026'
        }
      }
    };
    localStorage.setItem('demo_user_session', JSON.stringify(mockSession));
    setDemoSession(mockSession);
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      // Simulação offline em modo demo
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      
      setTimeout(() => {
        setIsLoading(false);
        if (mode === 'signup') {
          setIsSuccess(true);
          setTimeout(() => {
            setMode('login');
            setIsSuccess(false);
          }, 2500);
        } else {
          const mockSession = {
            user: {
              id: 'u1',
              email: email || 'visitante@casharcoverde.com',
              user_metadata: {
                full_name: name || 'Visitante Arcoverde',
                phone: phone || '(87) 99999-2026'
              }
            }
          };
          localStorage.setItem('demo_user_session', JSON.stringify(mockSession));
          setDemoSession(mockSession);
          navigate('/');
        }
      }, 1000);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
            }
          }
        });
        if (signUpError) throw signUpError;
        setIsSuccess(true);
        // Sugestão para o usuário
        console.log('DICA: Desative "Confirm Email" no dashboard do Supabase (Authentication -> Providers -> Email) para que os usuários entrem direto sem validar e-mail.');
        
        setTimeout(() => {
          setMode('login');
          setIsSuccess(false);
        }, 5000);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Email ou senha incorretos.');
          }
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Por favor, confirme seu e-mail antes de entrar.');
          }
          throw signInError;
        }
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let userMessage = err.message || 'Ocorreu um erro inesperado. Verifique sua conexão.';
      
      if (userMessage.includes('Email not confirmed')) {
        userMessage = 'E-mail não confirmado ou login bloqueado. Tente entrar. Se não funcionar, verifique seu e-mail ou desative a confirmação no painel do Supabase.';
      } else if (userMessage.includes('Invalid login credentials')) {
        userMessage = 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
      } else if (userMessage.includes('JWT')) {
        userMessage = 'Erro técnico: A chave VITE_SUPABASE_ANON_KEY parece inválida. Use a chave "anon" que começa com "eyJ".';
      }
      
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (session) {
    const user = session.user;
    return (
      <div className="bg-[#f0f2f5] min-h-screen pt-12 pb-32 px-6 flex flex-col">
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-primary/5 border border-primary/10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 border-2 border-primary/20">
              <User size={48} />
            </div>
            <h2 className="font-headline font-bold text-2xl text-on-surface">Minha Conta</h2>
            {!isSupabaseConfigured && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">MODO DEMO</span>
            )}
            <p className="text-secondary text-sm">{user.email}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Nome Completo</p>
              <p className="font-bold text-on-surface">{user.user_metadata?.full_name || 'Não informado'}</p>
            </div>
            <div className="p-4 bg-surface rounded-2xl border border-outline-variant/30">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Telefone</p>
              <p className="font-bold text-on-surface">{user.user_metadata?.phone || 'Não informado'}</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full bg-error/10 text-error font-headline font-bold py-4 rounded-2xl border border-error/20 flex items-center justify-center gap-2 hover:bg-error/20 transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] z-10"
      >
        <header className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-4">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">Cash Arcoverde</h1>
          <p className="text-secondary text-sm px-6 mt-2">Sua carteira digital inteligente com benefícios exclusivos na nossa cidade.</p>
        </header>

        <section className="glass-card rounded-[32px] p-8 shadow-xl">
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex flex-col gap-2">
              <span className="font-bold flex items-center gap-1.5 text-amber-800">
                ⭐ Modo de Demonstração Ativo
              </span>
              <p className="opacity-90 leading-relaxed text-[11px]">
                O Supabase não está configurado, então o app está rodando localmente de forma totalmente interativa.
              </p>
              <button 
                type="button"
                onClick={handleDemoLogin}
                className="mt-2 w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all active:scale-95 shadow-sm"
              >
                Entrar como Convidado (Rápido)
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-surface-container-low p-1.5 rounded-full mb-8 relative">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all relative z-10 ${mode === 'login' ? 'text-white' : 'text-secondary'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all relative z-10 ${mode === 'signup' ? 'text-white' : 'text-secondary'}`}
            >
              Cadastro
            </button>
            <motion.div 
              animate={{ x: mode === 'login' ? '0%' : '100%' }}
              className="absolute inset-y-1.5 left-1.5 w-[calc(50%-3px)] bg-primary rounded-full shadow-sm"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

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

          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3 text-primary text-xs font-bold"
            >
              <Wallet size={18} />
              Conta criada! Você já pode entrar.
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] ml-1">Nome Completo</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como quer ser chamado?"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] ml-1">Telefone</label>
                    <div className="relative">
                      <Smartphone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(87) 99999-0000"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] ml-1">E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] ml-1">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
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

            {mode === 'login' && (
              <button type="button" className="text-[10px] font-bold text-primary text-right hover:underline">
                Esqueceu a senha?
              </button>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-primary-container text-white font-headline font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : 'Criar minha conta'}
                  {mode === 'login' ? <LogIn size={20} /> : <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
            <p className="text-xs text-secondary">
              {mode === 'login' ? 'Não tem uma conta?' : 'Já possui uma conta?'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary font-bold ml-1 hover:underline"
              >
                {mode === 'login' ? 'Cadastre-se agora' : 'Entrar agora'}
              </button>
            </p>
          </footer>
        </section>

        {/* Social Auth */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px bg-outline-variant/30 flex-1" />
            <span className="text-[10px] font-bold text-outline uppercase">Ou continue com</span>
            <div className="h-px bg-outline-variant/30 flex-1" />
          </div>
          <div className="flex gap-4">
            <button onClick={handleDemoLogin} className="flex-1 py-3 bg-white border border-outline-variant/30 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 opacity-70" alt="Google" />
              <span className="text-xs font-bold text-on-surface">Google</span>
            </button>
            <button onClick={handleDemoLogin} className="flex-1 py-3 bg-white border border-outline-variant/30 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all">
              <div className="w-4 h-4 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-[10px]">f</div>
              <span className="text-xs font-bold text-on-surface">Facebook</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
