-- ============================================================
-- HOTEL BEGE OURO — Sincronizar tabela rooms com os 14 quartos reais
--
-- Cole este SQL inteiro no SQL Editor do Supabase e clique em "Run".
-- Ele insere ou atualiza os quartos para bater com o que o site usa,
-- desbloqueando o INSERT de reservas online.
--
-- SEGURO de rodar várias vezes (idempotente via ON CONFLICT).
-- ============================================================

-- Adiciona colunas de preço por ocupação se ainda não existirem
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS andar text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS camas text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS preco_1p numeric(10,2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS preco_2p numeric(10,2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS preco_3p numeric(10,2);

-- Insere ou atualiza os 14 quartos reais
INSERT INTO rooms (id, numero, andar, tipo, camas, capacidade, preco, preco_1p, preco_2p, preco_3p, status, descricao, amenities) VALUES
  ('q01',  '01',  'Térreo',    'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Quarto aconchegante com cama de casal.',           '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q02',  '02',  'Térreo',    'duplo_solteiro', '2 camas de solteiro',         2, 150, 150, 270, NULL, 'disponivel', 'Quarto com duas camas de solteiro.',                '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q03',  '03',  'Térreo',    'triplo',         '1 cama de casal + 1 solteiro',3, 190, 190, 270, 310,  'disponivel', 'Quarto triplo com cama de casal e solteiro.',       '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q04',  '04',  'Térreo',    'duplo_solteiro', '2 camas de solteiro',         2, 150, 150, 270, NULL, 'disponivel', 'Quarto duplo solteiro espaçoso.',                   '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q05',  '05',  'Térreo',    'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Conforto em quarto de casal.',                      '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q07',  '07',  'Térreo',    'solteiro',       '1 cama de solteiro',          1, 150, 150, NULL,NULL, 'disponivel', 'Quarto prático para viajante solo.',                '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q08',  '08',  'Térreo',    'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Quarto de casal agradável.',                        '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q101', '101', '1º andar',  'triplo',         '1 cama de casal + 1 solteiro',3, 190, 190, 270, 310,  'disponivel', 'Quarto triplo superior com excelente iluminação.',  '["Wi-Fi","Ar condicionado","TV","Frigobar"]'::jsonb),
  ('q102', '102', '1º andar',  'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Quarto de casal com janela ampla.',                 '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q103', '103', '1º andar',  'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Aconchego e tranquilidade no primeiro andar.',      '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q104', '104', '1º andar',  'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Quarto padrão casal.',                              '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q106', '106', '1º andar',  'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Quarto iluminado e confortável.',                   '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q107', '107', '1º andar',  'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Conforto clássico para duas pessoas.',              '["Wi-Fi","Ar condicionado","TV"]'::jsonb),
  ('q108', '108', '1º andar',  'casal',          '1 cama de casal',             2, 190, 190, 270, NULL, 'disponivel', 'Quarto com bela vista.',                            '["Wi-Fi","Ar condicionado","TV"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  numero      = EXCLUDED.numero,
  andar       = EXCLUDED.andar,
  tipo        = EXCLUDED.tipo,
  camas       = EXCLUDED.camas,
  capacidade  = EXCLUDED.capacidade,
  preco       = EXCLUDED.preco,
  preco_1p    = EXCLUDED.preco_1p,
  preco_2p    = EXCLUDED.preco_2p,
  preco_3p    = EXCLUDED.preco_3p,
  status      = EXCLUDED.status,
  descricao   = EXCLUDED.descricao,
  amenities   = EXCLUDED.amenities,
  updated_at  = now();

-- Remove os quartos antigos do schema que não existem mais no site
-- (só roda se eles ainda existirem e não tiverem reservas atreladas)
DELETE FROM rooms
WHERE id IN ('q201','q202','q203','q301','q302','q303')
  AND NOT EXISTS (SELECT 1 FROM reservations WHERE quarto_id = rooms.id);

-- Confere o resultado
SELECT id, numero, tipo, capacidade, preco, preco_1p, preco_2p, preco_3p, status
FROM rooms
ORDER BY id;
