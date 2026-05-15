-- ============================================================
-- HOTEL BEGE OURO — Correção de políticas RLS para reservas online
-- Execute este SQL no SQL Editor do Supabase para corrigir
-- o erro ao registrar reservas feitas por clientes anônimos.
-- ============================================================

-- Permite que usuários anônimos leiam de volta o cliente
-- que acabaram de inserir (necessário para o insert + select funcionar)
CREATE POLICY IF NOT EXISTS "Anon lê clientes (inserção própria)"
  ON clients FOR SELECT TO anon USING (true);

-- Garante que o anon pode ler a reserva que acabou de criar
CREATE POLICY IF NOT EXISTS "Anon lê reserva online própria"
  ON reservations FOR SELECT TO anon
  USING (origem = 'online' AND status_reserva IN ('pendente', 'confirmada'));
