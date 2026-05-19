
-- Script de Migração para Cash Arcoverde

-- 1. Tabela de Perfis (Extensão do Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  balance DECIMAL(12,2) DEFAULT 0.00,
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Tabela de Missões
CREATE TABLE missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Saúde', 'Gastronomia', 'Varejo', 'Moda', 'Serviços')),
  reward DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'completed')),
  unlock_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabela de Transações
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  store_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('cashback', 'withdrawal')),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  pix_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Inserir Missões Iniciais de Exemplo
INSERT INTO missions (title, category, reward, image_url, status) VALUES
('Farmácia Central', 'Saúde', 5.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAvTExof7RdId92xGWhs8Hiq5HnQfk-HMa_b5Kh2i0iw5noR9VpYdnK7gL3BEe7k9JgfcPmDmNSjPOJUyE4CVXvG8E-qfygfNYn5hfypC55pDFgSM-NFtX-AlnYlmsNZqE9h_4X197LPCUSXg-CgyS32V8uIerdHkvoWfujIGps1yQ_IqF4RoQj9wtrsXjhCfLFkJE96IjvHz0wTDGBcjWgrBqQa2EDTrJ0rXi_nGCe5j_-yBBtK2lOdYd7KujI4l8cGrZIrqOneM', 'available'),
('Mercado Arcoverde', 'Varejo', 3.50, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM2kCEhm12wwLIEtxvgZtHBEZzgr89i62tOuf8Cn0v7hpmGywmW8_MpCeJCQ39EEzQPK4QtYytW2sG6SzzXDOBteLWIhWRQ9KNxYgcqEEPFd-rhIMRfsP1qeYg3CQ84l80HYvjU-IyeRTpWBAuHPbqH6SB3a8mHGUrdPn6DXB-z_8yVQflzCUXCfvCMKaXvAjgO69EkIkeNvBjCFR6wDWFgIbjlCJPX4yiiaszmOS1RwOpZ3O09a2lcmXpWKaFy3vahDDm_2kfHZo', 'available');

-- RLS (Segurança básica)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view missions" ON missions FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
