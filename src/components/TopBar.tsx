import { useUser } from '../context/UserContext.tsx';

export default function TopBar() {
  const { session, balance } = useUser();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-outline-variant/20 px-5 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden shadow-sm flex items-center justify-center bg-primary/10">
          {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
            <img 
              src={user.user_metadata.avatar_url || user.user_metadata.picture} 
              alt={user.user_metadata.full_name || 'Usuário'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold text-primary">{user?.email?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className="font-headline font-bold text-primary text-lg tracking-tight">Cash Arcoverde</h1>
      </div>
      <div className="bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full flex flex-col items-end">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70 leading-none">Saldo</span>
        <span className="font-headline font-bold text-primary leading-tight font-mono">R$ {balance.toFixed(2).replace('.', ',')}</span>
      </div>
    </header>
  );
}
