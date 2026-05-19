export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  balance: number;
  streak: number;
}

export interface Mission {
  id: string;
  title: string;
  category: 'Saúde' | 'Gastronomia' | 'Varejo' | 'Moda' | 'Serviços' | 'Todas' | 'Supermercado';
  reward: number;
  image: string;
  status: 'available' | 'blocked' | 'completed';
  unlockTime?: string;
  questions?: string[];
  isYesNo?: boolean;
}

export interface Transaction {
  id: string;
  store: string;
  type: 'cashback' | 'withdrawal';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected';
  pixKey?: string;
}
