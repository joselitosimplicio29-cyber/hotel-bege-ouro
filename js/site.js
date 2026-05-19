/* ============================================================
   HOTEL BEGE OURO — SITE PÚBLICO (UI comum + dados de imagens)
   ============================================================ */

/* === Banco central de imagens === */
const IMG = {
  hero:        'img/lobby-real.jpg?v=15',
  fachada:     'img/lobby-real.jpg?v=15',
  lobby:       'img/foto-capa.jpg?v=15',
  recepcao:    'img/foto-capa.jpg?v=15',
  cafe:        'img/galeria_frutas.png?v=15',
  restaurante: 'img/galeria_doces.png?v=15',
  areaEstar:   'img/galeria_poltronas.png?v=15',
  decoracao:   'img/galeria_iluminacao.png?v=15',
  banheiro:    'img/ESPELHO.png?v=11',                   /* FOTO REAL — pia + espelho redondo */
  banheiroPia: 'img/ESPELHO.png?v=11',                   /* FOTO REAL — pia + espelho redondo */
  banheiroBox: 'img/banheiro_2.png?v=11',                /* FOTO REAL — box do chuveiro (ainda não salva) */
  equipe:      'img/galeria_poltronas.png?v=15',

  /* Quartos por tipo — FOTOS REAIS DO HOTEL */
  // Solteiro
  quartoSolteiro:       'img/quarto-solteiro.jpg?v=13',
  quartoSolteiroBanho:  'img/banheiro-solteiro.jpg?v=13',
  quartoSolteiroPia:    'img/pia-solteiro.jpg?v=13',

  // Casal
  quartoCasal:          'img/quarto-casal.jpg?v=13',
  quartoCasal2:         'img/quarto-casal-2.jpg?v=13',
  quartoCasal3:         'img/quarto-casal-3.jpg?v=13',
  quartoCasalBanho:     'img/banheiro-casal.jpg?v=13',
  quartoCasalFrigobar:  'img/frigobar-tv-casal.jpg?v=13',

  // Duplo Solteiro (2 camas solteiro)
  quartoDuplo:          'img/quarto_solteiro.png?v=13',
  quartoDuploBanho:     'img/banheiro-geral.jpg?v=13',

  // Triplo
  quartoTriploReal:     'img/quarto-triplo.jpg?v=13',
  quartoTriploBanho:    'img/banheiro-triplo.jpg?v=13',

  // Genéricos (usados em galerias quando faltar foto específica)
  frigobarGenerico:     'img/frigobar.jpg?v=13',
  piaVaso:              'img/pia-vaso.jpg?v=13',
  banheiroGeral:        'img/banheiro-geral.jpg?v=13',
  tvArCondicionado:     'img/tv-ar-condicionado.jpg?v=13',

  // Aliases (compatibilidade com código existente)
  quartoIndividual:        'img/quarto-solteiro.jpg?v=13',
  quartoIndividual2:       'img/quarto-solteiro.jpg?v=13',
  quartoIndividualTV:      'img/frigobar.jpg?v=13',
  quartoIndividualBanheiro:'img/banheiro-solteiro.jpg?v=13',
  quartoCasalDuplo:        'img/quarto-casal.jpg?v=13',
  quartoTriplo:            'img/quarto-triplo.jpg?v=13',
  quartoTriplo2:           'img/quarto-triplo.jpg?v=13',
  quartoTriploTV:          'img/frigobar.jpg?v=13',
  quartoTriploBanheiro:    'img/banheiro-triplo.jpg?v=13',
  quartoTriploChuveiro:    'img/banheiro-triplo.jpg?v=13',
  quartoSolteiroDuplo:     'img/quarto_solteiro.png?v=13',
  quartoStandard:          'img/quarto-casal.jpg?v=13',
  quartoStandard2:         'img/quarto-casal.jpg?v=13',
  quartoSuperior:    'img/quarto-casal.jpg?v=13',
  quartoSuiteMaster: 'img/quarto-triplo.jpg?v=13',
  quartoSuiteFamilia:'img/quarto-triplo.jpg?v=13',

  /* Avatares */
  avatar1: 'img/icone.png?v=15',
  avatar2: 'img/icone.png?v=15',
  avatar3: 'img/icone.png?v=15',
  
  /* Novas fotos da Galeria */
  galeriaFrutas: 'img/galeria_frutas.png?v=1',
  galeriaDoces: 'img/galeria_doces.png?v=1',
  galeriaPoltronas: 'img/galeria_poltronas.png?v=1',
  galeriaIluminacao: 'img/galeria_iluminacao.png?v=1',
};

const ROOM_MAIN_IMAGE_BY_ID = {
  q01: IMG.quartoCasal,
  q02: IMG.quartoDuplo,
  q03: IMG.quartoTriploReal,
  q04: IMG.quartoDuplo,
  q05: IMG.quartoCasal2,
  q07: IMG.quartoSolteiro,
  q08: IMG.quartoCasal3,
  q101: IMG.quartoTriploReal,
  q102: IMG.quartoCasal,
  q103: IMG.quartoCasal2,
  q104: IMG.quartoCasal3,
  q106: IMG.quartoCasal,
  q107: IMG.quartoCasal2,
  q108: IMG.quartoCasal3,
};

function normalizeRoomType(tipo = '') {
  return String(tipo)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

/* Mapeia o tipo do quarto à imagem */
function imgForRoom(room) {
  if (!room) return IMG.quartoCasal;
  if (ROOM_MAIN_IMAGE_BY_ID[room.id]) return ROOM_MAIN_IMAGE_BY_ID[room.id];

  const tipo = normalizeRoomType(room.tipo);
  if (tipo === 'solteiro' || tipo === 'individual') return IMG.quartoSolteiro;
  if (tipo === 'casal') return IMG.quartoCasal;
  if (tipo === 'casal_duplo' || tipo === 'duplo_solteiro') return IMG.quartoDuplo;
  if (tipo === 'triplo' || tipo === 'triplo_/_familia' || tipo === 'familia') return IMG.quartoTriploReal;
  return IMG.quartoCasal;
}

const HOTEL_INFO = {
  whatsapp: '5574981399221',
  whatsappLabel: '(74) 98139-9221',
  instagram: 'https://instagram.com/hotelbegeouro',
  email: 'begeourohotel@hotmail.com',
  telefone: '(74) 98139-9221',
  endereco: 'Praça Eurides Salgado dos Santos, s/n — Centro, Ourolândia, Bahia, CEP 44.718-000',
};

const SITE = {
  injectNavbar(active = '') {
    const isAdmin = location.pathname.includes('/admin/');
    const prefix = isAdmin ? '../' : './';
    const nav = `
      <nav class="navbar" id="navbar">
        <div class="container nav-inner">
          <a href="${prefix}index.html" class="logo">
            <span class="logo-mark">B</span>Bege<span> Ouro</span>
          </a>
          <button class="nav-toggle" id="navToggle" aria-label="Menu">☰</button>
          <ul class="nav-links" id="navLinks">
            <li><a href="${prefix}index.html"   class="${active==='home'?'active':''}">Início</a></li>
            <li><a href="${prefix}sobre.html"   class="${active==='sobre'?'active':''}">Sobre</a></li>
            <li><a href="${prefix}quartos.html" class="${active==='quartos'?'active':''}">Quartos</a></li>
            <li><a href="${prefix}galeria.html" class="${active==='galeria'?'active':''}">Galeria</a></li>
            <li><a href="${prefix}contato.html" class="${active==='contato'?'active':''}">Contato</a></li>
            <li><a href="${prefix}reservar.html" class="nav-cta">Reservar agora</a></li>
          </ul>
        </div>
      </nav>`;
    document.body.insertAdjacentHTML('afterbegin', nav);

    const navbar = document.getElementById('navbar');
    const onScroll = () => {
      if (window.scrollY > 60) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    const isHero = document.querySelector('.hero');
    if (!isHero) navbar.classList.add('solid');

    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    toggle?.addEventListener('click', () => links.classList.toggle('open'));
  },

  injectFooter() {
    const isAdmin = location.pathname.includes('/admin/');
    const prefix = isAdmin ? '../' : './';
    const html = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a href="${prefix}index.html" class="logo">
                <span class="logo-mark">B</span>Bege<span> Ouro</span>
              </a>
              <p style="margin-top:14px;">Hospedagem sofisticada com a hospitalidade e o conforto que você merece. Uma experiência única em cada estadia.</p>
              <div class="footer-social">
                <a href="${HOTEL_INFO.instagram}" target="_blank" aria-label="Instagram" title="Instagram">📷</a>
                <a href="https://wa.me/${HOTEL_INFO.whatsapp}" target="_blank" aria-label="WhatsApp" title="WhatsApp">💬</a>
                <a href="https://facebook.com/hotelbegeouro" target="_blank" aria-label="Facebook" title="Facebook">f</a>
                <a href="mailto:${HOTEL_INFO.email}" aria-label="E-mail" title="E-mail">✉</a>
              </div>
            </div>
            <div>
              <h4>Navegação</h4>
              <ul>
                <li><a href="${prefix}index.html">Início</a></li>
                <li><a href="${prefix}sobre.html">Sobre o hotel</a></li>
                <li><a href="${prefix}quartos.html">Quartos</a></li>
                <li><a href="${prefix}galeria.html">Galeria</a></li>
                <li><a href="${prefix}contato.html">Contato</a></li>
                <li><a href="${prefix}reservar.html">Reservar online</a></li>
              </ul>
            </div>
            <div>
              <h4>Contato</h4>
              <ul>
                <li><a href="https://hotelbegeouro.com.br" target="_blank">hotelbegeouro.com.br</a></li>
                <li><a href="mailto:${HOTEL_INFO.email}">${HOTEL_INFO.email}</a></li>
                <li><a href="tel:+${HOTEL_INFO.whatsapp}">${HOTEL_INFO.telefone}</a></li>
                <li>Recepção 24 horas</li>
              </ul>
              <a href="https://wa.me/${HOTEL_INFO.whatsapp}" target="_blank" class="footer-wa-btn">💬 WhatsApp</a>
            </div>
            <div>
              <h4>Endereço</h4>
              <ul>
                <li>${HOTEL_INFO.endereco}</li>
              </ul>
              <div style="margin-top: 14px; aspect-ratio: 16/9; overflow: hidden; border-radius: 6px;">
                <iframe
                  src="https://maps.google.com/maps?q=Pra%C3%A7a+Eurides+Salgado+dos+Santos,+Ourol%C3%A2ndia,+Bahia,+Brasil&output=embed&z=16"
                  loading="lazy"
                  style="width:100%; height:100%; border:0;"
                  allowfullscreen
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Mapa Hotel Bege Ouro"></iframe>
              </div>
              <a href="${prefix}admin/login.html" style="display:inline-block; margin-top:14px; color:var(--dourado-claro); font-size:0.82rem;">Acesso à Dashboard →</a>
            </div>
          </div>
          <div class="footer-bottom">
            © ${new Date().getFullYear()} Hotel Bege Ouro · Todos os direitos reservados ·
            <a href="#">Política de Privacidade</a>
          </div>
        </div>
      </footer>
      <a href="https://wa.me/${HOTEL_INFO.whatsapp}?text=Olá,%20gostaria%20de%20fazer%20uma%20reserva" 
         target="_blank" 
         class="float-wa" 
         aria-label="Fale conosco pelo WhatsApp">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.412 2.503 1.112 3.485l-1.122 3.284 3.393-1.077c.947.533 2.035.838 3.185.838l.001.001c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.769-5.766zm3.301 8.302c-.151.433-.778.785-1.085.83-.284.041-.643.069-1.037-.058-.232-.074-.539-.193-.918-.355-1.611-.69-2.652-2.322-2.732-2.428-.08-.106-.651-.866-.651-1.653 0-.786.411-1.172.557-1.323.147-.151.32-.189.426-.189.106 0 .212.001.303.006.096.005.226-.036.353.271.132.32.451 1.098.492 1.181.041.083.068.181.013.29-.054.109-.081.181-.163.271-.081.091-.171.203-.243.271-.083.08-.17.167-.073.334.097.166.432.713.927 1.154.638.568 1.175.744 1.341.829.167.085.266.072.365-.041.099-.113.426-.496.539-.665.113-.169.227-.141.381-.085.154.056 1.001.472 1.171.557.171.085.284.127.325.197.041.07.041.407-.11.84z"/>
          <path d="M12.094 2c-5.468 0-9.911 4.442-9.917 9.911-.002 1.748.457 3.455 1.329 4.966L2 22l5.244-1.376c1.464.798 3.111 1.218 4.843 1.219h.005c5.469 0 9.911-4.44 9.917-9.91.002-2.651-1.029-5.143-2.903-7.017C17.234 3.041 14.743 2.001 12.094 2zm0 18.232h-.004c-1.539 0-3.049-.414-4.366-1.198l-.313-.186-3.248.852.866-3.165-.205-.326c-.859-1.368-1.312-2.955-1.31-4.588.006-4.908 4.002-8.901 8.916-8.901 2.378.001 4.614.928 6.294 2.61 1.68 1.681 2.604 3.918 2.603 6.297-.006 4.908-4.004 8.901-8.913 8.901z"/>
        </svg>
        <span class="wa-tooltip">Fale conosco</span>
      </a>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  init(active = '') {
    this.injectNavbar(active);
    this.injectFooter();
    this.setupReveal();
    this.setupParallax();
    this.setupScrollProgress();
    this.setupGalleryModal();
  },

  setupScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      bar.style.width = scrolled + "%";
    });
  },

  setupGalleryModal() {

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <button class="modal-prev seta-galeria seta-esquerda" aria-label="Foto anterior">&#8249;</button>
      <button class="modal-next seta-galeria seta-direita" aria-label="Próxima foto">&#8250;</button>
      <div class="modal-caption" id="modalCaption" style="display:none;"></div>
      <div class="modal-counter contador-fotos" id="modalCounter">1 / 1</div>
      <div class="modal-content">
        <button class="modal-close botao-fechar">&times;</button>
        <img src="" alt="Imagem da galeria">
      </div>`;
    document.body.appendChild(modal);

    const close = modal.querySelector('.modal-close');
    const prev = modal.querySelector('.modal-prev');
    const next = modal.querySelector('.modal-next');
    const img = modal.querySelector('img');
    const counter = modal.querySelector('.modal-counter');
    const caption = modal.querySelector('.modal-caption');

    let photos = [];
    let captions = [];
    let idx = 0;

    async function filterValidImages(urls, caps) {
      const validPhotos = [];
      const validCaps = [];
      const promises = urls.map((url, i) => {
        return new Promise((resolve) => {
          const checkImg = new Image();
          checkImg.onload = () => resolve({ url, cap: caps[i] });
          checkImg.onerror = () => resolve(null);
          checkImg.src = url;
        });
      });
      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res) {
          validPhotos.push(res.url);
          validCaps.push(res.cap);
        }
      });
      return { validPhotos, validCaps };
    }

    const showAt = (i) => {
      if (!photos.length) return;
      idx = ((i % photos.length) + photos.length) % photos.length;
      img.style.display = '';
      img.src = photos[idx];
      counter.textContent = `${idx + 1} / ${photos.length}`;
      const multi = photos.length > 1;
      prev.style.display = multi ? '' : 'none';
      next.style.display = multi ? '' : 'none';
      counter.style.display = multi ? '' : 'none';
      if (captions[idx]) {
        caption.textContent = captions[idx];
        caption.style.display = '';
      } else {
        caption.style.display = 'none';
      }
    };

    document.addEventListener('click', async (e) => {
      /* Clique em um quarto (room-photo, room-row-photo, pick-photo) → carrossel completo do quarto */
      const roomEl = e.target.closest('[data-room-id]');
      if (roomEl && window.DB) {
        const room = DB.room(roomEl.dataset.roomId);
        if (room) {
          const rawPhotos = window.roomGallery(room.id);
          const rawCaps = [
            `Quarto ${room.numero} · ${room.tipo}`,
            `Banheiro · pia em mármore`
          ];
          
          const { validPhotos, validCaps } = await filterValidImages(rawPhotos, rawCaps);
          if (validPhotos.length === 0) return;
          
          photos = validPhotos;
          captions = validCaps;
          showAt(0);
          modal.classList.add('open');
          document.body.style.overflow = 'hidden';
          return;
        }
      }
      /* Clique em galeria comum, intro-photo ou room-photo sem ID → foto única */
      const item = e.target.closest('.gallery-item, .room-photo, .room-row-photo, .pick-photo, .intro-photo');
      if (item && !roomEl) {
        const bg = window.getComputedStyle(item).backgroundImage;
        if (bg && bg !== 'none') {
          const url = bg.slice(5, -2).replace(/"/g, "");
          const { validPhotos, validCaps } = await filterValidImages([url], [item.querySelector('.label')?.textContent || '']);
          if (validPhotos.length === 0) return;
          
          photos = validPhotos;
          captions = validCaps;
          showAt(0);
          modal.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      }
    });

    close.onclick = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };
    prev.onclick = (e) => { e.stopPropagation(); showAt(idx - 1); };
    next.onclick = (e) => { e.stopPropagation(); showAt(idx + 1); };
    modal.onclick = (e) => { if (e.target === modal) close.onclick(); };

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') close.onclick();
      if (e.key === 'ArrowLeft') showAt(idx - 1);
      if (e.key === 'ArrowRight') showAt(idx + 1);
    });
  },

  setupReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.15 });

    // Aplicar a classe reveal em seções e cards
    const targets = document.querySelectorAll('.section-head, .dif-card, .room-card, .test-card, .intro-photo, .intro-text, .gallery-item');
    targets.forEach(t => {
      t.classList.add('reveal');
      observer.observe(t);
    });
  },

  setupParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;
      heroBg.style.transform = `scale(1.05) translateY(${scroll * 0.3}px)`;
    });
  },
};

/* Retorna o array completo de fotos de um quarto (foto principal + banheiro + pia/frigobar/AC) */
function roomGallery(roomId) {
  const room = (window.DB && DB.room) ? DB.room(roomId) : null;
  const tipo = normalizeRoomType(room ? room.tipo : '');

  // Solteiro (1 cama solteiro)
  if (tipo === 'solteiro' || tipo === 'individual') {
    return [
      IMG.quartoSolteiro,
      IMG.quartoSolteiroBanho,
      IMG.quartoSolteiroPia,
      IMG.frigobarGenerico,
    ];
  }
  // Casal (1 cama de casal)
  if (tipo === 'casal') {
    return [
      imgForRoom(room),
      IMG.quartoCasal2,
      IMG.quartoCasal3,
      IMG.quartoCasalBanho,
      IMG.quartoCasalFrigobar,
    ];
  }
  // Casal Duplo (2 pessoas, configuração flexível)
  if (tipo === 'casal_duplo' || tipo === 'duplo_solteiro') {
    return [
      IMG.quartoDuplo,
      IMG.quartoDuploBanho,
      IMG.piaVaso,
      IMG.frigobarGenerico,
    ];
  }
  // Triplo (casal + solteiro)
  if (tipo === 'triplo' || tipo === 'triplo_/_familia' || tipo === 'familia') {
    return [
      IMG.quartoTriploReal,
      IMG.quartoTriploBanho,
      IMG.piaVaso,
      IMG.frigobarGenerico,
    ];
  }
  // Fallback
  const primary = room ? imgForRoom(room) : IMG.quartoCasal;
  return [primary, IMG.banheiroGeral, IMG.frigobarGenerico];
}

/* Retorna a galeria de uma CATEGORIA (usado nas páginas index/quartos) */
function categoryGallery(tipo) {
  const normalized = normalizeRoomType(tipo);
  return roomGallery.length ? (function(){
    if (normalized === 'solteiro' || normalized === 'individual') return [IMG.quartoSolteiro, IMG.quartoSolteiroBanho, IMG.quartoSolteiroPia, IMG.frigobarGenerico];
    if (normalized === 'casal') return [IMG.quartoCasal, IMG.quartoCasal2, IMG.quartoCasal3, IMG.quartoCasalBanho, IMG.quartoCasalFrigobar];
    if (normalized === 'casal_duplo' || normalized === 'duplo_solteiro') return [IMG.quartoDuplo, IMG.quartoDuploBanho, IMG.piaVaso, IMG.frigobarGenerico];
    if (normalized === 'triplo' || normalized === 'triplo_/_familia' || normalized === 'familia') return [IMG.quartoTriploReal, IMG.quartoTriploBanho, IMG.piaVaso, IMG.frigobarGenerico];
    return [IMG.quartoCasal];
  })() : [];
}
window.categoryGallery = categoryGallery;

window.renderInlineCarousel = function(room, tagClass) {
  const photos = window.roomGallery(room.id);
  // Basic structure if no photos
  if (!photos || photos.length === 0) {
    return `<div class="room-photo" data-room-id="${room.id}" role="img" aria-label="Foto do quarto ${room.tipo}">
              <span class="${tagClass}">${room.tipo}</span>
            </div>`;
  }
  // Single photo fallback
  if (photos.length === 1) {
    return `<div class="room-photo" data-room-id="${room.id}" style="background-image: url('${photos[0]}'); cursor: zoom-in;" role="img" aria-label="Foto do quarto ${room.tipo}">
              <span class="${tagClass}">${room.tipo}</span>
            </div>`;
  }
  // Inline carousel
  const slides = photos.map((url, i) => `<div class="inline-slide" style="background-image: url('${url}'); ${i === 0 ? '' : 'display:none;'}"></div>`).join('');
  return `
    <div class="room-photo inline-carousel" data-room-id="${room.id}" data-idx="0" data-total="${photos.length}" style="cursor: zoom-in;" role="img" aria-label="Foto do quarto ${room.tipo}">
      <div class="inline-track">${slides}</div>
      <button class="inline-prev" onclick="window.moveInlineCarousel(event, -1, this)" aria-label="Foto anterior">&#8249;</button>
      <button class="inline-next" onclick="window.moveInlineCarousel(event, 1, this)" aria-label="Próxima foto">&#8250;</button>
      <span class="${tagClass}">${room.tipo}</span>
    </div>
  `;
};

window.moveInlineCarousel = function(event, dir, btn) {
  event.stopPropagation(); // Previne abrir o modal fullscreen
  const container = btn.closest('.inline-carousel');
  const slides = container.querySelectorAll('.inline-slide');
  let idx = parseInt(container.getAttribute('data-idx'));
  const total = parseInt(container.getAttribute('data-total'));
  
  slides[idx].style.display = 'none';
  idx = ((idx + dir) % total + total) % total;
  slides[idx].style.display = '';
  
  container.setAttribute('data-idx', idx);
};

window.SITE = SITE;
window.IMG = IMG;
window.imgForRoom = imgForRoom;
window.roomGallery = roomGallery;
window.normalizeRoomType = normalizeRoomType;
window.HOTEL_INFO = HOTEL_INFO;
