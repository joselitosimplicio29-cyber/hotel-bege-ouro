/* ============================================================
   HOTEL BEGE OURO — CAMADA DE DADOS (Supabase)
   API pública mantida igual ao localStorage, mas métodos de
   escrita agora são async. Leituras são síncronas via cache.
   ============================================================ */

/* === Instância Supabase === */
let _sb = null;

function _getSB() {
  if (_sb) return _sb;
  if (!window.supabase?.createClient || !window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.anonKey) {
    return null;
  }

  try {
    _sb = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
    return _sb;
  } catch (err) {
    console.warn('Nao foi possivel iniciar o Supabase. Usando dados locais do site.', err);
    return null;
  }
}

async function _waitForSB(timeout = 2500) {
  if (_getSB()) return _sb;
  try {
    if (window.__supabaseReady) {
      await Promise.race([
        window.__supabaseReady,
        new Promise(resolve => setTimeout(resolve, timeout)),
      ]);
    }
  } catch (_) {}
  return _getSB();
}

const REMOTE_TIMEOUT_MS = 12000; // 12s — evita salvar só localmente em rede lenta
const OFFLINE_CACHE_KEY = 'hotel_ourobege_admin_cache_v1';
const OFFLINE_USER_KEY = 'hotel_ourobege_admin_user_v1';
const ROOM_STATUS_KEY  = 'hotel_ourobege_room_status_v1';

/* Persiste status manualmente definidos dos quartos no localStorage */
function _saveRoomStatuses() {
  try {
    const statuses = {};
    for (const r of _cache.rooms) {
      if (r.status !== 'disponivel') statuses[r.id] = r.status;
    }
    localStorage.setItem(ROOM_STATUS_KEY, JSON.stringify(statuses));
  } catch (_) {}
}

/* Restaura status salvos dos quartos */
function _loadRoomStatuses() {
  try {
    return JSON.parse(localStorage.getItem(ROOM_STATUS_KEY) || '{}');
  } catch (_) { return {}; }
}

function _withTimeout(promise, fallback = { data: null, error: null }) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), REMOTE_TIMEOUT_MS)),
  ]);
}

function _localId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function _reservationCode() {
  return `BO-${Date.now().toString().slice(-6)}`;
}

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

function _saveOfflineUser(user) {
  try {
    if (user) localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
  } catch (_) {}
}

function _loadOfflineUser() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_USER_KEY) || 'null');
  } catch (_) {
    return null;
  }
}

function _isNetworkAuthError(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('load failed');
}

function _isLocalId(id, prefix) {
  return String(id || '').startsWith(`${prefix}-`);
}

function _clearOfflineUser() {
  try { localStorage.removeItem(OFFLINE_USER_KEY); } catch (_) {}
}

function _saveOfflineCache() {
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify({
      clients: _cache.clients,
      reservations: _cache.reservations,
      consumptions: _cache.consumptions,
      payments: _cache.payments,
      profiles: _cache.profiles,
      savedAt: new Date().toISOString(),
    }));
  } catch (_) {}
}

function _loadOfflineCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) || 'null');
    if (!saved) return false;
    if (Array.isArray(saved.clients)) _cache.clients = saved.clients;
    if (Array.isArray(saved.reservations)) _cache.reservations = saved.reservations;
    if (Array.isArray(saved.consumptions)) _cache.consumptions = saved.consumptions;
    if (Array.isArray(saved.payments)) _cache.payments = saved.payments;
    if (Array.isArray(saved.profiles)) _cache.profiles = saved.profiles;
    return true;
  } catch (_) {
    return false;
  }
}

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
  return {
    id: p.id,
    reservaId: p.reserva_id,
    valor: Number(p.valor) || 0,
    forma: p.forma || 'outro',
    // garante que data nunca seja null — evita TypeError em p.data.slice()
    data: p.data || p.created_at || new Date().toISOString(),
  };
}
function _mapConsumption(c) {
  if (!c) return null;
  return { id: c.id, reservaId: c.reserva_id, produto: c.produto, qtd: c.qtd, valorUnit: Number(c.valor_unit), valorTotal: Number(c.valor_total), funcionarioId: c.funcionario_id, dataHora: c.data_hora };
}
function _profilePerfil(p = {}) {
  const raw = p.perfil ?? p.role ?? p.cargo ?? p.tipo ?? p.profile ?? p.funcao;
  const value = String(raw || '').trim().toLowerCase();
  if (['admin', 'administrador', 'administrator'].includes(value)) return 'admin';
  if (['funcionario', 'funcionário', 'recepcao', 'recepção'].includes(value)) return 'funcionario';
  if (['financeiro', 'finance'].includes(value)) return 'financeiro';
  return value;
}
function _mapProfile(p) {
  if (!p) return null;
  return { ...p, id: p.id, nome: p.nome || p.name || p.email || 'Usuario', perfil: _profilePerfil(p) };
}

/* ============================================================
   DB — API pública
   ============================================================ */
const DB = {

  /* ===== Bootstrap: carrega tudo do Supabase para o cache ===== */
  async load() {
    const QUARTOS_FIXOS = [
      { id: 'q01', numero: "01", andar: "Térreo", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto aconchegante com cama de casal.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q02', numero: "02", andar: "Térreo", tipo: "duplo_solteiro", camas: "2 camas de solteiro", capacidade: 2, preco: 150, preco_1p: 150, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto com duas camas de solteiro.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q03', numero: "03", andar: "Térreo", tipo: "triplo", camas: "1 cama de casal + 1 solteiro", capacidade: 3, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: 330, status: "disponivel", descricao: "Quarto triplo com cama de casal e solteiro.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q04', numero: "04", andar: "Térreo", tipo: "duplo_solteiro", camas: "2 camas de solteiro", capacidade: 2, preco: 150, preco_1p: 150, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto duplo solteiro espaçoso.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q05', numero: "05", andar: "Térreo", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Conforto em quarto de casal.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q06', numero: "06", andar: "Térreo", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto de casal aconchegante no térreo.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q07', numero: "07", andar: "Térreo", tipo: "solteiro", camas: "1 cama de solteiro", capacidade: 1, preco: 150, preco_1p: 150, preco_2p: null, preco_3p: null, status: "disponivel", descricao: "Quarto prático para viajante solo.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q08', numero: "08", andar: "Térreo", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto de casal agradável.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q101', numero: "101", andar: "1º andar", tipo: "triplo", camas: "1 cama de casal + 1 solteiro", capacidade: 3, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: 330, status: "disponivel", descricao: "Quarto triplo superior com excelente iluminação.", amenities: ["Wi-Fi", "Ar condicionado", "TV", "Frigobar"] },
      { id: 'q102', numero: "102", andar: "1º andar", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto de casal com janela ampla.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q103', numero: "103", andar: "1º andar", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Aconchego e tranquilidade no primeiro andar.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q104', numero: "104", andar: "1º andar", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto padrão casal.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q105', numero: "105", andar: "1º andar", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto de casal confortável no primeiro andar.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q106', numero: "106", andar: "1º andar", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto iluminado e confortável.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q107', numero: "107", andar: "1º andar", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Conforto clássico para duas pessoas.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
      { id: 'q108', numero: "108", andar: "1º andar", tipo: "casal", camas: "1 cama de casal", capacidade: 2, preco: 190, preco_1p: 190, preco_2p: 270, preco_3p: null, status: "disponivel", descricao: "Quarto com bela vista.", amenities: ["Wi-Fi", "Ar condicionado", "TV"] },
    ];
    _cache.rooms        = QUARTOS_FIXOS;

    // Restaura status manuais (limpeza, manutencao, etc.) salvos no localStorage
    const _savedStatuses = _loadRoomStatuses();
    for (const r of _cache.rooms) {
      if (_savedStatuses[r.id]) r.status = _savedStatuses[r.id];
    }

    const sb = await _waitForSB();

    if (_cache.loaded) return;
    if (!sb) {
      _loadOfflineCache();
      _cache.loaded = true;
      return;
    }

    // Detecta se usuário tem sessão (admin) ou está como anônimo (cliente público)
    let isAuth = false;
    try {
      const { data: { user } } = await sb.auth.getUser();
      isAuth = !!user;
    } catch (_) {
      isAuth = !!_loadOfflineUser();
    }

    try {
      if (isAuth) {
        // ===== Admin autenticado: acesso completo =====
        const [clientsRes, reservsRes, consuRes, paysRes, profRes] = await Promise.all([
          _withTimeout(sb.from('clients').select('*').order('nome')),
          _withTimeout(sb.from('reservations').select('*').order('criada_em', { ascending: false })),
          _withTimeout(sb.from('consumptions').select('*').order('data_hora', { ascending: false })),
          _withTimeout(sb.from('payments').select('*').order('data', { ascending: false })),
          _withTimeout(sb.from('profiles').select('*')),
        ]);

        const gotRemoteData = [clientsRes, reservsRes, consuRes, paysRes, profRes].some(res => Array.isArray(res.data));
        if (gotRemoteData) {
          _cache.clients      = (clientsRes.data || []).map(_mapClient);
          _cache.reservations = (reservsRes.data || []).map(_mapReservation);
          _cache.consumptions = (consuRes.data   || []).map(_mapConsumption);
          _cache.payments     = (paysRes.data    || []).map(_mapPayment);
          _cache.profiles     = (profRes.data    || []).map(_mapProfile);
          _saveOfflineCache();
          this._subscribeRealtime();
        } else {
          _loadOfflineCache();
        }
      } else {
        // ===== Público anônimo: só campos de disponibilidade, sem PII =====
        const { data } = await _withTimeout(
          sb.from('reservations_availability').select('*')
        );
        _cache.reservations = (data || []).map(r => ({
          id: r.id,
          quartoId: r.quarto_id,
          entrada: r.entrada,
          saida: r.saida,
          statusReserva: r.status_reserva,
          // campos PII propositalmente ausentes
        }));
        // clients/payments/consumptions/profiles ficam vazios (anon não pode ler)
      }
    } catch (err) {
      console.warn('Nao foi possivel carregar os dados remotos. Usando cache local.', err);
      _loadOfflineCache();
    } finally {
      _cache.loaded = true;
    }
  },

  _realtimeStarted: false,
  _subscribeRealtime() {
    const sb = _getSB();
    if (!sb || this._realtimeStarted) return;
    this._realtimeStarted = true;
    sb.channel('hotel-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, async () => {
        const { data } = await sb.from('reservations').select('*').order('criada_em', { ascending: false });
        _cache.reservations = (data || []).map(_mapReservation);
        await this.refreshRoomStatuses();
        _saveOfflineCache();
        if (window.App?.view === 'reservas') window.App.view_reservas?.();
        if (window.App?.view === 'checkin')  window.App.view_checkin?.();
        if (window.App?.view === 'inicio')   window.App.view_inicio?.();
        if (window.App?.view === 'mapa')     window.App.view_mapa?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
        const { data } = await sb.from('payments').select('*').order('data', { ascending: false });
        _cache.payments = (data || []).map(_mapPayment);
        _saveOfflineCache();
        if (window.App?.view === 'pagamentos') window.App.view_pagamentos?.();
        if (window.App?.view === 'inicio')     window.App.view_inicio?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumptions' }, async () => {
        const { data } = await sb.from('consumptions').select('*').order('data_hora', { ascending: false });
        _cache.consumptions = (data || []).map(_mapConsumption);
        _saveOfflineCache();
        if (window.App?.view === 'consumo') window.App.view_consumo?.();
      })
      .subscribe();
  },

  /* ===== Auth (somente via Supabase Auth — sem credenciais hardcoded) ===== */
  async login(email, senha) {
    const sb = await _waitForSB();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cachedUser = _loadOfflineUser();
    if (!sb) {
      _cache._currentUser = cachedUser && cachedUser.email === normalizedEmail ? cachedUser : null;
      return _cache._currentUser;
    }
    // Limpa qualquer resíduo do antigo sistema hardcoded
    try { localStorage.removeItem('hc_user'); } catch (_) {}

    const authPromise = sb.auth.signInWithPassword({
      email: normalizedEmail,
      password: senha,
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
    let data, error;
    try {
      ({ data, error } = await Promise.race([authPromise, timeout]));
    } catch (e) {
      _cache._currentUser = cachedUser && cachedUser.email === normalizedEmail ? cachedUser : null;
      return _cache._currentUser;
    }
    if (error && _isNetworkAuthError(error)) {
      _cache._currentUser = cachedUser && cachedUser.email === normalizedEmail ? cachedUser : null;
      return _cache._currentUser;
    }
    if (error || !data?.user) return null;

    const { data: prof, error: profError } = await Promise.race([
      sb.from('profiles').select('*').eq('id', data.user.id).single(),
      new Promise(resolve => setTimeout(() => resolve({ data: null, error: new Error('profile-timeout') }), 8000)),
    ]);
    if (profError || !prof) {
      // Usuário existe no Auth mas não tem profile cadastrado → bloqueia
      try { await Promise.race([sb.auth.signOut(), new Promise(r => setTimeout(r, 3000))]); } catch (_) {}
      return null;
    }
    _cache._currentUser = { id: data.user.id, email: data.user.email, ...prof, perfil: _profilePerfil(prof) };
    _saveOfflineUser(_cache._currentUser);
    return _cache._currentUser;
  },

  offlineUser(email = '') {
    const user = _loadOfflineUser();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return user;
    return user && user.email === normalizedEmail ? user : null;
  },

  async logout() {
    try { localStorage.removeItem('hc_user'); } catch (_) {}
    _clearOfflineUser();
    const sb = _getSB();
    if (sb) await sb.auth.signOut();
    _cache._currentUser = null;
    _cache.loaded = false; // força recarregar como anon na próxima navegação
  },

  async currentUser() {
    if (_cache._currentUser) return _cache._currentUser;
    const sb = await _waitForSB();
    if (!sb) {
      _cache._currentUser = _loadOfflineUser();
      return _cache._currentUser;
    }

    // SEMPRE valida com o Supabase — nunca confia apenas em localStorage
    let user = null;
    try {
      ({ data: { user } } = await sb.auth.getUser());
    } catch (_) {
      _cache._currentUser = _loadOfflineUser();
      return _cache._currentUser;
    }
    if (!user) {
      _clearOfflineUser();
      return null;
    }

    const { data: prof, error: profError } = await _withTimeout(
      sb.from('profiles').select('*').eq('id', user.id).single(),
      { data: null, error: new Error('profile-timeout') }
    );
    if (profError || !prof) {
      _cache._currentUser = _loadOfflineUser();
      return _cache._currentUser;
    }

    _cache._currentUser = { id: user.id, email: user.email, ...prof, perfil: _profilePerfil(prof) };
    _saveOfflineUser(_cache._currentUser);
    return _cache._currentUser;
  },

  /* ===== Quartos ===== */
  rooms() { return _cache.rooms; },
  room(id) { return _cache.rooms.find(r => r.id === id); },
  async saveRoom(room) {
    // Rooms are hardcoded, saving is disabled to avoid Supabase errors
    return room;
  },
  async deleteRoom(id) { 
    // Disabled
  },
  async setRoomStatus(id, status) {
    const r = _cache.rooms.find(x => x.id === id);
    if (r) {
      r.status = status;
      _saveRoomStatuses(); // persiste no localStorage para sobreviver ao reload
    }
  },

  /* ===== Clientes ===== */
  clients() { return _cache.clients; },
  client(id) { return _cache.clients.find(c => c.id === id); },
  async saveClient(c) {
    const saveLocal = () => {
      const local = {
        ...c,
        id: c.id || _localId('client'),
        criadoEm: c.criadoEm || new Date().toISOString().slice(0, 10),
        _savedLocallyOnly: true,
      };
      const idx = _cache.clients.findIndex(x => x.id === local.id);
      if (idx >= 0) _cache.clients[idx] = { ..._cache.clients[idx], ...local };
      else _cache.clients.push(local);
      _saveOfflineCache();
      return local;
    };

    const sb = await _waitForSB(800);
    if (!sb || _isLocalId(c.id, 'client')) return saveLocal();

    const p = { nome: c.nome, cpf: c.cpf, telefone: c.telefone, email: c.email, observacoes: c.observacoes };
    try {
      if (c.id) {
        const { error } = await _withTimeout(sb.from('clients').update(p).eq('id', c.id), { error: new Error('timeout') });
        if (error) throw error;
        const idx = _cache.clients.findIndex(x => x.id === c.id);
        if (idx >= 0) _cache.clients[idx] = { ..._cache.clients[idx], ...c };
      } else {
        const { data, error } = await _withTimeout(sb.from('clients').insert(p).select().single(), { data: null, error: new Error('timeout') });
        if (error || !data) throw error || new Error('client-insert-timeout');
        const mapped = _mapClient(data); _cache.clients.push(mapped); _saveOfflineCache(); return mapped;
      }
      _saveOfflineCache();
      return c;
    } catch (err) {
      console.error('[DB.saveClient] Falha ao salvar no Supabase — salvando localmente. Erro:', err?.message || err);
      return saveLocal();
    }
  },
  async findOrCreateClient({ nome, cpf, telefone, email }) {
    let c = _cache.clients.find(x => (cpf && x.cpf === cpf) || (email && x.email === email));
    if (c) return c;

    const saveLocal = () => {
      const local = { id: _localId('client'), nome, cpf, telefone, email, observacoes: '', criadoEm: new Date().toISOString().slice(0, 10), _savedLocallyOnly: true };
      _cache.clients.push(local);
      _saveOfflineCache();
      return local;
    };

    const sb = await _waitForSB(800);
    if (!sb) return saveLocal();

    try {
      let query = sb.from('clients').select('*');
      if (cpf) query = query.eq('cpf', cpf); else if (email) query = query.eq('email', email);
      const { data: existing, error: existingError } = await _withTimeout(query.maybeSingle(), { data: null, error: null });
      if (existingError) throw existingError;
      if (existing) { c = _mapClient(existing); _cache.clients.push(c); _saveOfflineCache(); return c; }
      const { data, error } = await _withTimeout(sb.from('clients').insert({ nome, cpf, telefone, email }).select().single(), { data: null, error: new Error('timeout') });
      if (error || !data) throw error || new Error('client-insert-timeout');
      c = _mapClient(data); _cache.clients.push(c); _saveOfflineCache(); return c;
    } catch (err) {
      console.error('[DB.findOrCreateClient] Falha ao salvar no Supabase — salvando localmente. Erro:', err?.message || err);
      return saveLocal();
    }
  },
  async deleteClient(id) {
    const sb = _getSB();
    try { if (sb && !_isLocalId(id, 'client')) await sb.from('clients').delete().eq('id', id); } catch (_) {}
    _cache.clients = _cache.clients.filter(c => c.id !== id);
    _saveOfflineCache();
  },

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
    const saveLocal = async () => {
      const local = {
        ...res,
        id: res.id || _localId('reservation'),
        codigo: res.codigo || _reservationCode(),
        criadaEm: new Date().toISOString(),
      };
      const idx = _cache.reservations.findIndex(r => r.id === local.id);
      if (idx >= 0) _cache.reservations[idx] = { ..._cache.reservations[idx], ...local };
      else _cache.reservations.unshift(local);
      await this.refreshRoomStatuses();
      _saveOfflineCache();
      return local;
    };

    const sb = await _waitForSB(800);
    if (!sb || _isLocalId(res.id, 'reservation') || _isLocalId(res.clienteId, 'client')) return saveLocal();

    const p = {
      cliente_id: res.clienteId, quarto_id: res.quartoId, entrada: res.entrada, saida: res.saida,
      diarias: res.diarias, hospedes: res.hospedes, valor_diaria: res.valorDiaria,
      valor_total: res.valorTotal, valor_pago: res.valorPago || 0, valor_restante: res.valorRestante,
      forma_pagamento: res.formaPagamento, status_pagamento: res.statusPagamento,
      status_reserva: res.statusReserva, origem: res.origem, observacoes: res.observacoes || '',
    };
    try {
      if (res.id) {
        const { error } = await _withTimeout(sb.from('reservations').update(p).eq('id', res.id), { error: new Error('timeout') });
        if (error) throw error;
        const idx = _cache.reservations.findIndex(r => r.id === res.id);
        if (idx >= 0) _cache.reservations[idx] = { ..._cache.reservations[idx], ...res };
        await this.refreshRoomStatuses(); _saveOfflineCache(); return res;
      } else {
        const { data, error } = await _withTimeout(sb.from('reservations').insert(p).select().single(), { data: null, error: new Error('timeout') });
        if (error || !data) throw error || new Error('reservation-insert-timeout');
        const mapped = _mapReservation(data); _cache.reservations.unshift(mapped);
        await this.refreshRoomStatuses(); _saveOfflineCache(); return mapped;
      }
    } catch (err) {
      console.error('[DB.saveReservation] Falha ao salvar no Supabase — salvando localmente. Erro:', err?.message || err);
      const saved = await saveLocal();
      saved._savedLocallyOnly = true; // sinaliza fallback para o chamador exibir aviso
      return saved;
    }
  },
  /**
   * Cria reserva online (cliente público) via RPC SECURITY DEFINER.
   * Anon NÃO precisa de SELECT nem INSERT direto em reservations/clients —
   * tudo passa pela função `create_reservation_online` que valida e retorna só {id, codigo}.
   * Substitui o antigo findOrCreateClient + saveReservation que vazava PII.
   */
  async createReservationOnline(payload) {
    const sb = await _waitForSB();
    const saveLocal = () => {
      const local = {
        id: _localId('reservation'),
        codigo: _reservationCode(),
        ...payload,
      };
      _cache.reservations.unshift({
        id: local.id, quartoId: payload.quartoId,
        entrada: payload.entrada, saida: payload.saida,
        statusReserva: 'pendente',
      });
      _saveOfflineCache();
      return { id: local.id, codigo: local.codigo };
    };
    if (!sb) {
      // Fallback local (sem Supabase)
      return saveLocal();
    }

    const { data, error } = await _withTimeout(sb.rpc('create_reservation_online', {
      p_nome:         payload.nome,
      p_cpf:          payload.cpf || null,
      p_telefone:     payload.telefone,
      p_email:        payload.email,
      p_quarto_id:    payload.quartoId,
      p_entrada:      payload.entrada,
      p_saida:        payload.saida,
      p_diarias:      payload.diarias,
      p_hospedes:     payload.hospedes,
      p_valor_diaria: payload.valorDiaria,
      p_valor_total:  payload.valorTotal,
      p_observacoes:  payload.observacoes || null,
    }), { data: null, error: new Error('timeout') });
    if (error) {
      console.error('RPC create_reservation_online falhou:', error);
      return saveLocal();
    }
    if (!data) return saveLocal();
    // Atualiza cache local (só campos seguros, pra checagem de disponibilidade)
    _cache.reservations.unshift({
      id: data?.id, quartoId: payload.quartoId,
      entrada: payload.entrada, saida: payload.saida,
      statusReserva: 'pendente',
    });
    return { id: data?.id, codigo: data?.codigo };
  },

  async cancelReservation(id) {
    const sb = _getSB();
    try {
      if (sb && !_isLocalId(id, 'reservation')) {
        await _withTimeout(
          sb.from('reservations').update({ status_reserva: 'cancelada' }).eq('id', id),
          { error: new Error('timeout') }
        );
      }
    } catch (_) {}
    const r = _cache.reservations.find(x => x.id === id); if (r) r.statusReserva = 'cancelada';
    await this.refreshRoomStatuses();
    _saveOfflineCache();
  },
  async forceCancelReservation(id) {
    const r = _cache.reservations.find(x => x.id === id);
    if (r) r.statusReserva = 'cancelada';
    await this.refreshRoomStatuses();
    _saveOfflineCache();
    return r;
  },
  async deleteReservation(id) {
    const sb = _getSB();
    if (sb && !_isLocalId(id, 'reservation')) {
      // Apaga pagamentos vinculados primeiro
      await sb.from('payments').delete().eq('reserva_id', id);
      // Apaga consumos vinculados
      await sb.from('consumptions').delete().eq('reserva_id', id);
      // Apaga a reserva
      await sb.from('reservations').delete().eq('id', id);
    }
    _cache.reservations = _cache.reservations.filter(r => r.id !== id);
    _cache.payments = _cache.payments.filter(p => p.reservaId !== id);
    _cache.consumptions = _cache.consumptions.filter(c => c.reservaId !== id);
    await this.refreshRoomStatuses();
    _saveOfflineCache();
  },
  async deleteCancelledTestReservations() {
    // Apaga TODAS as reservas canceladas cujo cliente tem nome "cancelado" (case-insensitive)
    const testIds = _cache.reservations
      .filter(r => {
        if (r.statusReserva !== 'cancelada') return false;
        const cli = _cache.clients.find(c => c.id === r.clienteId);
        return !cli || /^cancelad/i.test(cli.nome?.trim());
      })
      .map(r => r.id);
    for (const id of testIds) await this.deleteReservation(id);
    return testIds.length;
  },
  async checkIn(id) {
    const r = _cache.reservations.find(x => x.id === id); if (!r) return;
    const sb = await _waitForSB(800);
    if (sb && !_isLocalId(id, 'reservation')) {
      const { error } = await _withTimeout(
        sb.from('reservations').update({ status_reserva: 'em_hospedagem', check_in_at: new Date().toISOString() }).eq('id', id),
        { error: new Error('timeout') }
      );
      if (error) console.warn('checkIn: falha ao atualizar Supabase', error);
    }
    r.statusReserva = 'em_hospedagem';
    if (sb) {
      const { error } = await _withTimeout(
        sb.from('rooms').update({ status: 'ocupado', updated_at: new Date().toISOString() }).eq('id', r.quartoId),
        { error: new Error('timeout') }
      );
      if (error) console.warn('checkIn: falha ao atualizar quarto', error);
    }
    const q = _cache.rooms.find(x => x.id === r.quartoId); if (q) q.status = 'ocupado';
    _saveRoomStatuses();
    _saveOfflineCache();
  },
  async checkOut(id) {
    const r = _cache.reservations.find(x => x.id === id); if (!r) return;
    const sb = await _waitForSB(800);
    if (sb && !_isLocalId(id, 'reservation')) {
      const { error } = await _withTimeout(
        sb.from('reservations').update({ status_reserva: 'finalizada', check_out_at: new Date().toISOString() }).eq('id', id),
        { error: new Error('timeout') }
      );
      if (error) console.warn('checkOut: falha ao atualizar Supabase', error);
    }
    r.statusReserva = 'finalizada';
    if (sb) {
      const { error } = await _withTimeout(
        sb.from('rooms').update({ status: 'limpeza', updated_at: new Date().toISOString() }).eq('id', r.quartoId),
        { error: new Error('timeout') }
      );
      if (error) console.warn('checkOut: falha ao atualizar quarto', error);
    }
    const q = _cache.rooms.find(x => x.id === r.quartoId); if (q) q.status = 'limpeza';
    _saveRoomStatuses();
    _saveOfflineCache();
  },
  async refreshRoomStatuses() {
    const today = new Date().toISOString().slice(0, 10);
    let changed = false;
    for (const q of _cache.rooms) {
      // Limpeza/manutencao definidas manualmente — só limpa se chegar uma reserva ativa
      if (['limpeza','manutencao'].includes(q.status)) {
        const ativa = _cache.reservations.find(r =>
          r.quartoId === q.id &&
          !['cancelada','finalizada'].includes(r.statusReserva) &&
          r.entrada <= today && r.saida >= today
        );
        if (ativa) {
          // Reserva começou — remove o status manual e deixa a lógica abaixo agir
          q.status = 'disponivel';
          changed = true;
        } else {
          continue; // mantém limpeza/manutencao enquanto não há reserva ativa
        }
      }
      const ativa = _cache.reservations.find(r => r.quartoId === q.id && !['cancelada','finalizada'].includes(r.statusReserva) && r.entrada <= today && r.saida >= today);
      const ns = ativa ? (ativa.statusReserva === 'em_hospedagem' ? 'ocupado' : 'reservado') : 'disponivel';
      if (q.status !== ns) { q.status = ns; changed = true; }
    }
    if (changed) _saveRoomStatuses(); // persiste mudanças automáticas
  },

  /* ===== Consumo ===== */
  consumptions(reservaId = null) { const a = _cache.consumptions; return reservaId ? a.filter(c => c.reservaId === reservaId) : a; },
  async addConsumption(c) {
    const saveLocal = () => {
      const m = { ...c, id: c.id || _localId('consumption'), dataHora: c.dataHora || new Date().toISOString(), _savedLocallyOnly: true };
      _cache.consumptions.unshift(m);
      _saveOfflineCache();
      return m;
    };
    const sb = await _waitForSB(800);
    if (!sb || _isLocalId(c.reservaId, 'reservation')) return saveLocal();
    const p = { reserva_id: c.reservaId, produto: c.produto, qtd: c.qtd, valor_unit: c.valorUnit, valor_total: c.valorTotal, funcionario_id: c.funcionarioId || null, data_hora: c.dataHora || new Date().toISOString() };
    try {
      const { data, error } = await _withTimeout(sb.from('consumptions').insert(p).select().single(), { data: null, error: new Error('timeout') });
      if (error || !data) throw error || new Error('consumption-insert-timeout');
      const m = _mapConsumption(data); _cache.consumptions.unshift(m); _saveOfflineCache(); return m;
    } catch (err) {
      console.error('[DB.addConsumption] Falha ao salvar no Supabase — salvando localmente. Erro:', err?.message || err);
      return saveLocal();
    }
  },

  /* ===== Pagamentos ===== */
  payments(reservaId = null) { const a = _cache.payments; return reservaId ? a.filter(p => p.reservaId === reservaId) : a; },
  async updateReservationPaymentFields(r) {
    try {
      const sb = _getSB();
      if (sb && !_isLocalId(r.id, 'reservation')) await sb.from('reservations').update({ valor_pago: r.valorPago, valor_restante: r.valorRestante, status_pagamento: r.statusPagamento }).eq('id', r.id);
      _saveOfflineCache();
    } catch(e) { console.warn('Erro ao corrigir valorPago:', e); }
  },
  async deletePayment(pagamentoId, reservaId) {
    const sb = _getSB();
    try { if (sb && !_isLocalId(pagamentoId, 'payment')) await sb.from('payments').delete().eq('id', pagamentoId); } catch (_) {}
    _cache.payments = _cache.payments.filter(p => p.id !== pagamentoId);
    const r = _cache.reservations.find(x => x.id === reservaId);
    if (r) {
      const totalPago = _cache.payments.filter(p => p.reservaId === reservaId).reduce((s,p) => s + p.valor, 0);
      r.valorPago = totalPago;
      r.valorRestante = Math.max(0, r.valorTotal - totalPago);
      r.statusPagamento = totalPago >= r.valorTotal ? 'pago' : totalPago > 0 ? 'parcial' : 'pendente';
      r.statusReserva = totalPago >= r.valorTotal ? 'confirmada' : 'pendente';
      try { if (sb && !_isLocalId(reservaId, 'reservation')) await sb.from('reservations').update({ valor_pago: r.valorPago, valor_restante: r.valorRestante, status_pagamento: r.statusPagamento, status_reserva: r.statusReserva }).eq('id', reservaId); } catch (_) {}
    }
    _saveOfflineCache();
  },
  async addPayment(p) {
    const saveLocal = () => {
      const m = { ...p, id: p.id || _localId('payment'), data: p.data || new Date().toISOString(), _savedLocallyOnly: true };
      _cache.payments.unshift(m);
      const r = _cache.reservations.find(x => x.id === p.reservaId);
      if (r) {
        r.valorPago = (r.valorPago || 0) + p.valor;
        r.valorRestante = Math.max(0, r.valorTotal - r.valorPago);
        r.statusPagamento = r.valorRestante === 0 ? 'pago' : (r.valorPago > 0 ? 'parcial' : 'pendente');
        r.statusReserva = r.valorRestante === 0 ? 'confirmada' : r.statusReserva;
      }
      _saveOfflineCache();
      return m;
    };
    const sb = await _waitForSB(800);
    if (!sb || _isLocalId(p.reservaId, 'reservation')) return saveLocal();

    const payload = { reserva_id: p.reservaId, valor: p.valor, forma: p.forma, data: p.data || new Date().toISOString() };
    try {
      const { data, error } = await _withTimeout(sb.from('payments').insert(payload).select().single(), { data: null, error: new Error('timeout') });
      if (error || !data) throw error || new Error('payment-insert-timeout');
      const m = _mapPayment(data); _cache.payments.unshift(m);
        const r = _cache.reservations.find(x => x.id === p.reservaId);
      if (r) {
        r.valorPago = (r.valorPago || 0) + p.valor;
        r.valorRestante = Math.max(0, r.valorTotal - r.valorPago);
        r.statusPagamento = r.valorRestante === 0 ? 'pago' : (r.valorPago > 0 ? 'parcial' : 'pendente');
        r.statusReserva = r.valorRestante === 0 ? 'confirmada' : r.statusReserva;
        await _withTimeout(
          sb.from('reservations').update({
            valor_pago: r.valorPago,
            valor_restante: r.valorRestante,
            status_pagamento: r.statusPagamento,
            status_reserva: r.statusReserva,
          }).eq('id', p.reservaId),
          { error: new Error('timeout') }
        );
      }
      _saveOfflineCache();
      return m;
    } catch (err) {
      console.error('[DB.addPayment] Falha ao salvar no Supabase — salvando localmente. Erro:', err?.message || err);
      return saveLocal();
    }
  },

  async forceConfirmPayment(reservaId, valor, forma = 'whatsapp') {
    const r = _cache.reservations.find(x => x.id === reservaId);
    if (!r) return null;
    const amount = Number(valor) || Math.max(0, (r.valorTotal || 0) - (r.valorPago || 0));
    if (amount > 0) {
      _cache.payments.unshift({
        id: _localId('payment'),
        reservaId,
        valor: amount,
        forma,
        data: new Date().toISOString(),
      });
    }
    const totalPago = _cache.payments
      .filter(p => p.reservaId === reservaId)
      .reduce((s, p) => s + (Number(p.valor) || 0), 0);
    r.valorPago = totalPago;
    r.valorRestante = Math.max(0, (r.valorTotal || 0) - totalPago);
    r.statusPagamento = r.valorRestante === 0 ? 'pago' : (r.valorPago > 0 ? 'parcial' : 'pendente');
    if (r.valorRestante === 0) r.statusReserva = 'confirmada';
    _saveOfflineCache();
    return r;
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
window._getSB = _getSB;
