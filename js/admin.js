/* ============================================================
   HOTEL BEGE OURO — DASHBOARD (controlador principal)
   ============================================================ */

const App = {
  user: null,
  view: 'inicio',

  /* ===== Permissões ===== */
  perms: {
    admin: ['inicio','mapa','reservas','checkin','consumo','quartos','clientes','pagamentos','relatorios'],
    funcionario: ['inicio','mapa','reservas','checkin','consumo','clientes'],
    financeiro: ['inicio','pagamentos','relatorios','reservas'],
  },
  can(view) { return this.perms[this.user?.perfil]?.includes(view); },

  /* ===== Helpers de Label ===== */
  statusLabel(s) {
    const map = {
      pendente:       'Aguardando pgto',
      confirmada:     'Pagamento confirmado',
      em_hospedagem:  'Em hospedagem',
      finalizada:     'Reserva concluída',
      cancelada:      'Cancelada',
    };
    return map[s] || s.replace('_',' ');
  },
  statusPagLabel(s) {
    const map = { pendente: 'Pendente', parcial: 'Parcial', pago: 'Pago' };
    return map[s] || s;
  },

  async init() {
    document.getElementById('content').innerHTML = '<div style="padding:60px; text-align:center; color:var(--cinza-texto);">Carregando...</div>';
    await DB.load();
    this.user = await DB.currentUser();
    if (!this.user) { location.href = 'login.html'; return; }
    await DB.refreshRoomStatuses();

    document.getElementById('userName').textContent = this.user.nome;
    document.getElementById('userRole').textContent = this.user.perfil;

    /* nav */
    document.querySelectorAll('.sb-nav a').forEach(a => {
      const v = a.dataset.view;
      if (!this.can(v)) a.style.display = 'none';
      a.addEventListener('click', e => { e.preventDefault(); this.go(v); });
    });
    document.getElementById('logoutBtn').addEventListener('click', async e => {
      e.preventDefault(); await DB.logout(); location.href = 'login.html';
    });
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') this.closeModal(); });
    document.getElementById('sbToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    this.go('inicio');
  },

  go(view) {
    if (!this.can(view)) {
      this.view = view;
      this.render(`<div class="access-denied"><h2>Acesso restrito</h2><p>Seu perfil não tem permissão para acessar essa área.</p></div>`, '—');
      return;
    }
    this.view = view;
    document.querySelectorAll('.sb-nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
    if (window.innerWidth <= 880) document.getElementById('sidebar').classList.remove('open');
    const fn = `view_${view}`;
    if (this[fn]) this[fn]();
  },

  render(html, title = '', actions = '') {
    document.getElementById('content').innerHTML = html;
    document.getElementById('viewTitle').textContent = title;
    document.getElementById('topActions').innerHTML = actions;
  },

  toast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.className = `toast ${type}`;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove('show'), 3200);
  },

  openModal(title, body, foot = '') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFoot').innerHTML = foot;
    document.getElementById('modal').classList.add('open');
  },
  closeModal() {
    document.getElementById('modal').classList.remove('open');
  },

  /* ============================================================
     INÍCIO — KPIs e visão geral
     ============================================================ */
  view_inicio() {
    const today = new Date().toISOString().slice(0, 10);
    const rooms = DB.rooms();
    const reservs = DB.reservations();
    const ativas = reservs.filter(r => ['confirmada', 'em_hospedagem', 'pendente'].includes(r.statusReserva));
    const ocupados = rooms.filter(r => r.status === 'ocupado').length;
    const taxa = rooms.length ? Math.round((ocupados / rooms.length) * 100) : 0;

    const monthStart = today.slice(0, 8) + '01';
    const fatMes = DB.payments().filter(p => p.data >= monthStart).reduce((s, p) => s + p.valor, 0);
    const fatHoje = DB.payments().filter(p => p.data.slice(0, 10) === today).reduce((s, p) => s + p.valor, 0);

    const checkinsHoje = reservs.filter(r => r.entrada === today && r.statusReserva !== 'cancelada');
    const checkoutsHoje = reservs.filter(r => r.saida === today && r.statusReserva !== 'cancelada');
    const pendentesPgto = reservs.filter(r => r.valorRestante > 0 && r.statusReserva !== 'cancelada');

    const html = `
      <div class="kpi-grid">
        <div class="kpi"><div class="label">Ocupação atual</div><div class="value">${taxa}%</div><div class="delta">${ocupados} de ${rooms.length} quartos</div></div>
        <div class="kpi"><div class="label">Faturamento do mês</div><div class="value">${DB.formatBRL(fatMes)}</div><div class="delta up">Hoje: ${DB.formatBRL(fatHoje)}</div></div>
        <div class="kpi"><div class="label">Reservas ativas</div><div class="value">${ativas.length}</div><div class="delta">Em andamento ou futuras</div></div>
        <div class="kpi"><div class="label">Pagamentos pendentes</div><div class="value">${pendentesPgto.length}</div><div class="delta down">${DB.formatBRL(pendentesPgto.reduce((s,r)=>s+r.valorRestante,0))} a receber</div></div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div class="card">
          <div class="card-head"><h2>Check-ins de hoje</h2><span class="pill pill-confirmada">${checkinsHoje.length}</span></div>
          <div class="card-body tight">
            ${checkinsHoje.length ? this.renderReservaList(checkinsHoje) : '<div class="table-empty">Nenhum check-in para hoje.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Check-outs de hoje</h2><span class="pill pill-em_hospedagem">${checkoutsHoje.length}</span></div>
          <div class="card-body tight">
            ${checkoutsHoje.length ? this.renderReservaList(checkoutsHoje) : '<div class="table-empty">Nenhum check-out para hoje.</div>'}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 24px;">
        <div class="card-head"><h2>Reservas recentes</h2></div>
        <div class="card-body tight">${this.renderReservaList(reservs.slice().sort((a,b) => (b.criadaEm||'').localeCompare(a.criadaEm||'')).slice(0, 6))}</div>
      </div>
    `;
    this.render(html, `Olá, ${this.user.nome.split(' ')[0]} ✦`);
  },

  renderReservaList(list) {
    if (!list.length) return '<div class="table-empty">—</div>';
    return `
      <table class="table">
        <thead><tr><th>Código</th><th>Cliente</th><th>Quarto</th><th>Período</th><th>Status</th></tr></thead>
        <tbody>
          ${list.map(r => {
            const cli = DB.client(r.clienteId);
            const room = DB.room(r.quartoId);
            const isOnlinePendente = r.origem === 'online' && r.statusReserva === 'pendente';
            return `
              <tr style="cursor:pointer${isOnlinePendente ? '; background: #fffbeb;' : ''}" onclick="App.openReservaDetail('${r.id}')">
                <td><strong>${r.codigo}</strong>${isOnlinePendente ? ' <span style="font-size:0.7rem; background:#f59e0b; color:#fff; padding:2px 6px; border-radius:4px; vertical-align:middle;">ONLINE</span>' : ''}</td>
                <td>${cli?.nome || '—'}</td>
                <td>${room?.numero || '—'}</td>
                <td>${DB.formatDate(r.entrada)} → ${DB.formatDate(r.saida)}</td>
                <td><span class="pill pill-${r.statusReserva}">${this.statusLabel(r.statusReserva)}</span></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  /* ============================================================
     MAPA DE QUARTOS
     ============================================================ */
  view_mapa() {
    DB.refreshRoomStatuses();
    const rooms = DB.rooms();
    const today = new Date().toISOString().slice(0, 10);

    const counts = rooms.reduce((acc, r) => { acc[r.status] = (acc[r.status]||0) + 1; return acc; }, {});

    const html = `
      <div class="card">
        <div class="card-head">
          <h2>Mapa visual dos quartos</h2>
          <div class="legend">
            <span class="legend-item"><span class="legend-dot d-disponivel"></span>Disponível (${counts.disponivel||0})</span>
            <span class="legend-item"><span class="legend-dot d-reservado"></span>Reservado (${counts.reservado||0})</span>
            <span class="legend-item"><span class="legend-dot d-ocupado"></span>Ocupado (${counts.ocupado||0})</span>
            <span class="legend-item"><span class="legend-dot d-limpeza"></span>Limpeza (${counts.limpeza||0})</span>
            <span class="legend-item"><span class="legend-dot d-manutencao"></span>Manutenção (${counts.manutencao||0})</span>
          </div>
        </div>
        <div class="card-body">
          <div class="room-map" id="roomMap">
            ${rooms.map(r => {
              const reservaAtiva = DB.reservations().find(x =>
                x.quartoId === r.id &&
                !['cancelada','finalizada'].includes(x.statusReserva) &&
                x.entrada <= today && x.saida > today
              );
              return `
                <div class="room-tile s-${r.status}" onclick="App.openRoomDetail('${r.id}')">
                  <span class="num">${r.numero}</span>
                  <span class="tipo">${r.tipo}</span>
                  <span class="status-badge">${r.status}</span>
                  ${reservaAtiva ? `<div style="margin-top:10px; font-size:0.78rem; color:var(--escuro-suave);">${DB.client(reservaAtiva.clienteId)?.nome.split(' ')[0]}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>`;
    this.render(html, 'Mapa de quartos');
  },

  openRoomDetail(quartoId) {
    const room = DB.room(quartoId);
    const today = new Date().toISOString().slice(0, 10);
    const ativa = DB.reservations().find(r =>
      r.quartoId === quartoId &&
      !['cancelada','finalizada'].includes(r.statusReserva) &&
      r.entrada <= today && r.saida > today
    );
    const futura = DB.reservations().find(r =>
      r.quartoId === quartoId &&
      ['confirmada','pendente'].includes(r.statusReserva) &&
      r.entrada > today
    );
    const consumos = ativa ? DB.consumptions(ativa.id) : [];
    const totalConsumo = consumos.reduce((s,c) => s + c.valorTotal, 0);

    let body = `
      <div style="margin-bottom: 20px;">
        <span class="status-badge" style="background: var(--${room.status === 'disponivel' ? 'verde' : room.status === 'reservado' ? 'amarelo' : room.status === 'ocupado' ? 'vermelho' : room.status === 'limpeza' ? 'azul' : 'cinza-st'}); color:#fff; padding:5px 12px; font-size:0.7rem; letter-spacing:0.1em; text-transform:uppercase;">${room.status}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-row"><span class="lbl">Número</span><span class="val">${room.numero}</span></div>
        <div class="detail-row"><span class="lbl">Tipo</span><span class="val">${room.tipo}</span></div>
        <div class="detail-row"><span class="lbl">Capacidade</span><span class="val">${room.capacidade} pessoas</span></div>
        <div class="detail-row"><span class="lbl">Diária</span><span class="val">${DB.formatBRL(room.preco)}</span></div>
      </div>`;

    if (ativa) {
      const cli = DB.client(ativa.clienteId);
      body += `
        <h3 style="margin: 26px 0 14px; font-size: 1.05rem; color: var(--dourado-escuro);">Hóspede atual</h3>
        <div class="detail-grid">
          <div class="detail-row"><span class="lbl">Cliente</span><span class="val">${cli?.nome}</span></div>
          <div class="detail-row"><span class="lbl">Reserva</span><span class="val">${ativa.codigo}</span></div>
          <div class="detail-row"><span class="lbl">Entrada</span><span class="val">${DB.formatDate(ativa.entrada)}</span></div>
          <div class="detail-row"><span class="lbl">Saída</span><span class="val">${DB.formatDate(ativa.saida)}</span></div>
          <div class="detail-row"><span class="lbl">Valor total</span><span class="val">${DB.formatBRL(ativa.valorTotal)}</span></div>
          <div class="detail-row"><span class="lbl">Valor pago</span><span class="val">${DB.formatBRL(ativa.valorPago)}</span></div>
          <div class="detail-row"><span class="lbl">Restante</span><span class="val" style="color:${ativa.valorRestante > 0 ? 'var(--vermelho)' : 'var(--verde)'}">${DB.formatBRL(ativa.valorRestante)}</span></div>
          <div class="detail-row"><span class="lbl">Consumo</span><span class="val">${DB.formatBRL(totalConsumo)}</span></div>
          <div class="detail-row full"><span class="lbl">Status hospedagem</span><span class="pill pill-${ativa.statusReserva}">${ativa.statusReserva.replace('_',' ')}</span></div>
        </div>`;
    } else if (futura) {
      const cli = DB.client(futura.clienteId);
      body += `
        <h3 style="margin: 26px 0 14px; font-size: 1.05rem; color: var(--dourado-escuro);">Próxima reserva</h3>
        <div class="detail-grid">
          <div class="detail-row"><span class="lbl">Cliente</span><span class="val">${cli?.nome}</span></div>
          <div class="detail-row"><span class="lbl">Código</span><span class="val">${futura.codigo}</span></div>
          <div class="detail-row"><span class="lbl">Entrada</span><span class="val">${DB.formatDate(futura.entrada)}</span></div>
          <div class="detail-row"><span class="lbl">Saída</span><span class="val">${DB.formatDate(futura.saida)}</span></div>
        </div>`;
    } else {
      body += `<p style="margin-top:18px; color:var(--cinza-texto);">Nenhuma reserva ativa ou agendada.</p>`;
    }

    body += `
      <h3 style="margin: 26px 0 14px; font-size: 1.05rem; color: var(--dourado-escuro);">Alterar status</h3>
      <select id="newStatus">
        ${['disponivel','reservado','ocupado','limpeza','manutencao'].map(s => `<option value="${s}" ${s===room.status?'selected':''}>${s}</option>`).join('')}
      </select>`;

    let foot = `
      <button class="btn btn-outline" onclick="App.closeModal()">Fechar</button>
      <button class="btn btn-primary" onclick="App.saveRoomStatus('${quartoId}')">Salvar status</button>`;

    if (ativa && this.can('checkin')) {
      foot = `<button class="btn btn-outline" onclick="App.closeModal()">Fechar</button>` +
        (ativa.statusReserva === 'em_hospedagem'
          ? `<button class="btn btn-dark" onclick="App.openConsumoFor('${ativa.id}')">Lançar consumo</button>
             <button class="btn btn-primary" onclick="App.doCheckOut('${ativa.id}')">Fazer check-out</button>`
          : `<button class="btn btn-primary" onclick="App.doCheckIn('${ativa.id}')">Fazer check-in</button>`);
    }

    this.openModal(`Quarto ${room.numero}`, body, foot);
  },

  async saveRoomStatus(id) {
    const status = document.getElementById('newStatus').value;
    await DB.setRoomStatus(id, status);
    this.toast('Status atualizado.');
    this.closeModal();
    if (this.view === 'mapa') this.view_mapa();
    if (this.view === 'quartos') this.view_quartos();
  },

  /* ============================================================
     RESERVAS — listar, criar manual, detalhe
     ============================================================ */
  view_reservas() {
    const reservs = DB.reservations().slice().sort((a,b) => (b.criadaEm||'').localeCompare(a.criadaEm||''));
    const html = `
      <div class="card">
        <div class="card-head">
          <h2>Todas as reservas <small style="color:var(--cinza-texto); font-family:'Inter',sans-serif; font-size:0.85rem;">(${reservs.length})</small></h2>
          <div class="actions">
            <select id="filterStatus" onchange="App.filterReservas()" style="margin:0; padding: 8px 12px; font-size: 0.82rem;">
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="confirmada">Confirmada</option>
              <option value="em_hospedagem">Em hospedagem</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
            ${this.can('checkin') ? '<button class="btn btn-primary" onclick="App.openNewReserva()">+ Nova reserva</button>' : ''}
          </div>
        </div>
        <div class="card-body tight" id="reservasTable">
          ${this.renderReservasTable(reservs)}
        </div>
      </div>`;
    this.render(html, 'Reservas');
  },

  renderReservasTable(list) {
    if (!list.length) return '<div class="table-empty">Nenhuma reserva encontrada.</div>';
    return `
      <table class="table">
        <thead><tr><th>Código</th><th>Cliente</th><th>Quarto</th><th>Entrada</th><th>Saída</th><th>Total</th><th>Pgto</th><th>Status</th><th>Origem</th><th></th></tr></thead>
        <tbody>
          ${list.map(r => {
            const cli = DB.client(r.clienteId);
            const room = DB.room(r.quartoId);
            const isOnlinePendente = r.origem === 'online' && r.statusReserva === 'pendente';
            return `
              <tr${isOnlinePendente ? ' style="background:#fffbeb;"' : ''}>
                <td><strong>${r.codigo}</strong>${isOnlinePendente ? ' <span style="font-size:0.68rem; background:#f59e0b; color:#fff; padding:2px 5px; border-radius:4px;">ONLINE</span>' : ''}</td>
                <td>${cli?.nome || '—'}</td>
                <td>${room?.numero || '—'}</td>
                <td>${DB.formatDate(r.entrada)}</td>
                <td>${DB.formatDate(r.saida)}</td>
                <td>${DB.formatBRL(r.valorTotal)}</td>
                <td><span class="pill pill-${r.statusPagamento}">${this.statusPagLabel(r.statusPagamento)}</span></td>
                <td><span class="pill pill-${r.statusReserva}">${this.statusLabel(r.statusReserva)}</span></td>
                <td><span class="pill pill-${r.origem}">${r.origem}</span></td>
                <td class="actions">${isOnlinePendente ? `<button class="btn btn-primary btn-sm" onclick="App.confirmPayment('${r.id}')">&#10003; Confirmar pgto</button>` : ''}<button class="btn btn-outline btn-sm" onclick="App.openReservaDetail('${r.id}')">Ver</button></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  filterReservas() {
    const st = document.getElementById('filterStatus').value;
    let list = DB.reservations().slice().sort((a,b) => (b.criadaEm||'').localeCompare(a.criadaEm||''));
    if (st) list = list.filter(r => r.statusReserva === st);
    document.getElementById('reservasTable').innerHTML = this.renderReservasTable(list);
  },

  openNewReserva() {
    const rooms = DB.rooms();
    const clients = DB.clients();
    const body = `
      <div class="form-grid">
        <div class="form-row full">
          <label class="field">Cliente</label>
          <select id="nrCliente">
            <option value="">— selecione —</option>
            ${clients.map(c => `<option value="${c.id}">${c.nome} · ${c.cpf}</option>`).join('')}
            <option value="__new">+ Cadastrar novo cliente</option>
          </select>
        </div>
        <div class="form-row" id="newCliBlock" style="display:none; grid-column:1/-1;">
          <div class="form-grid">
            <div><label class="field">Nome</label><input type="text" id="ncNome"></div>
            <div><label class="field">CPF</label><input type="text" id="ncCpf"></div>
            <div><label class="field">Telefone</label><input type="text" id="ncTel"></div>
            <div><label class="field">E-mail</label><input type="email" id="ncEmail"></div>
          </div>
        </div>
        <div class="form-row">
          <label class="field">Entrada</label>
          <input type="date" id="nrEntrada">
        </div>
        <div class="form-row">
          <label class="field">Saída</label>
          <input type="date" id="nrSaida">
        </div>
        <div class="form-row">
          <label class="field">Quarto</label>
          <select id="nrQuarto">
            ${rooms.map(r => `<option value="${r.id}">${r.numero} · ${r.tipo} · ${DB.formatBRL(r.preco)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="field">Hóspedes</label>
          <input type="number" id="nrHospedes" min="1" value="2">
        </div>
        <div class="form-row">
          <label class="field">Forma de pagamento</label>
          <select id="nrPgto">
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div class="form-row">
          <label class="field">Valor pago</label>
          <input type="number" id="nrPago" min="0" value="0" step="0.01">
        </div>
        <div class="form-row full">
          <label class="field">Observações</label>
          <textarea id="nrObs"></textarea>
        </div>
      </div>`;
    const foot = `
      <button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="App.saveNewReserva()">Salvar reserva</button>`;
    this.openModal('Nova reserva manual', body, foot);

    document.getElementById('nrCliente').addEventListener('change', e => {
      document.getElementById('newCliBlock').style.display = e.target.value === '__new' ? '' : 'none';
    });
  },

  async saveNewReserva() {
    const cliSel = document.getElementById('nrCliente').value;
    const entrada = document.getElementById('nrEntrada').value;
    const saida = document.getElementById('nrSaida').value;
    const quartoId = document.getElementById('nrQuarto').value;
    const hospedes = Number(document.getElementById('nrHospedes').value);
    const forma = document.getElementById('nrPgto').value;
    const pago = parseFloat(document.getElementById('nrPago').value) || 0;
    const obs = document.getElementById('nrObs').value;

    if (!cliSel || !entrada || !saida) return this.toast('Preencha todos os campos.', 'error');
    const diarias = DB.diffDays(entrada, saida);
    if (diarias < 1) return this.toast('Datas inválidas.', 'error');
    if (!DB.isRoomAvailable(quartoId, entrada, saida)) return this.toast('Quarto indisponível neste período.', 'error');

    let clienteId = cliSel;
    if (cliSel === '__new') {
      const nome = document.getElementById('ncNome').value.trim();
      const cpf = document.getElementById('ncCpf').value.trim();
      const tel = document.getElementById('ncTel').value.trim();
      const email = document.getElementById('ncEmail').value.trim();
      if (!nome || !cpf) return this.toast('Preencha os dados do novo cliente.', 'error');
      const c = await DB.findOrCreateClient({ nome, cpf, telefone: tel, email });
      clienteId = c.id;
    }

    const room = DB.room(quartoId);
    const total = room.preco * diarias;
    const r = await DB.saveReservation({
      clienteId, quartoId, entrada, saida, diarias, hospedes,
      valorDiaria: room.preco, valorTotal: total, valorPago: pago, valorRestante: total - pago,
      formaPagamento: forma,
      statusPagamento: pago >= total ? 'pago' : pago > 0 ? 'parcial' : 'pendente',
      statusReserva: pago >= total ? 'confirmada' : 'pendente',
      origem: 'manual', observacoes: obs,
    });
    if (pago > 0) await DB.addPayment({ reservaId: r.id, valor: pago, forma });

    this.closeModal();
    this.toast('Reserva criada com sucesso!');
    this.view_reservas();
  },

  openReservaDetail(reservaId) {
    const r = DB.reservation(reservaId);
    if (!r) return;
    const cli = DB.client(r.clienteId);
    const room = DB.room(r.quartoId);
    const consumos = DB.consumptions(reservaId);
    const totalConsumo = consumos.reduce((s,c) => s + c.valorTotal, 0);
    const pgs = DB.payments(reservaId);

    const body = `
      <div style="margin-bottom: 14px; display: flex; gap: 10px; flex-wrap:wrap;">
        <span class="pill pill-${r.statusReserva}">${this.statusLabel(r.statusReserva)}</span>
        <span class="pill pill-${r.statusPagamento}">Pgto: ${this.statusPagLabel(r.statusPagamento)}</span>
        <span class="pill pill-${r.origem}">${r.origem}</span>
      </div>

      <div class="detail-grid">
        <div class="detail-row"><span class="lbl">Código</span><span class="val">${r.codigo}</span></div>
        <div class="detail-row"><span class="lbl">Cliente</span><span class="val">${cli?.nome}</span></div>
        <div class="detail-row"><span class="lbl">CPF</span><span class="val">${cli?.cpf || '—'}</span></div>
        <div class="detail-row"><span class="lbl">Contato</span><span class="val">${cli?.telefone || '—'}</span></div>
        <div class="detail-row"><span class="lbl">Quarto</span><span class="val">${room?.numero} — ${room?.tipo}</span></div>
        <div class="detail-row"><span class="lbl">Hóspedes</span><span class="val">${r.hospedes}</span></div>
        <div class="detail-row"><span class="lbl">Entrada</span><span class="val">${DB.formatDate(r.entrada)}</span></div>
        <div class="detail-row"><span class="lbl">Saída</span><span class="val">${DB.formatDate(r.saida)}</span></div>
        <div class="detail-row"><span class="lbl">Diárias</span><span class="val">${r.diarias} × ${DB.formatBRL(r.valorDiaria)}</span></div>
        <div class="detail-row"><span class="lbl">Forma de pagamento</span><span class="val">${r.formaPagamento}</span></div>
      </div>

      <div style="margin-top: 24px; padding: 18px; background: var(--cinza-fundo);">
        <div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Hospedagem</span><strong>${DB.formatBRL(r.valorTotal)}</strong></div>
        ${totalConsumo > 0 ? `<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Consumo (${consumos.length} itens)</span><strong>${DB.formatBRL(totalConsumo)}</strong></div>` : ''}
        <div style="display:flex; justify-content:space-between; padding:5px 0; border-top: 1px solid var(--cinza-borda); margin-top:6px; padding-top:10px;"><span>Total geral</span><strong>${DB.formatBRL(r.valorTotal + totalConsumo)}</strong></div>
        <div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Pago</span><strong style="color:var(--verde);">${DB.formatBRL(r.valorPago)}</strong></div>
        <div style="display:flex; justify-content:space-between; padding:5px 0;"><span>Restante</span><strong style="color:${r.valorRestante > 0 ? 'var(--vermelho)' : 'var(--verde)'}">${DB.formatBRL(Math.max(0, (r.valorTotal + totalConsumo) - r.valorPago))}</strong></div>
      </div>

      ${r.observacoes ? `<div style="margin-top:18px;"><span class="lbl" style="font-size:0.7rem; letter-spacing:0.15em; text-transform:uppercase; color:var(--cinza-texto); display:block; margin-bottom:6px;">Observações</span><div style="font-style:italic; color:var(--cinza-texto);">${r.observacoes}</div></div>` : ''}

      ${consumos.length ? `
        <h3 style="margin: 24px 0 12px; font-size: 1rem; color: var(--dourado-escuro);">Itens de consumo</h3>
        <table class="table" style="font-size:0.82rem;">
          ${consumos.map(c => `<tr><td>${c.produto}</td><td>${c.qtd}× ${DB.formatBRL(c.valorUnit)}</td><td><strong>${DB.formatBRL(c.valorTotal)}</strong></td></tr>`).join('')}
        </table>` : ''}

      ${pgs.length ? `
        <h3 style="margin: 24px 0 12px; font-size: 1rem; color: var(--dourado-escuro);">Pagamentos</h3>
        <table class="table" style="font-size:0.82rem;">
          ${pgs.map(p => `<tr><td>${DB.formatDateTime(p.data)}</td><td>${p.forma}</td><td><strong>${DB.formatBRL(p.valor)}</strong></td></tr>`).join('')}
        </table>` : ''}
    `;

    let foot = `<button class="btn btn-outline" onclick="App.closeModal()">Fechar</button>`;
    if (r.statusReserva === 'em_hospedagem' || r.statusReserva === 'finalizada') {
      foot += `<button class="btn btn-outline" onclick="PDF.comprovante('${r.id}')">&#128196; Comprovante PDF</button>`;
    }
    // Botão de confirmar pagamento para reservas online pendentes
    if (r.statusReserva === 'pendente' && r.origem === 'online') {
      foot += `<button class="btn btn-primary" style="background:#16a34a; border-color:#16a34a;" onclick="App.confirmPayment('${r.id}')">&#10003; Confirmar Pagamento</button>`;
    }
    if (this.can('pagamentos') && r.valorRestante > 0 && r.statusReserva !== 'cancelada' && r.statusReserva !== 'pendente') {
      foot += `<button class="btn btn-dark" onclick="App.openPagamento('${r.id}')">+ Lançar pagamento</button>`;
    }
    if (this.can('checkin')) {
      if (r.statusReserva === 'confirmada') {
        foot += `<button class="btn btn-primary" onclick="App.doCheckIn('${r.id}')">Check-in</button>`;
      } else if (r.statusReserva === 'em_hospedagem') {
        foot += `<button class="btn btn-dark" onclick="App.openConsumoFor('${r.id}')">+ Consumo</button>`;
        foot += `<button class="btn btn-primary" onclick="App.doCheckOut('${r.id}')">Check-out</button>`;
      }
      if (!['finalizada','cancelada'].includes(r.statusReserva)) {
        foot += `<button class="btn btn-danger" onclick="App.cancelReserva('${r.id}')">Cancelar</button>`;
      }
    }
    this.openModal(`Reserva ${r.codigo}`, body, foot);
  },

  /* ===== Confirmar Pagamento (reserva online via WhatsApp) ===== */
  async confirmPayment(reservaId) {
    const r = DB.reservation(reservaId);
    if (!r) return;
    const cli = DB.client(r.clienteId);
    const nomeCliente = cli?.nome || 'este cliente';
    if (!confirm(`Confirmar pagamento da reserva ${r.codigo} de ${nomeCliente}?\nValor: ${DB.formatBRL(r.valorTotal)}\n\nEsta ação irá alterar o status para "Pagamento confirmado".`)) return;
    try {
      // Atualiza status da reserva para confirmada
      await DB.saveReservation({ ...r, statusReserva: 'confirmada', statusPagamento: 'pago', valorPago: r.valorTotal, valorRestante: 0 });
      // Registra o pagamento no financeiro
      await DB.addPayment({ reservaId, valor: r.valorTotal, forma: r.formaPagamento || 'whatsapp' });
      this.toast('Pagamento confirmado com sucesso! Reserva atualizada.');
      this.closeModal();
      if (this.view === 'reservas') this.view_reservas();
      else if (this.view === 'inicio') this.view_inicio();
      else if (this.view === 'pagamentos') this.view_pagamentos();
    } catch(err) {
      console.error(err);
      this.toast('Erro ao confirmar pagamento.', 'error');
    }
  },

  async doCheckIn(id) {
    await DB.checkIn(id);
    this.toast('Check-in realizado!');
    this.closeModal();
    if (this.view === 'reservas') this.view_reservas();
    else if (this.view === 'mapa') this.view_mapa();
    else if (this.view === 'checkin') this.view_checkin();
    else this.view_inicio();
  },

  async doCheckOut(id) {
    if (!confirm('Confirmar check-out? Será gerado o comprovante final.')) return;
    await DB.checkOut(id);
    this.toast('Check-out realizado!');
    this.closeModal();
    setTimeout(() => PDF.comprovante(id), 200);
    if (this.view === 'reservas') this.view_reservas();
    else if (this.view === 'mapa') this.view_mapa();
    else if (this.view === 'checkin') this.view_checkin();
    else this.view_inicio();
  },

  async cancelReserva(id) {
    if (!confirm('Tem certeza que quer cancelar essa reserva?')) return;
    await DB.cancelReservation(id);
    this.toast('Reserva cancelada.');
    this.closeModal();
    this.view_reservas();
  },

  /* ============================================================
     CHECK-IN / CHECK-OUT — visão dedicada
     ============================================================ */
  view_checkin() {
    const today = new Date().toISOString().slice(0, 10);
    const all = DB.reservations();

    const aChegada = all.filter(r => r.entrada === today && ['confirmada','pendente'].includes(r.statusReserva));
    const emHosp = all.filter(r => r.statusReserva === 'em_hospedagem');
    const aSair = emHosp.filter(r => r.saida === today);

    const html = `
      <div class="card">
        <div class="card-head"><h2>Chegadas hoje (${aChegada.length})</h2></div>
        <div class="card-body tight">${this.renderCheckinTable(aChegada, 'in')}</div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Saídas hoje (${aSair.length})</h2></div>
        <div class="card-body tight">${this.renderCheckinTable(aSair, 'out')}</div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Em hospedagem (${emHosp.length})</h2></div>
        <div class="card-body tight">${this.renderCheckinTable(emHosp, 'mid')}</div>
      </div>`;
    this.render(html, 'Check-in & Check-out');
  },

  renderCheckinTable(list, kind) {
    if (!list.length) return '<div class="table-empty">Nenhum registro.</div>';
    return `
      <table class="table">
        <thead><tr><th>Código</th><th>Cliente</th><th>Quarto</th><th>Período</th><th>Total</th><th>Status</th><th>Ação</th></tr></thead>
        <tbody>
          ${list.map(r => {
            const cli = DB.client(r.clienteId);
            const room = DB.room(r.quartoId);
            const action = kind === 'in'
              ? `<button class="btn btn-primary btn-sm" onclick="App.doCheckIn('${r.id}')">Check-in</button>`
              : kind === 'out'
                ? `<button class="btn btn-primary btn-sm" onclick="App.doCheckOut('${r.id}')">Check-out</button>`
                : `<button class="btn btn-outline btn-sm" onclick="App.openReservaDetail('${r.id}')">Ver</button>`;
            return `
              <tr>
                <td><strong>${r.codigo}</strong></td>
                <td>${cli?.nome}</td>
                <td>${room?.numero}</td>
                <td>${DB.formatDate(r.entrada)} → ${DB.formatDate(r.saida)}</td>
                <td>${DB.formatBRL(r.valorTotal)}</td>
                <td><span class="pill pill-${r.statusReserva}">${App.statusLabel(r.statusReserva)}</span></td>
                <td>${action}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  },

  /* ============================================================
     CONSUMO
     ============================================================ */
  view_consumo() {
    const ativas = DB.reservations().filter(r => r.statusReserva === 'em_hospedagem');
    const consumos = DB.consumptions();

    const html = `
      <div class="card">
        <div class="card-head">
          <h2>Hóspedes em hospedagem</h2>
          <small style="color:var(--cinza-texto);">${ativas.length} reservas ativas</small>
        </div>
        <div class="card-body tight">
          ${ativas.length ? `
            <table class="table">
              <thead><tr><th>Quarto</th><th>Cliente</th><th>Entrada</th><th>Saída</th><th>Consumo</th><th></th></tr></thead>
              <tbody>
                ${ativas.map(r => {
                  const cli = DB.client(r.clienteId);
                  const room = DB.room(r.quartoId);
                  const cs = DB.consumptions(r.id);
                  const tot = cs.reduce((s,c) => s + c.valorTotal, 0);
                  return `
                    <tr>
                      <td><strong>${room?.numero}</strong></td>
                      <td>${cli?.nome}</td>
                      <td>${DB.formatDate(r.entrada)}</td>
                      <td>${DB.formatDate(r.saida)}</td>
                      <td>${DB.formatBRL(tot)} <small style="color:var(--cinza-texto);">(${cs.length} itens)</small></td>
                      <td><button class="btn btn-primary btn-sm" onclick="App.openConsumoFor('${r.id}')">+ Lançar</button></td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>` : '<div class="table-empty">Nenhum hóspede em estadia no momento.</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Histórico recente de consumo</h2></div>
        <div class="card-body tight">
          ${consumos.length ? `
            <table class="table">
              <thead><tr><th>Data</th><th>Reserva</th><th>Produto</th><th>Qtd</th><th>Total</th><th>Func.</th></tr></thead>
              <tbody>
                ${consumos.slice().sort((a,b) => b.dataHora.localeCompare(a.dataHora)).slice(0, 30).map(c => {
                  const r = DB.reservation(c.reservaId);
                  const room = r ? DB.room(r.quartoId) : null;
                  const fn = DB.profiles().find(u => u.id === c.funcionarioId);
                  return `
                    <tr>
                      <td>${DB.formatDateTime(c.dataHora)}</td>
                      <td>${r?.codigo} · Quarto ${room?.numero || '—'}</td>
                      <td>${c.produto}</td>
                      <td>${c.qtd}</td>
                      <td><strong>${DB.formatBRL(c.valorTotal)}</strong></td>
                      <td>${fn?.nome.split(' ')[0] || '—'}</td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>` : '<div class="table-empty">Nenhum consumo registrado ainda.</div>'}
        </div>
      </div>`;
    this.render(html, 'Lançamento de consumo');
  },

  openConsumoFor(reservaId) {
    const r = DB.reservation(reservaId);
    const cli = DB.client(r.clienteId);
    const room = DB.room(r.quartoId);
    const body = `
      <div style="margin-bottom: 18px; padding: 14px; background: var(--cinza-fundo);">
        <strong>Quarto ${room.numero}</strong> · ${cli.nome} · ${r.codigo}
      </div>
      <div class="form-grid">
        <div class="form-row full">
          <label class="field">Produto / serviço</label>
          <input type="text" id="csProduto" placeholder="Ex: Vinho tinto, Café da manhã extra...">
        </div>
        <div class="form-row">
          <label class="field">Quantidade</label>
          <input type="number" id="csQtd" min="1" value="1">
        </div>
        <div class="form-row">
          <label class="field">Valor unitário</label>
          <input type="number" id="csVu" min="0" step="0.01" value="0">
        </div>
      </div>`;
    const foot = `
      <button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="App.saveConsumo('${reservaId}')">Lançar consumo</button>`;
    this.openModal('Lançar consumo', body, foot);
  },

  async saveConsumo(reservaId) {
    const produto = document.getElementById('csProduto').value.trim();
    const qtd = parseInt(document.getElementById('csQtd').value) || 0;
    const vu = parseFloat(document.getElementById('csVu').value) || 0;
    if (!produto || qtd < 1 || vu <= 0) return this.toast('Preencha todos os campos.', 'error');
    await DB.addConsumption({
      reservaId, produto, qtd, valorUnit: vu, valorTotal: qtd * vu,
      funcionarioId: this.user.id,
    });
    this.toast('Consumo lançado!');
    this.closeModal();
    if (this.view === 'consumo') this.view_consumo();
  },

  /* ============================================================
     QUARTOS — CRUD
     ============================================================ */
  view_quartos() {
    const rooms = DB.rooms();
    const html = `
      <div class="card">
        <div class="card-head">
          <h2>Cadastro de quartos (${rooms.length})</h2>
          ${this.user.perfil === 'admin' ? '<button class="btn btn-primary" onclick="App.openRoomForm()">+ Novo quarto</button>' : ''}
        </div>
        <div class="card-body tight">
          <table class="table">
            <thead><tr><th>Número</th><th>Tipo</th><th>Capacidade</th><th>Diária</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${rooms.map(r => `
                <tr>
                  <td><strong>${r.numero}</strong></td>
                  <td>${r.tipo}</td>
                  <td>${r.capacidade}</td>
                  <td>${DB.formatBRL(r.preco)}</td>
                  <td><span class="pill pill-${r.status === 'disponivel' ? 'confirmada' : r.status === 'ocupado' ? 'cancelada' : r.status === 'reservado' ? 'parcial' : 'finalizada'}">${r.status}</span></td>
                  <td class="actions">
                    <button class="btn btn-outline btn-sm" onclick="App.openRoomDetail('${r.id}')">Detalhe</button>
                    ${this.user.perfil === 'admin' ? `<button class="btn btn-outline btn-sm" onclick="App.openRoomForm('${r.id}')">Editar</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    this.render(html, 'Quartos');
  },

  openRoomForm(id = null) {
    const room = id ? DB.room(id) : { numero: '', tipo: 'Standard', capacidade: 2, preco: 0, status: 'disponivel', descricao: '', amenities: [] };
    const body = `
      <div class="form-grid">
        <div class="form-row"><label class="field">Número</label><input type="text" id="qNumero" value="${room.numero}"></div>
        <div class="form-row"><label class="field">Tipo</label>
          <select id="qTipo">
            ${['Standard','Superior','Suíte Master','Suíte Família'].map(t => `<option ${t===room.tipo?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-row"><label class="field">Capacidade</label><input type="number" id="qCap" value="${room.capacidade}"></div>
        <div class="form-row"><label class="field">Diária (R$)</label><input type="number" id="qPreco" step="0.01" value="${room.preco}"></div>
        <div class="form-row full">
          <label class="field">Status</label>
          <select id="qStatus">
            ${['disponivel','reservado','ocupado','limpeza','manutencao'].map(s => `<option ${s===room.status?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-row full"><label class="field">Descrição</label><textarea id="qDesc">${room.descricao}</textarea></div>
        <div class="form-row full"><label class="field">Amenidades (separe por vírgula)</label><input type="text" id="qAmen" value="${room.amenities.join(', ')}"></div>
      </div>`;
    let foot = `<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>`;
    if (id) foot += `<button class="btn btn-danger" onclick="App.deleteRoom('${id}')">Excluir</button>`;
    foot += `<button class="btn btn-primary" onclick="App.saveRoom('${id || ''}')">Salvar</button>`;
    this.openModal(id ? `Editar quarto ${room.numero}` : 'Novo quarto', body, foot);
  },

  async saveRoom(id) {
    const data = {
      id: id || null,
      numero: document.getElementById('qNumero').value.trim(),
      tipo: document.getElementById('qTipo').value,
      capacidade: parseInt(document.getElementById('qCap').value),
      preco: parseFloat(document.getElementById('qPreco').value),
      status: document.getElementById('qStatus').value,
      descricao: document.getElementById('qDesc').value.trim(),
      amenities: document.getElementById('qAmen').value.split(',').map(s => s.trim()).filter(Boolean),
    };
    if (!data.numero) return this.toast('Número obrigatório.', 'error');
    await DB.saveRoom(data);
    this.closeModal();
    this.toast('Quarto salvo.');
    this.view_quartos();
  },

  async deleteRoom(id) {
    if (!confirm('Excluir este quarto?')) return;
    await DB.deleteRoom(id);
    this.closeModal();
    this.toast('Quarto excluído.');
    this.view_quartos();
  },

  /* ============================================================
     CLIENTES
     ============================================================ */
  view_clientes() {
    const clients = DB.clients();
    const html = `
      <div class="card">
        <div class="card-head">
          <h2>Clientes cadastrados (${clients.length})</h2>
          <button class="btn btn-primary" onclick="App.openClientForm()">+ Novo cliente</button>
        </div>
        <div class="card-body tight">
          <table class="table">
            <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th><th>Cadastro</th><th>Reservas</th><th></th></tr></thead>
            <tbody>
              ${clients.map(c => {
                const reservas = DB.reservations().filter(r => r.clienteId === c.id);
                return `
                  <tr>
                    <td><strong>${c.nome}</strong></td>
                    <td>${c.cpf}</td>
                    <td>${c.telefone}</td>
                    <td>${c.email}</td>
                    <td>${DB.formatDate(c.criadoEm)}</td>
                    <td>${reservas.length}</td>
                    <td><button class="btn btn-outline btn-sm" onclick="App.openClientForm('${c.id}')">Editar</button></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    this.render(html, 'Clientes');
  },

  openClientForm(id = null) {
    const c = id ? DB.client(id) : { nome:'', cpf:'', telefone:'', email:'' };
    const body = `
      <div class="form-grid">
        <div class="form-row full"><label class="field">Nome completo</label><input type="text" id="cNome" value="${c.nome}"></div>
        <div class="form-row"><label class="field">CPF</label><input type="text" id="cCpf" value="${c.cpf}"></div>
        <div class="form-row"><label class="field">Telefone</label><input type="text" id="cTel" value="${c.telefone}"></div>
        <div class="form-row full"><label class="field">E-mail</label><input type="email" id="cEmail" value="${c.email}"></div>
      </div>`;
    const foot = `
      <button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="App.saveClient('${id || ''}')">Salvar</button>`;
    this.openModal(id ? 'Editar cliente' : 'Novo cliente', body, foot);
  },

  async saveClient(id) {
    const data = {
      id: id || null,
      nome: document.getElementById('cNome').value.trim(),
      cpf: document.getElementById('cCpf').value.trim(),
      telefone: document.getElementById('cTel').value.trim(),
      email: document.getElementById('cEmail').value.trim(),
    };
    if (!data.nome || !data.cpf) return this.toast('Nome e CPF obrigatórios.', 'error');
    await DB.saveClient(data);
    this.closeModal();
    this.toast('Cliente salvo.');
    this.view_clientes();
  },

  /* ============================================================
     PAGAMENTOS
     ============================================================ */
  view_pagamentos() {
    const pgs = DB.payments().slice().sort((a,b) => b.data.localeCompare(a.data));
    const pendentes = DB.reservations().filter(r => r.valorRestante > 0 && r.statusReserva !== 'cancelada');
    const totalPendente = pendentes.reduce((s,r) => s + r.valorRestante, 0);

    const html = `
      <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="kpi"><div class="label">Total recebido</div><div class="value">${DB.formatBRL(pgs.reduce((s,p)=>s+p.valor,0))}</div></div>
        <div class="kpi" style="border-left-color: var(--vermelho);"><div class="label">A receber</div><div class="value">${DB.formatBRL(totalPendente)}</div><div class="delta down">${pendentes.length} reservas com saldo</div></div>
        <div class="kpi"><div class="label">Pagamentos</div><div class="value">${pgs.length}</div><div class="delta">Lançamentos</div></div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Pagamentos pendentes</h2></div>
        <div class="card-body tight">
          ${pendentes.length ? `
            <table class="table">
              <thead><tr><th>Reserva</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Restante</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${pendentes.map(r => {
                  const cli = DB.client(r.clienteId);
                  return `
                    <tr>
                      <td><strong>${r.codigo}</strong></td>
                      <td>${cli?.nome}</td>
                      <td>${DB.formatBRL(r.valorTotal)}</td>
                      <td>${DB.formatBRL(r.valorPago)}</td>
                      <td style="color:var(--vermelho); font-weight:600;">${DB.formatBRL(r.valorRestante)}</td>
                      <td><span class="pill pill-${r.statusReserva}">${App.statusLabel(r.statusReserva)}</span></td>
                      <td>
                        ${this.can('checkin') ? `<button class="btn btn-primary btn-sm" onclick="App.openPagamento('${r.id}')">+ Pagamento</button>` : ''}
                        <button class="btn btn-outline btn-sm" onclick="App.openReservaDetail('${r.id}')">Ver</button>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>` : '<div class="table-empty">Nenhum pagamento pendente. ✦</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Histórico de pagamentos</h2></div>
        <div class="card-body tight">
          <table class="table">
            <thead><tr><th>Data</th><th>Reserva</th><th>Cliente</th><th>Forma</th><th>Valor</th></tr></thead>
            <tbody>
              ${pgs.map(p => {
                const r = DB.reservation(p.reservaId);
                const cli = r ? DB.client(r.clienteId) : null;
                return `
                  <tr>
                    <td>${DB.formatDateTime(p.data)}</td>
                    <td>${r?.codigo || '—'}</td>
                    <td>${cli?.nome || '—'}</td>
                    <td><span class="pill pill-online">${p.forma}</span></td>
                    <td><strong>${DB.formatBRL(p.valor)}</strong></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    this.render(html, 'Pagamentos');
  },

  openPagamento(reservaId) {
    const r = DB.reservation(reservaId);
    const cli = DB.client(r.clienteId);
    const body = `
      <div style="margin-bottom: 18px; padding: 14px; background: var(--cinza-fundo);">
        <strong>${r.codigo}</strong> · ${cli.nome}<br>
        <small>Restante: <strong style="color:var(--vermelho);">${DB.formatBRL(r.valorRestante)}</strong></small>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label class="field">Valor</label>
          <input type="number" id="pgValor" step="0.01" min="0" value="${r.valorRestante}">
        </div>
        <div class="form-row">
          <label class="field">Forma</label>
          <select id="pgForma">
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>`;
    const foot = `
      <button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="App.savePagamento('${reservaId}')">Lançar pagamento</button>`;
    this.openModal('Novo pagamento', body, foot);
  },

  async savePagamento(reservaId) {
    const valor = parseFloat(document.getElementById('pgValor').value);
    const forma = document.getElementById('pgForma').value;
    if (!valor || valor <= 0) return this.toast('Valor inválido.', 'error');
    await DB.addPayment({ reservaId, valor, forma });
    this.toast('Pagamento lançado!');
    this.closeModal();
    if (this.view === 'pagamentos') this.view_pagamentos();
    else if (this.view === 'reservas') this.view_reservas();
  },

  /* ============================================================
     RELATÓRIOS
     ============================================================ */
  view_relatorios() {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);

    const pgs = DB.payments();
    const reservs = DB.reservations();
    const rooms = DB.rooms();
    const consumos = DB.consumptions();

    const fatHoje = pgs.filter(p => p.data.slice(0,10) === today).reduce((s,p)=>s+p.valor,0);
    const fatMes = pgs.filter(p => p.data.slice(0,7) === month).reduce((s,p)=>s+p.valor,0);
    const fatAno = pgs.filter(p => p.data.slice(0,4) === year).reduce((s,p)=>s+p.valor,0);

    const confirmadas = reservs.filter(r => ['confirmada','em_hospedagem','finalizada'].includes(r.statusReserva)).length;
    const canceladas = reservs.filter(r => r.statusReserva === 'cancelada').length;
    const ocupados = rooms.filter(r => r.status === 'ocupado').length;
    const disponiveis = rooms.filter(r => r.status === 'disponivel').length;
    const taxaOcup = rooms.length ? Math.round((ocupados / rooms.length) * 100) : 0;

    const totalConsumo = consumos.reduce((s,c) => s + c.valorTotal, 0);

    /* faturamento últimos 7 dias */
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      last7.push({ data: ds, valor: pgs.filter(p => p.data.slice(0,10) === ds).reduce((s,p)=>s+p.valor,0) });
    }
    const max7 = Math.max(...last7.map(d => d.valor), 1);

    const html = `
      <div class="kpi-grid">
        <div class="kpi"><div class="label">Faturamento hoje</div><div class="value">${DB.formatBRL(fatHoje)}</div></div>
        <div class="kpi"><div class="label">Faturamento mês</div><div class="value">${DB.formatBRL(fatMes)}</div></div>
        <div class="kpi"><div class="label">Faturamento ano</div><div class="value">${DB.formatBRL(fatAno)}</div></div>
        <div class="kpi"><div class="label">Taxa de ocupação</div><div class="value">${taxaOcup}%</div><div class="delta">${ocupados}/${rooms.length} quartos</div></div>
      </div>

      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px;">
        <div class="card">
          <div class="card-head"><h2>Faturamento — últimos 7 dias</h2></div>
          <div class="card-body">
            <div style="display: flex; align-items: end; gap: 14px; height: 220px; padding: 0 10px;">
              ${last7.map(d => `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <div style="font-size: 0.72rem; font-weight:600; color: var(--escuro);">${d.valor > 0 ? DB.formatBRL(d.valor).replace('R$ ','') : ''}</div>
                  <div style="width: 100%; background: linear-gradient(to top, var(--dourado-escuro), var(--dourado)); height: ${(d.valor / max7) * 170}px; min-height:2px;"></div>
                  <div style="font-size: 0.72rem; color: var(--cinza-texto);">${new Date(d.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2>Resumo operacional</h2></div>
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--cinza-borda);"><span>Reservas confirmadas</span><strong>${confirmadas}</strong></div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--cinza-borda);"><span>Reservas canceladas</span><strong style="color:var(--vermelho);">${canceladas}</strong></div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--cinza-borda);"><span>Quartos ocupados</span><strong>${ocupados}</strong></div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--cinza-borda);"><span>Quartos disponíveis</span><strong style="color:var(--verde);">${disponiveis}</strong></div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--cinza-borda);"><span>Itens de consumo vendidos</span><strong>${consumos.length}</strong></div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;"><span>Receita de consumo</span><strong style="color:var(--dourado-escuro);">${DB.formatBRL(totalConsumo)}</strong></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 24px;">
        <div class="card-head"><h2>Receita por quarto (este mês)</h2></div>
        <div class="card-body tight">
          <table class="table">
            <thead><tr><th>Quarto</th><th>Tipo</th><th>Reservas</th><th>Faturado</th></tr></thead>
            <tbody>
              ${rooms.map(rm => {
                const rsvDoMes = reservs.filter(r => r.quartoId === rm.id && (r.criadaEm||'').slice(0,7) === month);
                const fat = pgs.filter(p => rsvDoMes.find(r => r.id === p.reservaId) && p.data.slice(0,7) === month).reduce((s,p)=>s+p.valor,0);
                return `<tr>
                  <td><strong>${rm.numero}</strong></td>
                  <td>${rm.tipo}</td>
                  <td>${rsvDoMes.length}</td>
                  <td>${DB.formatBRL(fat)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    this.render(html, 'Relatórios financeiros');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
