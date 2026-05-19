import { motion } from 'motion/react';
import { Home, ClipboardList, Wallet, User as UserIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: ClipboardList, label: 'Missões', path: '/missions' },
    { icon: Wallet, label: 'Saque', path: '/withdraw' },
    { icon: UserIcon, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white/80 backdrop-blur-md border-t border-outline-variant/30 rounded-t-2xl shadow-lg">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center transition-all duration-200 relative ${
              isActive ? 'text-primary' : 'text-secondary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="nav-bg"
                className="absolute -inset-x-4 -inset-y-2 bg-primary/10 rounded-full -z-10"
              />
            )}
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
