-- ============================================================
-- HOTEL BEGE OURO — Schema Supabase
-- Cole este SQL inteiro no SQL Editor do Supabase e execute.
-- ============================================================

-- ========== PROFILES (metadata dos usuários admin) ==========
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  perfil text NOT NULL CHECK (perfil IN ('admin', 'funcionario', 'financeiro')),
  created_at timestamptz DEFAULT now()
);

-- ========== QUARTOS ==========
CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  numero text NOT NULL,
  tipo text NOT NULL,
  capacidade int NOT NULL,
  preco numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'disponivel'
    CHECK (status IN ('disponivel','reservado','ocupado','limpeza','manutencao')),
  descricao text,
  amenities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========== CLIENTES ==========
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text UNIQUE,
  telefone text,
  email text,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_cpf   ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- ========== RESERVAS ==========
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  cliente_id uuid REFERENCES clients(id) ON DELETE RESTRICT,
  quarto_id text REFERENCES rooms(id) ON DELETE RESTRICT,
  entrada date NOT NULL,
  saida   date NOT NULL,
  diarias int NOT NULL,
  hospedes int NOT NULL DEFAULT 1,
  valor_diaria  numeric(10,2) NOT NULL,
  valor_total   numeric(10,2) NOT NULL,
  valor_pago    numeric(10,2) NOT NULL DEFAULT 0,
  valor_restante numeric(10,2) NOT NULL DEFAULT 0,
  forma_pagamento  text,
  status_pagamento text NOT NULL DEFAULT 'pendente'
    CHECK (status_pagamento IN ('pendente','parcial','pago')),
  status_reserva   text NOT NULL DEFAULT 'pendente'
    CHECK (status_reserva IN ('pendente','confirmada','em_hospedagem','finalizada','cancelada')),
  origem text NOT NULL DEFAULT 'manual'
    CHECK (origem IN ('online','manual')),
  observacoes text,
  check_in_at  timestamptz,
  check_out_at timestamptz,
  criada_em    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_quarto ON reservations(quarto_id, entrada, saida);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status_reserva);
CREATE INDEX IF NOT EXISTS idx_reservations_cliente ON reservations(cliente_id);

-- Sequence para numeração dos códigos de reserva
CREATE SEQUENCE IF NOT EXISTS reservation_number_seq START 1;

-- Função para gerar código da reserva automaticamente
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'BO-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('reservation_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reservation_code ON reservations;
CREATE TRIGGER trg_reservation_code
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION generate_reservation_code();

-- ========== PAGAMENTOS ==========
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  valor numeric(10,2) NOT NULL,
  forma text NOT NULL,
  data  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_reserva ON payments(reserva_id);
CREATE INDEX IF NOT EXISTS idx_payments_data    ON payments(data);

-- ========== CONSUMO ==========
CREATE TABLE IF NOT EXISTS consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  produto text NOT NULL,
  qtd int NOT NULL,
  valor_unit  numeric(10,2) NOT NULL,
  valor_total numeric(10,2) NOT NULL,
  funcionario_id uuid REFERENCES profiles(id),
  data_hora timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumptions_reserva ON consumptions(reserva_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumptions ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados leem tudo
CREATE POLICY "Auth lê quartos"        ON rooms        FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth lê clientes"       ON clients      FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth lê reservas"       ON reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth lê pagamentos"     ON payments     FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth lê consumo"        ON consumptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth lê profiles"       ON profiles     FOR SELECT TO authenticated USING (true);

-- Usuários autenticados escrevem (admin/funcionario controlado no JS)
CREATE POLICY "Auth insere clientes"   ON clients      FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth atualiza clientes" ON clients      FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth insere reservas"   ON reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth atualiza reservas" ON reservations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth deleta reservas"   ON reservations FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth insere pagamentos" ON payments     FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth deleta pagamentos" ON payments     FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth insere consumo"    ON consumptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth deleta consumo"    ON consumptions FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth insere quartos"    ON rooms        FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth atualiza quartos"  ON rooms        FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth deleta quartos"    ON rooms        FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth insere profile"    ON profiles     FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth atualiza profile"  ON profiles     FOR UPDATE TO authenticated USING (true);

-- Anônimo: pode fazer reserva online
CREATE POLICY "Anon lê quartos disponíveis" ON rooms
  FOR SELECT TO anon USING (status != 'manutencao');

CREATE POLICY "Anon insere cliente" ON clients
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon insere reserva online" ON reservations
  FOR INSERT TO anon WITH CHECK (origem = 'online' AND status_reserva IN ('pendente','confirmada'));

CREATE POLICY "Anon insere pagamento" ON payments
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- SEED: QUARTOS INICIAIS
-- ============================================================
INSERT INTO rooms (id, numero, tipo, capacidade, preco, status, descricao, amenities) VALUES
  ('q101','101','Individual',1,190,'disponivel','Quarto individual aconchegante, ideal para viajantes solo. Cama de solteiro, ar-condicionado e mesa de apoio.','["Wi-Fi","TV 32\"","Ar-cond.","Frigobar"]'),
  ('q102','102','Individual',1,190,'disponivel','Praticidade e conforto em um ambiente planejado para uma pessoa.','["Wi-Fi","TV 32\"","Ar-cond.","Frigobar"]'),
  ('q103','103','Standard',2,280,'disponivel','Quarto standard com decoração clássica e tons neutros.','["Wi-Fi","TV 42\"","Ar-cond.","Frigobar"]'),
  ('q201','201','Superior',3,420,'disponivel','Quarto superior com sacada privativa, cama king e área de estar.','["Wi-Fi","Smart TV","Ar-cond.","Frigobar","Sacada","Cofre"]'),
  ('q202','202','Superior',3,420,'disponivel','Ambiente sofisticado com vista parcial da serra e enxoval especial.','["Wi-Fi","Smart TV","Ar-cond.","Frigobar","Sacada","Cofre"]'),
  ('q203','203','Superior',3,420,'disponivel','Quarto superior com hidromassagem e iluminação cênica.','["Wi-Fi","Smart TV","Hidro","Ar-cond.","Frigobar","Sacada"]'),
  ('q301','301','Suíte Master',2,690,'disponivel','Suíte master com sala de estar, banheira de imersão e vista panorâmica.','["Wi-Fi","Smart TV","Banheira","Ar-cond.","Frigobar","Sacada","Cofre","Roupão"]'),
  ('q302','302','Suíte Família',4,780,'disponivel','Suíte ampla para famílias, com dois ambientes e dois banheiros.','["Wi-Fi","Smart TV","Ar-cond.","Frigobar","2 Banheiros","Sofá-cama"]'),
  ('q303','303','Suíte Master',2,690,'manutencao','Em manutenção elétrica até nova ordem.','["Wi-Fi","Smart TV","Banheira","Ar-cond.","Frigobar"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- USUÁRIOS ADMIN — crie via Supabase Auth UI ou via API
-- Depois de criar, execute o INSERT abaixo substituindo os UUIDs reais
-- ============================================================
-- PASSO MANUAL: Vá em Authentication → Users → Add user e crie:
--   admin@begeouro.com  / Admin@123
--   maria@begeouro.com  / Maria@123
--   joao@begeouro.com   / Joao@123
-- Depois execute:
-- INSERT INTO profiles (id, nome, perfil) VALUES
--   ('<UUID_DO_ADMIN>',      'Administrador',    'admin'),
--   ('<UUID_DA_MARIA>',      'Maria Recepção',   'funcionario'),
--   ('<UUID_DO_JOAO>',       'João Financeiro',  'financeiro');
