/* ============================================================
   HOTEL BEGE OURO — GERAÇÃO DE COMPROVANTE PDF
   Usa jsPDF (carregado via CDN no HTML).
   ============================================================ */

const PDF = {
  /**
   * Gera comprovante de check-out (ou hospedagem) em PDF.
   * Inclui: cabeçalho, dados do hóspede, hospedagem, consumo, pagamentos, total.
   */
  comprovante(reservaId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const r = DB.reservation(reservaId);
    if (!r) return;
    const cli = DB.client(r.clienteId);
    const room = DB.room(r.quartoId);
    const consumos = DB.consumptions(reservaId);
    const pagamentos = DB.payments(reservaId);

    const totalConsumo = consumos.reduce((s, c) => s + c.valorTotal, 0);
    const totalGeral = r.valorTotal + totalConsumo;
    const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0);
    const restante = Math.max(0, totalGeral - totalPago);

    const PAGE_W = doc.internal.pageSize.getWidth();
    let y = 0;

    /* Cabeçalho dourado */
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, PAGE_W, 90, 'F');
    doc.setFillColor(201, 169, 97);
    doc.rect(0, 90, PAGE_W, 4, 'F');

    doc.setTextColor(201, 169, 97);
    doc.setFont('times', 'italic');
    doc.setFontSize(22);
    doc.text('Hotel Bege Ouro', 40, 50);

    doc.setTextColor(245, 239, 230);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('begeouro.com  ·  contato@begeouro.com  ·  (75) 99999-0000', 40, 70);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(201, 169, 97);
    doc.text('COMPROVANTE DE HOSPEDAGEM', PAGE_W - 40, 50, { align: 'right' });
    doc.setTextColor(245, 239, 230);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código: ${r.codigo}`, PAGE_W - 40, 68, { align: 'right' });

    y = 130;

    /* Bloco hóspede */
    const sectionTitle = (title) => {
      doc.setTextColor(184, 146, 61);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(title.toUpperCase(), 40, y);
      doc.setDrawColor(229, 223, 211);
      doc.setLineWidth(0.5);
      doc.line(40, y + 4, PAGE_W - 40, y + 4);
      y += 18;
    };

    const row = (label, value) => {
      doc.setTextColor(107, 100, 92);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(label.toUpperCase(), 40, y);
      doc.setTextColor(26, 26, 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(String(value || '—'), 200, y);
      y += 16;
    };

    sectionTitle('Hóspede');
    row('Nome', cli?.nome);
    row('CPF', cli?.cpf);
    row('Telefone', cli?.telefone);
    row('E-mail', cli?.email);
    y += 6;

    sectionTitle('Hospedagem');
    row('Quarto', `${room?.numero} — ${room?.tipo}`);
    row('Entrada', DB.formatDate(r.entrada));
    row('Saída', DB.formatDate(r.saida));
    row('Diárias', `${r.diarias}  ×  ${DB.formatBRL(r.valorDiaria)}`);
    row('Hóspedes', r.hospedes);
    if (r.observacoes) row('Observações', r.observacoes);
    y += 6;

    /* Consumo */
    if (consumos.length) {
      sectionTitle('Consumo');
      doc.setFillColor(245, 239, 230);
      doc.rect(40, y - 8, PAGE_W - 80, 18, 'F');
      doc.setTextColor(107, 100, 92);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('PRODUTO / SERVIÇO', 48, y + 4);
      doc.text('QTD', 320, y + 4);
      doc.text('UNIT.', 380, y + 4);
      doc.text('TOTAL', PAGE_W - 48, y + 4, { align: 'right' });
      y += 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 26);
      consumos.forEach(c => {
        doc.text(c.produto, 48, y);
        doc.text(String(c.qtd), 320, y);
        doc.text(DB.formatBRL(c.valorUnit), 380, y);
        doc.text(DB.formatBRL(c.valorTotal), PAGE_W - 48, y, { align: 'right' });
        y += 14;
      });
      doc.setDrawColor(229, 223, 211);
      doc.line(40, y, PAGE_W - 40, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Subtotal consumo', PAGE_W - 200, y);
      doc.text(DB.formatBRL(totalConsumo), PAGE_W - 48, y, { align: 'right' });
      y += 18;
    }

    /* Pagamentos */
    if (pagamentos.length) {
      sectionTitle('Pagamentos efetuados');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(26, 26, 26);
      pagamentos.forEach(p => {
        doc.text(`${DB.formatDateTime(p.data)} · ${p.forma.toUpperCase()}`, 48, y);
        doc.text(DB.formatBRL(p.valor), PAGE_W - 48, y, { align: 'right' });
        y += 14;
      });
      doc.setDrawColor(229, 223, 211);
      doc.line(40, y, PAGE_W - 40, y);
      y += 8;
    }

    /* Resumo final */
    y += 10;
    doc.setFillColor(245, 239, 230);
    doc.rect(40, y, PAGE_W - 80, 110, 'F');
    y += 24;

    const resumeRow = (label, value, bold = false, gold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(bold ? 11 : 10);
      doc.setTextColor(gold ? 184 : 26, gold ? 146 : 26, gold ? 61 : 26);
      doc.text(label, 60, y);
      doc.text(value, PAGE_W - 60, y, { align: 'right' });
      y += 18;
    };
    resumeRow('Hospedagem', DB.formatBRL(r.valorTotal));
    if (totalConsumo > 0) resumeRow('Consumo', DB.formatBRL(totalConsumo));
    resumeRow('Total geral', DB.formatBRL(totalGeral), true);
    resumeRow('Pago', '− ' + DB.formatBRL(totalPago));
    if (restante > 0) {
      resumeRow('A pagar', DB.formatBRL(restante), true, true);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(45, 122, 79);
      doc.text('✓ TOTALMENTE QUITADO', 60, y);
      y += 18;
    }

    /* Rodapé */
    y = doc.internal.pageSize.getHeight() - 40;
    doc.setDrawColor(201, 169, 97);
    doc.line(40, y, PAGE_W - 40, y);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(107, 100, 92);
    doc.text('Obrigado pela preferência. Foi um prazer recebê-lo no Hotel Bege Ouro.', PAGE_W / 2, y + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Documento gerado em ${DB.formatDateTime(new Date())}  ·  begeouro.com`, PAGE_W / 2, y + 28, { align: 'center' });

    doc.save(`Comprovante_${r.codigo}.pdf`);
  },
};

window.PDF = PDF;
