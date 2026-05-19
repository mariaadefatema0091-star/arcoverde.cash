import { Mission, Transaction, User } from './types.ts';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'João Silva',
  email: 'joao.silva@email.com',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKqn4M98AygsVelnZufc4fStiu9GCuBHnSV9RxxV6ZXISteFacDzufi8Ur_UwXlWE_1s_y2Lo3ajrQGC_VQk0Vyc0eWjYAVpaNyzn7M6lPj3bQgPTa36qyd_y2wUjZ_0e9nD2N4hm3NJpQKNXPkXebWFU4iJHDZ5yKaroeoZTqPOniaDxcKPHZkKWSw2SVfTPY6t65VLs649b0_o8W-3Wq_Ezdz_D_GZ_UQW2y5FYykkMUqZl-j4DUhhFrH6AzySu8o1QylSWFNiI',
  balance: 0,
  streak: 0
};

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Bonanza Supermercado - Arcoverde',
    category: 'Supermercado',
    reward: 5.00,
    image: 'https://images.unsplash.com/photo-1506617564039-2f3b650ad755?auto=format&fit=crop&q=80&w=800',
    status: 'available',
    isYesNo: true,
    questions: [
      "O Bonanza de Arcoverde oferece bons preços?",
      "A variedade de produtos é satisfatória?",
      "O atendimento nos caixas foi rápido?",
      "O ambiente estava limpo e organizado?",
      "Você recomendaria o Bonanza para amigos?"
    ]
  },
  {
    id: 'm2',
    title: 'Atacarejo de Arcoverde',
    category: 'Supermercado',
    reward: 12.50,
    image: 'https://images.unsplash.com/photo-1604719312563-8912e9223c6a?auto=format&fit=crop&q=80&w=800',
    status: 'available',
    isYesNo: true,
    questions: [
      "Os preços de atacado valem a pena?",
      "A organização das gôndolas facilita a compra?",
      "A equipe de reposição foi atenciosa?",
      "A climatização da loja estava adequada?",
      "O estacionamento é acessível e seguro?"
    ]
  },
  {
    id: 'm3',
    title: 'Lojas LW - São Cristóvão | Móveis e Eletro',
    category: 'Varejo',
    reward: 20.00,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    status: 'available',
    isYesNo: true,
    questions: [
      "A Lojas LW possui boa variedade de móveis?",
      "O atendimento no São Cristóvão foi satisfatório?",
      "As condições de parcelamento são atrativas?",
      "O showroom estava bem montado?",
      "Você compraria eletros novamente na LW?"
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [];
