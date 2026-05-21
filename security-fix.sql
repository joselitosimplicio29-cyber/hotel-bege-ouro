-- ============================================================
-- HOTEL BEGE OURO — Correção de Segurança (V2)
-- Resposta ao relatório de auditoria do Manus AI (2026-05-20)
--
-- Mudanças:
--   1. Popula profiles com os 3 usuários reais do Supabase Auth
--   2. Remove policies abertas que vazavam PII pra anon
--   3. Cria VIEW segura para checagem de disponibilidade (sem PII)
--   4. Cria RPC create_reservation_online() com SECURITY DEFINER
--      → anon pode CRIAR reserva mas não LER tabela direto
--   5. Garante que payments, consumptions, profiles ficam fechados pra anon
--
-- ⚠️ IMPORTANTE: substitua <UUID_BEGEOUROHOTEL> pelo UUID real
-- antes de rodar. O resto já está com UUIDs preenchidos.
-- ============================================================

-- ============================================================
-- PARTE 1 — Popular tabela profiles
-- ============================================================
INSERT INTO profiles (id, nome, perfil) VALUES
  ('bd689926-8c06-4895-8d5e-e8ff1fbd0bea',    'Administrador',  'admin'),
  ('bf8168bc-4fc8-4953-b931-e69550a91693',    'Maria Recepção', 'funcionario'),
  ('1d0c22c9-d4bd-4e43-885b-1f14ba1c351a',    'João Financeiro','financeiro')
ON CONFLICT (id) DO UPDATE SET
  nome   = EXCLUDED.nome,
  perfil = EXCLUDED.perfil;

-- ============================================================
-- PARTE 2 — REMOVER policies abertas (CORRIGE O VAZAMENTO)
-- ============================================================
DROP POLICY IF EXISTS "Anon lê reserva online" ON reservations;
DROP POLICY IF EXISTS "Anon lê reserva online própria" ON reservations;
DROP POLICY IF EXISTS "Anon lê clientes" ON clients;
DROP POLICY IF EXISTS "Anon lê clientes (inserção própria)" ON clients;
-- Mantém INSERT pra anon, mas SELECT só via VIEW segura

-- ============================================================
-- PARTE 3 — VIEW segura pra checagem de disponibilidade
-- Expõe APENAS quarto_id, entrada, saida, status (sem PII)
-- ============================================================
DROP VIEW IF EXISTS public.reservations_availability;
CREATE VIEW public.reservations_availability AS
SELECT
  id,
  quarto_id,
  entrada,
  saida,
  status_reserva
FROM reservations
WHERE status_reserva NOT IN ('cancelada', 'finalizada');

GRANT SELECT ON public.reservations_availability TO anon;
GRANT SELECT ON public.reservations_availability TO authenticated;

-- ============================================================
-- PARTE 4 — RPC: cria reserva online sem precisar SELECT na tabela
-- Roda com privilégio de postgres (SECURITY DEFINER), valida tudo,
-- retorna apenas {id, codigo}. Anon não vê PII de ninguém.
-- ============================================================
DROP FUNCTION IF EXISTS public.create_reservation_online;

CREATE OR REPLACE FUNCTION public.create_reservation_online(
  p_nome         text,
  p_cpf          text,
  p_telefone     text,
  p_email        text,
  p_quarto_id    text,
  p_entrada      date,
  p_saida        date,
  p_diarias      int,
  p_hospedes     int,
  p_valor_diaria numeric,
  p_valor_total  numeric,
  p_observacoes  text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id     uuid;
  v_reserva_id     uuid;
  v_reserva_codigo text;
  v_quarto_preco   numeric;
  v_quarto_cap     int;
BEGIN
  -- ===== Validações de entrada =====
  IF p_nome IS NULL OR length(trim(p_nome)) < 3 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;
  IF p_telefone IS NULL OR length(trim(p_telefone)) < 8 THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;
  IF p_email IS NULL OR p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  IF p_entrada IS NULL OR p_saida IS NULL OR p_entrada >= p_saida THEN
    RAISE EXCEPTION 'Datas inválidas';
  END IF;
  IF p_entrada < CURRENT_DATE THEN
    RAISE EXCEPTION 'Entrada não pode ser no passado';
  END IF;
  IF p_diarias < 1 OR p_diarias > 365 THEN
    RAISE EXCEPTION 'Diárias inválidas';
  END IF;
  IF p_hospedes < 1 OR p_hospedes > 10 THEN
    RAISE EXCEPTION 'Quantidade de hóspedes inválida';
  END IF;
  IF p_valor_diaria <= 0 OR p_valor_total <= 0 THEN
    RAISE EXCEPTION 'Valor inválido';
  END IF;

  -- ===== Valida quarto: existe, não está em manutenção, comporta hospedes =====
  SELECT preco, capacidade INTO v_quarto_preco, v_quarto_cap
  FROM rooms
  WHERE id = p_quarto_id
    AND status != 'manutencao';

  IF v_quarto_cap IS NULL THEN
    RAISE EXCEPTION 'Quarto não disponível';
  END IF;

  IF v_quarto_cap < p_hospedes THEN
    RAISE EXCEPTION 'Capacidade do quarto insuficiente';
  END IF;

  -- ===== Anti-overbooking: verifica conflito de datas =====
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE quarto_id = p_quarto_id
      AND status_reserva NOT IN ('cancelada','finalizada')
      AND entrada < p_saida
      AND saida > p_entrada
  ) THEN
    RAISE EXCEPTION 'Quarto já reservado para essas datas';
  END IF;

  -- ===== Find or create cliente (matching por CPF se houver, senão email) =====
  IF p_cpf IS NOT NULL AND length(trim(p_cpf)) > 0 THEN
    SELECT id INTO v_cliente_id FROM clients WHERE cpf = p_cpf LIMIT 1;
  END IF;

  IF v_cliente_id IS NULL AND p_email IS NOT NULL THEN
    SELECT id INTO v_cliente_id FROM clients WHERE email = p_email LIMIT 1;
  END IF;

  IF v_cliente_id IS NULL THEN
    INSERT INTO clients (nome, cpf, telefone, email)
    VALUES (trim(p_nome), p_cpf, p_telefone, p_email)
    RETURNING id INTO v_cliente_id;
  END IF;

  -- ===== Cria reserva =====
  INSERT INTO reservations (
    cliente_id, quarto_id, entrada, saida, diarias, hospedes,
    valor_diaria, valor_total, valor_pago, valor_restante,
    forma_pagamento, status_pagamento, status_reserva, origem, observacoes
  ) VALUES (
    v_cliente_id, p_quarto_id, p_entrada, p_saida, p_diarias, p_hospedes,
    p_valor_diaria, p_valor_total, 0, p_valor_total,
    'whatsapp', 'pendente', 'pendente', 'online', p_observacoes
  )
  RETURNING id, codigo INTO v_reserva_id, v_reserva_codigo;

  -- Retorna APENAS id + código (sem PII)
  RETURN jsonb_build_object(
    'id',     v_reserva_id,
    'codigo', v_reserva_codigo
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_reservation_online FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation_online TO anon;
GRANT EXECUTE ON FUNCTION public.create_reservation_online TO authenticated;

-- ============================================================
-- PARTE 5 — Garante que outras tabelas sensíveis ficam fechadas
-- ============================================================
-- payments: anon NÃO pode inserir (estava aberto no schema antigo)
DROP POLICY IF EXISTS "Anon insere pagamento" ON payments;
-- (mantém só policies de authenticated)

-- consumptions: anon não tinha policy, garantir que continua assim
-- (nada a fazer; sem policy = bloqueado por padrão com RLS habilitado)

-- profiles: anon não pode ler (tem PII e infos de roles)
-- (já era assim; sem policy = bloqueado)

-- ============================================================
-- PARTE 6 — Confere o resultado
-- ============================================================
SELECT 'Profiles cadastrados:' AS info;
SELECT id, nome, perfil FROM profiles ORDER BY perfil;

SELECT 'Policies de anon (devem ser SÓ insere/INSERT, sem SELECT):' AS info;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE 'anon' = ANY(roles)
ORDER BY tablename, cmd;

SELECT 'View segura disponível:' AS info;
SELECT count(*) AS reservas_visiveis_para_anon FROM reservations_availability;
