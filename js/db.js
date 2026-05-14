/* ============================================================
   HOTEL BEGE OURO — CAMADA DE DADOS (localStorage)
   Simula um banco de dados real. Substituir por Prisma/Postgres
   quando migrar para produção (Next.js).
   ============================================================ */

/* IMPORTANTE: cada vez que o SEED for alterado (quartos, preços, tipos),
   incrementar a versão do DB_KEY força o navegador a recarregar os dados novos.
   Isso descarta dados de teste antigos que tinham informações desatualizadas. */
const DB_KEY = 'begeouro_db_v3';

/* Limpa versões antigas do banco para evitar dados defasados */
['begeouro_db_v1', 'begeouro_db_v2'].forEach(k => {
  try { localStorage.removeItem(k); } catch(e) {}
});

const SEED = {
  users: [
    { id: 'u1', nome: 'Administrador', email: 'admin@begeouro.com', senha: 'admin123', perfil: 'admin' },
    { id: 'u2', nome: 'Maria Recepção', email: 'maria@begeouro.com', senha: 'maria123', perfil: 'funcionario' },
    { id: 'u3', nome: 'João Financeiro', email: 'joao@begeouro.com', senha: 'joao123', perfil: 'financeiro' },
  ],
  rooms: [
    { id: 'q101', numero: '101', tipo: 'Individual', capacidade: 1, preco: 190, status: 'disponivel', descricao: 'Quarto individual aconchegante, ideal para viajantes solo. Cama de solteiro, ar-condicionado e mesa de apoio.', amenities: ['Wi-Fi', 'TV 32"', 'Ar-cond.', 'Frigobar'] },
    { id: 'q102', numero: '102', tipo: 'Individual', capacidade: 1, preco: 190, status: 'disponivel', descricao: 'Praticidade e conforto em um ambiente planejado para uma pessoa.', amenities: ['Wi-Fi', 'TV 32"', 'Ar-cond.', 'Frigobar'] },
    { id: 'q103', numero: '103', tipo: 'Standard',   capacidade: 2, preco: 280, status: 'disponivel', descricao: 'Quarto standard com decoração clássica e tons neutros.', amenities: ['Wi-Fi', 'TV 42"', 'Ar-cond.', 'Frigobar'] },
    { id: 'q201', numero: '201', tipo: 'Superior',  capacidade: 3, preco: 420, status: 'disponivel', descricao: 'Quarto superior com sacada privativa, cama king e área de estar.', amenities: ['Wi-Fi', 'Smart TV', 'Ar-cond.', 'Frigobar', 'Sacada', 'Cofre'] },
    { id: 'q202', numero: '202', tipo: 'Superior',  capacidade: 3, preco: 420, status: 'reservado', descricao: 'Ambiente sofisticado com vista parcial da serra e enxoval especial.', amenities: ['Wi-Fi', 'Smart TV', 'Ar-cond.', 'Frigobar', 'Sacada', 'Cofre'] },
    { id: 'q203', numero: '203', tipo: 'Superior',  capacidade: 3, preco: 420, status: 'ocupado', descricao: 'Quarto superior com hidromassagem e iluminação cênica.', amenities: ['Wi-Fi', 'Smart TV', 'Hidro', 'Ar-cond.', 'Frigobar', 'Sacada'] },
    { id: 'q301', numero: '301', tipo: 'Suíte Master',  capacidade: 2, preco: 690, status: 'disponivel', descricao: 'Suíte master com sala de estar, banheira de imersão e vista panorâmica.', amenities: ['Wi-Fi', 'Smart TV', 'Banheira', 'Ar-cond.', 'Frigobar', 'Sacada', 'Cofre', 'Roupão'] },
    { id: 'q302', numero: '302', tipo: 'Suíte Família', capacidade: 4, preco: 780, status: 'disponivel', descricao: 'Suíte ampla para famílias, com dois ambientes e dois banheiros.', amenities: ['Wi-Fi', 'Smart TV', 'Ar-cond.', 'Frigobar', '2 Banheiros', 'Sofá-cama'] },
    { id: 'q303', numero: '303', tipo: 'Suíte Master',  capacidade: 2, preco: 690, status: 'manutencao', descricao: 'Em manutenção elétrica até nova ordem.', amenities: ['Wi-Fi', 'Smart TV', 'Banheira', 'Ar-cond.', 'Frigobar'] },
  ],
  clients: [
    { id: 'c1', nome: 'Carlos Andrade',  cpf: '111.222.333-44', telefone: '(75) 98876-1100', email: 'carlos@email.com', criadoEm: '2026-04-12' },
    { id: 'c2', nome: 'Marina Souza',    cpf: '222.333.444-55', telefone: '(71) 99812-3344', email: 'marina@email.com', criadoEm: '2026-04-20' },
    { id: 'c3', nome: 'Roberto Lima',    cpf: '333.444.555-66', telefone: '(11) 99988-7766', email: 'roberto@email.com', criadoEm: '2026-04-25' },
  ],
  reservations: [
    {
      id: 'r1', codigo: 'BO-2026-0001',
      clienteId: 'c1', quartoId: 'q203',
      entrada: '2026-05-02', saida: '2026-05-06',
      diarias: 4, hospedes: 2,
      valorDiaria: 420, valorTotal: 1680, valorPago: 1680, valorRestante: 0,
      formaPagamento: 'pix',
      statusPagamento: 'pago',
      statusReserva: 'em_hospedagem',
      origem: 'online',
      observacoes: 'Aniversário de casamento.',
      criadaEm: '2026-04-12T15:30:00',
    },
    {
      id: 'r2', codigo: 'BO-2026-0002',
      clienteId: 'c2', quartoId: 'q202',
      entrada: '2026-05-08', saida: '2026-05-12',
      diarias: 4, hospedes: 2,
      valorDiaria: 420, valorTotal: 1680, valorPago: 800, valorRestante: 880,
      formaPagamento: 'cartao',
      statusPagamento: 'parcial',
      statusReserva: 'confirmada',
      origem: 'manual',
      observacoes: '',
      criadaEm: '2026-04-20T10:15:00',
    },
    {
      id: 'r3', codigo: 'BO-2026-0003',
      clienteId: 'c3', quartoId: 'q301',
      entrada: '2026-04-28', saida: '2026-05-01',
      diarias: 3, hospedes: 2,
      valorDiaria: 690, valorTotal: 2070, valorPago: 2070, valorRestante: 0,
      formaPagamento: 'cartao',
      statusPagamento: 'pago',
      statusReserva: 'finalizada',
      origem: 'online',
      observacoes: 'Cliente VIP, lua-de-mel.',
      criadaEm: '2026-04-10T09:00:00',
    },
  ],
  consumptions: [
    { id: 'cs1', reservaId: 'r1', produto: 'Vinho tinto Malbec',  qtd: 1, valorUnit: 180, valorTotal: 180, dataHora: '2026-05-02T20:30:00', funcionarioId: 'u2' },
    { id: 'cs2', reservaId: 'r1', produto: 'Café da manhã extra', qtd: 2, valorUnit: 45,  valorTotal: 90,  dataHora: '2026-05-03T08:00:00', funcionarioId: 'u2' },
    { id: 'cs3', reservaId: 'r1', produto: 'Massagem relaxante',  qtd: 1, valorUnit: 220, valorTotal: 220, dataHora: '2026-05-04T16:00:00', funcionarioId: 'u2' },
  ],
  payments: [
    { id: 'p1', reservaId: 'r1', valor: 1680, forma: 'pix',    data: '2026-04-12T15:35:00' },
    { id: 'p2', reservaId: 'r2', valor: 800,  forma: 'cartao', data: '2026-04-20T10:18:00' },
    { id: 'p3', reservaId: 'r3', valor: 2070, forma: 'cartao', data: '2026-04-10T09:05:00' },
  ],
  session: null,
  meta: { lastReservationNumber: 3 },
};

const DB = {
  load() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      this.save(SEED);
      return JSON.parse(JSON.stringify(SEED));
    }
    try { return JSON.parse(raw); } catch { this.save(SEED); return JSON.parse(JSON.stringify(SEED)); }
  },
  save(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); },
  reset() { localStorage.removeItem(DB_KEY); return this.load(); },

  uid(prefix = 'x') { return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); },

  /* ===== Auth ===== */
  login(email, senha) {
    const db = this.load();
    const user = db.users.find(u => u.email === email && u.senha === senha);
    if (!user) return null;
    db.session = { userId: user.id, ts: Date.now() };
    this.save(db);
    return user;
  },
  logout() { const db = this.load(); db.session = null; this.save(db); },
  currentUser() {
    const db = this.load();
    if (!db.session) return null;
    return db.users.find(u => u.id === db.session.userId) || null;
  },

  /* ===== Quartos ===== */
  rooms() { return this.load().rooms; },
  room(id) { return this.rooms().find(r => r.id === id); },
  saveRoom(room) {
    const db = this.load();
    if (room.id) {
      const i = db.rooms.findIndex(r => r.id === room.id);
      if (i >= 0) db.rooms[i] = { ...db.rooms[i], ...room };
    } else {
      room.id = this.uid('q');
      db.rooms.push(room);
    }
    this.save(db);
    return room;
  },
  deleteRoom(id) {
    const db = this.load();
    db.rooms = db.rooms.filter(r => r.id !== id);
    this.save(db);
  },
  setRoomStatus(id, status) {
    const db = this.load();
    const r = db.rooms.find(x => x.id === id);
    if (r) { r.status = status; this.save(db); }
  },

  /* ===== Clientes ===== */
  clients() { return this.load().clients; },
  client(id) { return this.clients().find(c => c.id === id); },
  saveClient(c) {
    const db = this.load();
    if (c.id) {
      const i = db.clients.findIndex(x => x.id === c.id);
      if (i >= 0) db.clients[i] = { ...db.clients[i], ...c };
    } else {
      c.id = this.uid('c');
      c.criadoEm = new Date().toISOString().slice(0, 10);
      db.clients.push(c);
    }
    this.save(db);
    return c;
  },
  findOrCreateClient({ nome, cpf, telefone, email }) {
    const db = this.load();
    let c = db.clients.find(x => x.cpf === cpf || x.email === email);
    if (c) return c;
    c = { id: this.uid('c'), nome, cpf, telefone, email, criadoEm: new Date().toISOString().slice(0, 10) };
    db.clients.push(c);
    this.save(db);
    return c;
  },

  /* ===== Reservas ===== */
  reservations() { return this.load().reservations; },
  reservation(id) { return this.reservations().find(r => r.id === id); },
  reservationByCode(code) { return this.reservations().find(r => r.codigo === code); },

  isRoomAvailable(quartoId, entrada, saida, ignoreReservaId = null) {
    const ds = new Date(entrada).getTime();
    const de = new Date(saida).getTime();
    if (de <= ds) return false;
    const conflict = this.reservations().some(r => {
      if (r.id === ignoreReservaId) return false;
      if (r.quartoId !== quartoId) return false;
      if (['cancelada', 'finalizada'].includes(r.statusReserva)) return false;
      const rs = new Date(r.entrada).getTime();
      const re = new Date(r.saida).getTime();
      return ds < re && de > rs;
    });
    return !conflict;
  },

  availableRoomsBetween(entrada, saida) {
    return this.rooms().filter(r => {
      if (r.status === 'manutencao') return false;
      return this.isRoomAvailable(r.id, entrada, saida);
    });
  },

  saveReservation(res) {
    const db = this.load();
    if (res.id) {
      const i = db.reservations.findIndex(r => r.id === res.id);
      if (i >= 0) db.reservations[i] = { ...db.reservations[i], ...res };
    } else {
      res.id = this.uid('r');
      db.meta.lastReservationNumber = (db.meta.lastReservationNumber || 0) + 1;
      const ano = new Date().getFullYear();
      res.codigo = `BO-${ano}-${String(db.meta.lastReservationNumber).padStart(4, '0')}`;
      res.criadaEm = new Date().toISOString();
      db.reservations.push(res);
    }
    this.save(db);
    this.refreshRoomStatuses();
    return res;
  },

  cancelReservation(id) {
    const db = this.load();
    const r = db.reservations.find(x => x.id === id);
    if (r) { r.statusReserva = 'cancelada'; this.save(db); this.refreshRoomStatuses(); }
  },

  checkIn(id) {
    const db = this.load();
    const r = db.reservations.find(x => x.id === id);
    if (!r) return;
    r.statusReserva = 'em_hospedagem';
    r.checkInAt = new Date().toISOString();
    const q = db.rooms.find(x => x.id === r.quartoId);
    if (q) q.status = 'ocupado';
    this.save(db);
  },

  checkOut(id) {
    const db = this.load();
    const r = db.reservations.find(x => x.id === id);
    if (!r) return;
    r.statusReserva = 'finalizada';
    r.checkOutAt = new Date().toISOString();
    const q = db.rooms.find(x => x.id === r.quartoId);
    if (q) q.status = 'limpeza';
    this.save(db);
  },

  /** Recalcula o status de cada quarto com base nas reservas ativas e na data atual. */
  refreshRoomStatuses() {
    const db = this.load();
    const today = new Date().toISOString().slice(0, 10);
    db.rooms.forEach(q => {
      if (['limpeza', 'manutencao'].includes(q.status)) return;
      const ativa = db.reservations.find(r =>
        r.quartoId === q.id &&
        !['cancelada', 'finalizada'].includes(r.statusReserva) &&
        r.entrada <= today && r.saida > today
      );
      const futura = db.reservations.find(r =>
        r.quartoId === q.id &&
        ['confirmada', 'pendente'].includes(r.statusReserva) &&
        r.entrada > today
      );
      if (ativa) q.status = ativa.statusReserva === 'em_hospedagem' ? 'ocupado' : 'reservado';
      else if (futura) q.status = 'reservado';
      else q.status = 'disponivel';
    });
    this.save(db);
  },

  /* ===== Consumo ===== */
  consumptions(reservaId = null) {
    const all = this.load().consumptions;
    return reservaId ? all.filter(c => c.reservaId === reservaId) : all;
  },
  addConsumption(c) {
    const db = this.load();
    c.id = this.uid('cs');
    c.dataHora = c.dataHora || new Date().toISOString();
    db.consumptions.push(c);
    this.save(db);
    return c;
  },
  removeConsumption(id) {
    const db = this.load();
    db.consumptions = db.consumptions.filter(c => c.id !== id);
    this.save(db);
  },

  /* ===== Pagamentos ===== */
  payments(reservaId = null) {
    const all = this.load().payments;
    return reservaId ? all.filter(p => p.reservaId === reservaId) : all;
  },
  addPayment(p) {
    const db = this.load();
    p.id = this.uid('p');
    p.data = p.data || new Date().toISOString();
    db.payments.push(p);
    /* atualiza valor pago da reserva */
    const r = db.reservations.find(x => x.id === p.reservaId);
    if (r) {
      r.valorPago = (r.valorPago || 0) + p.valor;
      r.valorRestante = Math.max(0, r.valorTotal - r.valorPago);
      r.statusPagamento = r.valorRestante === 0 ? 'pago' : (r.valorPago > 0 ? 'parcial' : 'pendente');
    }
    this.save(db);
    return p;
  },

  /* ===== Helpers / Utils ===== */
  formatBRL(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); },
  formatDate(d) {
    if (!d) return '—';
    const x = typeof d === 'string' ? new Date(d) : d;
    return x.toLocaleDateString('pt-BR');
  },
  formatDateTime(d) {
    if (!d) return '—';
    const x = typeof d === 'string' ? new Date(d) : d;
    return x.toLocaleString('pt-BR');
  },
  diffDays(d1, d2) {
    const a = new Date(d1).getTime();
    const b = new Date(d2).getTime();
    return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
  },
};

window.DB = DB;
