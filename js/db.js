/* ============================================================
   HOTEL BEGE OURO — CAMADA DE DADOS (Supabase)
   API pública mantida igual ao localStorage, mas métodos de
   escrita agora são async. Leituras são síncronas via cache.
   ============================================================ */

/* === Instância Supabase === */
const _sb = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);

/* === Cache em memória === */
const _cache = {
  rooms: [],
  clients: [],
  reservations: [],
  consumptions: [],
  payments: [],
  profiles: [],
  loaded: false,
};

/* === Mappers snake_case → camelCase === */
function _mapReservation(r) {
  if (!r) return null;
  return {
    id: r.id, codigo: r.codigo, clienteId: r.cliente_id, quartoId: r.quarto_id,
    entrada: r.entrada, saida: r.saida, diarias: r.diarias, hospedes: r.hospedes,
    valorDiaria: Number(r.valor_diaria), valorTotal: Number(r.valor_total),
    valorPago: Number(r.valor_pago), valorRestante: Number(r.valor_restante),
    formaPagamento: r.forma_pagamento, statusPagamento: r.status_pagamento,
    statusReserva: r.status_reserva, origem: r.origem, observacoes: r.observacoes,
    checkInAt: r.check_in_at, checkOutAt: r.check_out_at, criadaEm: r.criada_em,
  };
}
function _mapClient(c) {
  if (!c) return null;
  return { id: c.id, nome: c.nome, cpf: c.cpf, telefone: c.telefone, email: c.email, observacoes: c.observacoes, criadoEm: c.created_at?.slice(0, 10) };
}
function _mapPayment(p) {
  if (!p) return null;
  return { id: p.id, reservaId: p.reserva_id, valor: Number(p.valor), forma: p.forma, data: p.data };
}
function _mapConsumption(c) {
  if (!c) return null;
  return { id: c.id, reservaId: c.reserva_id, produto: c.produto, qtd: c.qtd, valorUnit: Number(c.valor_unit), valorTotal: Number(c.valor_total), funcionarioId: c.funcionario_id, dataHora: c.data_hora };
}
function _mapProfile(p) {
  if (!p) return null;
  return { id: p.id, nome: p.nome, perfil: p.perfil };
}

/* ============================================================
   DB — API pública
   ============================================================ */
const DB = {

  /* ===== Bootstrap: carrega tudo do Supabase para o cache ===== */
  async load() {
    const [roomsRes, clientsRes, reservsRes, consuRes, paysRes, profRes] = await Promise.all([
      _sb.from('rooms').select('*').order('numero'),
      _sb.from('clients').select('*').order('nome'),
      _sb.from('reservations').select('*').order('criada_em', { ascending: false }),
      _sb.from('consumptions').select('*').order('data_hora', { ascending: false }),
      _sb.from('payments').select('*').order('data', { ascending: false }),
      _sb.from('profiles').select('*'),
    ]);
    _cache.rooms        = (roomsRes.data   || []);
    _cache.clients      = (clientsRes.data || []).map(_mapClient);
    _cache.reservations = (reservsRes.data || []).map(_mapReservation);
    _cache.consumptions = (consuRes.data   || []).map(_mapConsumption);
    _cache.payments     = (paysRes.data    || []).map(_mapPayment);
    _cache.profiles     = (profRes.data    || []).map(_mapProfile);
    _cache.loaded       = true;
    this._subscribeRealtime();
  },

  _realtimeStarted: false,
  _subscribeRealtime() {
    if (this._realtimeStarted) return;
    this._realtimeStarted = true;
    _sb.channel('hotel-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, async () => {
        const { data } = await _sb.from('rooms').select('*').order('numero');
        _cache.rooms = data || [];
        if (window.App?.view === 'mapa') window.App.view_mapa?.();
        if (window.App?.view === 'quartos') window.App.view_quartos?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, async () => {
        const { data } = await _sb.from('reservations').select('*').order('criada_em', { ascending: false });
        _cache.reservations = (data || []).map(_mapReservation);
        if (window.App?.view === 'reservas') window.App.view_reservas?.();
        if (window.App?.view === 'checkin')  window.App.view_checkin?.();
        if (window.App?.view === 'inicio')   window.App.view_inicio?.();
        if (window.App?.view === 'mapa')     window.App.view_mapa?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
        const { data } = await _sb.from('payments').select('*').order('data', { ascending: false });
        _cache.payments = (data || []).map(_mapPayment);
        if (window.App?.view === 'pagamentos') window.App.view_pagamentos?.();
        if (window.App?.view === 'inicio')     window.App.view_inicio?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumptions' }, async () => {
        const { data } = await _sb.from('consumptions').select('*').order('data_hora', { ascending: false });
        _cache.consumptions = (data || []).map(_mapConsumption);
        if (window.App?.view === 'consumo') window.App.view_consumo?.();
      })
      .subscribe();
  },

  /* ===== Auth ===== */
  async login(email, senha) {
    // Usuários reais configurados conforme solicitado
    const credenciaisReais = [
      { id: 'admin-hardcoded', email: 'begeourohotel@hotmail.com', senha: 'BegeOuro@2026', nome: 'Administrador', perfil: 'admin' },
      { id: 'recepcao-hardcoded', email: 'recepcao@begeouro.com', senha: 'recepcao2026', nome: 'Recepção', perfil: 'funcionario' },
      { id: 'financeiro-hardcoded', email: 'financeiro@begeouro.com', senha: 'Financeiro@2026', nome: 'Financeiro', perfil: 'financeiro' }
    ];
    const userLocal = credenciaisReais.find(u => u.email === email && u.senha === senha);
    if (userLocal) {
      _cache._currentUser = { id: userLocal.id, email: userLocal.email, nome: userLocal.nome, perfil: userLocal.perfil };
      localStorage.setItem('hc_user', JSON.stringify(_cache._currentUser));
      return _cache._currentUser;
    }

    const { data, error } = await _sb.auth.signInWithPassword({ email, password: senha });
    if (error) return null;
    const { data: prof } = await _sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (!prof) return null;
    _cache._currentUser = { id: data.user.id, email: data.user.email, ...prof };
    return _cache._currentUser;
  },
  async logout() { 
    localStorage.removeItem('hc_user');
    await _sb.auth.signOut(); 
    _cache._currentUser = null; 
  },
  async currentUser() {
    if (_cache._currentUser) return _cache._currentUser;
    const hcStr = localStorage.getItem('hc_user');
    if (hcStr) {
      _cache._currentUser = JSON.parse(hcStr);
      return _cache._currentUser;
    }
    const { data: { user } } = await _sb.auth.getUser();
    if (!user) return null;
    const { data: prof } = await _sb.from('profiles').select('*').eq('id', user.id).single();
    if (!prof) return null;
    _cache._currentUser = { id: user.id, email: user.email, ...prof };
    return _cache._currentUser;
  },

  /* ===== Quartos ===== */
  rooms() { return _cache.rooms; },
  room(id) { return _cache.rooms.find(r => r.id === id); },
  async saveRoom(room) {
    const p = { id: room.id || undefined, numero: room.numero, tipo: room.tipo, capacidade: room.capacidade, preco: room.preco, status: room.status, descricao: room.descricao, amenities: room.amenities, updated_at: new Date().toISOString() };
    if (room.id) {
      await _sb.from('rooms').update(p).eq('id', room.id);
      const idx = _cache.rooms.findIndex(r => r.id === room.id);
      if (idx >= 0) _cache.rooms[idx] = { ..._cache.rooms[idx], ...p };
    } else {
      p.id = 'q' + Date.now().toString(36);
      const { data } = await _sb.from('rooms').insert(p).select().single();
      if (data) _cache.rooms.push(data);
      return data;
    }
    return room;
  },
  async deleteRoom(id) { await _sb.from('rooms').delete().eq('id', id); _cache.rooms = _cache.rooms.filter(r => r.id !== id); },
  async setRoomStatus(id, status) {
    await _sb.from('rooms').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    const r = _cache.rooms.find(x => x.id === id); if (r) r.status = status;
  },

  /* ===== Clientes ===== */
  clients() { return _cache.clients; },
  client(id) { return _cache.clients.find(c => c.id === id); },
  async saveClient(c) {
    const p = { nome: c.nome, cpf: c.cpf, telefone: c.telefone, email: c.email, observacoes: c.observacoes };
    if (c.id) {
      await _sb.from('clients').update(p).eq('id', c.id);
      const idx = _cache.clients.findIndex(x => x.id === c.id);
      if (idx >= 0) _cache.clients[idx] = { ..._cache.clients[idx], ...c };
    } else {
      const { data } = await _sb.from('clients').insert(p).select().single();
      const mapped = _mapClient(data); _cache.clients.push(mapped); return mapped;
    }
    return c;
  },
  async findOrCreateClient({ nome, cpf, telefone, email }) {
    let c = _cache.clients.find(x => (cpf && x.cpf === cpf) || (email && x.email === email));
    if (c) return c;
    let query = _sb.from('clients').select('*');
    if (cpf) query = query.eq('cpf', cpf); else if (email) query = query.eq('email', email);
    const { data: existing } = await query.maybeSingle();
    if (existing) { c = _mapClient(existing); _cache.clients.push(c); return c; }
    const { data } = await _sb.from('clients').insert({ nome, cpf, telefone, email }).select().single();
    c = _mapClient(data); _cache.clients.push(c); return c;
  },
  async deleteClient(id) { await _sb.from('clients').delete().eq('id', id); _cache.clients = _cache.clients.filter(c => c.id !== id); },

  /* ===== Reservas ===== */
  reservations() { return _cache.reservations; },
  reservation(id) { return _cache.reservations.find(r => r.id === id); },
  isRoomAvailable(quartoId, entrada, saida, ignoreId = null) {
    const ds = new Date(entrada).getTime(), de = new Date(saida).getTime();
    if (de <= ds) return false;
    return !_cache.reservations.some(r => {
      if (r.id === ignoreId || r.quartoId !== quartoId) return false;
      if (['cancelada','finalizada'].includes(r.statusReserva)) return false;
      return ds < new Date(r.saida).getTime() && de > new Date(r.entrada).getTime();
    });
  },
  availableRoomsBetween(entrada, saida) {
    return _cache.rooms.filter(r => r.status !== 'manutencao' && this.isRoomAvailable(r.id, entrada, saida));
  },
  async saveReservation(res) {
    const p = {
      cliente_id: res.clienteId, quarto_id: res.quartoId, entrada: res.entrada, saida: res.saida,
      diarias: res.diarias, hospedes: res.hospedes, valor_diaria: res.valorDiaria,
      valor_total: res.valorTotal, valor_pago: res.valorPago || 0, valor_restante: res.valorRestante,
      forma_pagamento: res.formaPagamento, status_pagamento: res.statusPagamento,
      status_reserva: res.statusReserva, origem: res.origem, observacoes: res.observacoes || '',
    };
    if (res.id) {
      await _sb.from('reservations').update(p).eq('id', res.id);
      const idx = _cache.reservations.findIndex(r => r.id === res.id);
      if (idx >= 0) _cache.reservations[idx] = { ..._cache.reservations[idx], ...res };
      await this.refreshRoomStatuses(); return res;
    } else {
      const { data } = await _sb.from('reservations').insert(p).select().single();
      const mapped = _mapReservation(data); _cache.reservations.unshift(mapped);
      await this.refreshRoomStatuses(); return mapped;
    }
  },
  async cancelReservation(id) {
    await _sb.from('reservations').update({ status_reserva: 'cancelada' }).eq('id', id);
    const r = _cache.reservations.find(x => x.id === id); if (r) r.statusReserva = 'cancelada';
    await this.refreshRoomStatuses();
  },
  async checkIn(id) {
    const r = _cache.reservations.find(x => x.id === id); if (!r) return;
    await _sb.from('reservations').update({ status_reserva: 'em_hospedagem', check_in_at: new Date().toISOString() }).eq('id', id);
    r.statusReserva = 'em_hospedagem';
    await _sb.from('rooms').update({ status: 'ocupado', updated_at: new Date().toISOString() }).eq('id', r.quartoId);
    const q = _cache.rooms.find(x => x.id === r.quartoId); if (q) q.status = 'ocupado';
  },
  async checkOut(id) {
    const r = _cache.reservations.find(x => x.id === id); if (!r) return;
    await _sb.from('reservations').update({ status_reserva: 'finalizada', check_out_at: new Date().toISOString() }).eq('id', id);
    r.statusReserva = 'finalizada';
    await _sb.from('rooms').update({ status: 'limpeza', updated_at: new Date().toISOString() }).eq('id', r.quartoId);
    const q = _cache.rooms.find(x => x.id === r.quartoId); if (q) q.status = 'limpeza';
  },
  async refreshRoomStatuses() {
    const today = new Date().toISOString().slice(0, 10);
    for (const q of _cache.rooms) {
      if (['limpeza','manutencao'].includes(q.status)) continue;
      const ativa = _cache.reservations.find(r => r.quartoId === q.id && !['cancelada','finalizada'].includes(r.statusReserva) && r.entrada <= today && r.saida > today);
      const futura = _cache.reservations.find(r => r.quartoId === q.id && ['confirmada','pendente'].includes(r.statusReserva) && r.entrada > today);
      const ns = ativa ? (ativa.statusReserva === 'em_hospedagem' ? 'ocupado' : 'reservado') : futura ? 'reservado' : 'disponivel';
      if (q.status !== ns) { q.status = ns; await _sb.from('rooms').update({ status: ns, updated_at: new Date().toISOString() }).eq('id', q.id); }
    }
  },

  /* ===== Consumo ===== */
  consumptions(reservaId = null) { const a = _cache.consumptions; return reservaId ? a.filter(c => c.reservaId === reservaId) : a; },
  async addConsumption(c) {
    const p = { reserva_id: c.reservaId, produto: c.produto, qtd: c.qtd, valor_unit: c.valorUnit, valor_total: c.valorTotal, funcionario_id: c.funcionarioId || null, data_hora: c.dataHora || new Date().toISOString() };
    const { data } = await _sb.from('consumptions').insert(p).select().single();
    const m = _mapConsumption(data); _cache.consumptions.unshift(m); return m;
  },

  /* ===== Pagamentos ===== */
  payments(reservaId = null) { const a = _cache.payments; return reservaId ? a.filter(p => p.reservaId === reservaId) : a; },
  async addPayment(p) {
    const payload = { reserva_id: p.reservaId, valor: p.valor, forma: p.forma, data: p.data || new Date().toISOString() };
    const { data } = await _sb.from('payments').insert(payload).select().single();
    const m = _mapPayment(data); _cache.payments.unshift(m);
    const r = _cache.reservations.find(x => x.id === p.reservaId);
    if (r) {
      r.valorPago = (r.valorPago || 0) + p.valor;
      r.valorRestante = Math.max(0, r.valorTotal - r.valorPago);
      r.statusPagamento = r.valorRestante === 0 ? 'pago' : (r.valorPago > 0 ? 'parcial' : 'pendente');
      await _sb.from('reservations').update({ valor_pago: r.valorPago, valor_restante: r.valorRestante, status_pagamento: r.statusPagamento }).eq('id', p.reservaId);
    }
    return m;
  },

  /* ===== Profiles ===== */
  profiles() { return _cache.profiles; },
  profile(id) { return _cache.profiles.find(p => p.id === id); },

  /* ===== Helpers ===== */
  formatBRL(v) { return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); },
  formatDate(d) { if (!d) return '—'; const x = typeof d === 'string' ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')) : d; return x.toLocaleDateString('pt-BR'); },
  formatDateTime(d) { if (!d) return '—'; return new Date(d).toLocaleString('pt-BR'); },
  diffDays(d1, d2) { return Math.max(0, Math.round((new Date(d2) - new Date(d1)) / 86400000)); },
};

window.DB = DB;
window._sb = _sb;
