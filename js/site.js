/* ============================================================
   HOTEL BEGE OURO — SITE PÚBLICO (UI comum + dados de imagens)
   ============================================================ */

/* === Banco central de imagens === */
const IMG = {
  hero:        'img/fachada.png',
  fachada:     'img/fachada.png',
  lobby:       'img/lobby.png',
  recepcao:    'img/recepcao.png',
  cafe:        'img/cafe.png',
  restaurante: 'img/restaurante.png',
  piscina:     'img/piscina.png',
  spa:         'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  jardim:      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  bar:         'https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  banheiro:    'img/ESPELHO.png',                   /* FOTO REAL — pia + espelho redondo */
  banheiroPia: 'img/ESPELHO.png',                   /* FOTO REAL — pia + espelho redondo */
  banheiroBox: 'img/banheiro_2.png',                /* FOTO REAL — box do chuveiro (ainda não salva) */
  equipe:      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',

  /* Quartos por tipo */
  quartoIndividual:    'img/quarto_individual_1.png',
  quartoIndividual2:   'img/quarto_individual_2.png',
  quartoSolteiroDuplo: 'img/quarto_solteiro.png',   /* FOTO REAL — 2 camas de solteiro */
  quartoStandard:      'img/quarto_solteiro.png',   /* FOTO REAL */
  quartoStandard2:     'img/quarto_solteiro.png',   /* FOTO REAL */
  quartoSuperior:    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  quartoSuiteMaster: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
  quartoSuiteFamilia:'https://images.unsplash.com/photo-1591088398332-8a7791972843?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',

  /* Avatares */
  avatar1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  avatar2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  avatar3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
};

/* Mapeia o tipo do quarto à imagem */
function imgForRoom(room) {
  const map = {
    'q101': IMG.quartoIndividual,
    'q102': IMG.quartoIndividual2,
    'q103': IMG.quartoSolteiroDuplo,   /* Standard com 2 camas de solteiro — FOTO REAL */
    'q201': IMG.quartoSuperior,
    'q301': IMG.quartoSuiteMaster,
    'q302': IMG.quartoSuiteFamilia,
  };
  if (map[room.id]) return map[room.id];
  if (room.tipo === 'Individual') return IMG.quartoIndividual;
  if (room.tipo?.includes('Família')) return IMG.quartoSuiteFamilia;
  if (room.tipo?.includes('Master'))  return IMG.quartoSuiteMaster;
  if (room.tipo === 'Superior')       return IMG.quartoSuperior;
  return IMG.quartoSolteiroDuplo;   /* Standard padrão usa a foto real */
}

const HOTEL_INFO = {
  whatsapp: '5581999999999',
  whatsappLabel: '(81) 99999-9999',
  instagram: 'https://instagram.com/hotelbegeouro',
  email: 'contato@begeouro.com',
  telefone: '(75) 99999-0000',
  endereco: 'Rua das Acácias, 1000 — Centro · Bahia',
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
                <li>begeouro.com</li>
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
                <li>CEP 00000-000</li>
              </ul>
              <div style="margin-top: 14px; aspect-ratio: 16/9; background: rgba(255,255,255,0.05); overflow: hidden;">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-41.4%2C-12.7%2C-41.2%2C-12.5&layer=mapnik"
                  loading="lazy"
                  style="width:100%; height:100%; border:0; filter: invert(0.85) hue-rotate(180deg);"
                  title="Mapa"></iframe>
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
    /* Injeta CSS dos controles do carrossel uma única vez */
    if (!document.getElementById('carouselCSS')) {
      const css = document.createElement('style');
      css.id = 'carouselCSS';
      css.textContent = `
        .modal .modal-prev, .modal .modal-next {
          position: absolute !important;
          top: 50% !important;
          background: rgba(26,19,13,0.65) !important;
          color: #DBC082 !important;
          border: 1px solid rgba(201,169,97,0.4) !important;
          width: 58px !important;
          height: 58px !important;
          min-width: 58px !important;
          padding: 0 !important;
          font-size: 2.2rem !important;
          line-height: 56px !important;
          cursor: pointer !important;
          border-radius: 50% !important;
          z-index: 10 !important;
          transition: all .25s !important;
          font-family: Georgia, serif !important;
          text-align: center !important;
          letter-spacing: 0 !important;
          backdrop-filter: blur(8px) !important;
          transform: translateY(-50%) !important;
          white-space: nowrap !important;
          writing-mode: horizontal-tb !important;
        }
        .modal .modal-prev { left: 30px !important; right: auto !important; }
        .modal .modal-next { right: 30px !important; left: auto !important; }
        .modal .modal-prev:hover, .modal .modal-next:hover {
          background: #C9A961 !important;
          color: #1A130D !important;
          border-color: #C9A961 !important;
          transform: translateY(-50%) scale(1.1) !important;
        }
        .modal .modal-counter {
          position: absolute !important;
          bottom: 40px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: rgba(26,19,13,0.75) !important;
          color: #DBC082 !important;
          padding: 10px 24px !important;
          font-size: 0.85rem !important;
          letter-spacing: 0.18em !important;
          font-weight: 600 !important;
          backdrop-filter: blur(8px) !important;
          z-index: 10 !important;
          white-space: nowrap !important;
          writing-mode: horizontal-tb !important;
          width: auto !important;
          max-width: none !important;
          line-height: 1 !important;
        }
        .modal .modal-caption {
          position: absolute !important;
          top: 40px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: rgba(26,19,13,0.75) !important;
          color: #FAF6EE !important;
          padding: 10px 26px !important;
          font-family: 'Playfair Display', Georgia, serif !important;
          font-size: 1rem !important;
          font-style: italic !important;
          backdrop-filter: blur(8px) !important;
          z-index: 10 !important;
          white-space: nowrap !important;
          writing-mode: horizontal-tb !important;
          max-width: 80vw !important;
          width: auto !important;
          line-height: 1.4 !important;
          text-align: center !important;
        }
        .modal .modal-close {
          z-index: 11 !important;
        }
        @media (max-width: 640px) {
          .modal .modal-prev, .modal .modal-next {
            width: 44px !important; height: 44px !important;
            min-width: 44px !important;
            font-size: 1.7rem !important; line-height: 42px !important;
          }
          .modal .modal-prev { left: 12px !important; }
          .modal .modal-next { right: 12px !important; }
          .modal .modal-caption { font-size: 0.85rem !important; padding: 8px 18px !important; top: 24px !important; }
          .modal .modal-counter { font-size: 0.78rem !important; bottom: 24px !important; padding: 8px 18px !important; }
        }
      `;
      document.head.appendChild(css);
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <button class="modal-prev" aria-label="Foto anterior">&#8249;</button>
      <button class="modal-next" aria-label="Próxima foto">&#8250;</button>
      <div class="modal-caption" id="modalCaption" style="display:none;"></div>
      <div class="modal-counter" id="modalCounter">1 / 1</div>
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <img src="" alt="">
        <div class="modal-fallback" style="display:none; padding: 80px 40px; text-align: center; color: var(--creme, #FAF6EE); background: linear-gradient(135deg, rgba(60,40,25,0.9), rgba(26,19,13,0.95)); min-width: 60vw; min-height: 50vh; display: none; align-items: center; justify-content: center; flex-direction: column; font-family: 'Playfair Display', Georgia, serif;">
          <div style="font-size: 3rem; margin-bottom: 20px; color: var(--dourado-claro, #DBC082);">📷</div>
          <div style="font-size: 1.3rem; margin-bottom: 14px;">Foto ainda não disponível</div>
          <div style="font-size: 0.85rem; opacity: 0.7; font-family: 'Inter', sans-serif; font-style: normal; letter-spacing: 0.05em; max-width: 480px; line-height: 1.6;">
            Esta foto será exibida assim que você salvar o arquivo correspondente na pasta <code style="background: rgba(255,255,255,0.1); padding: 2px 8px; color: var(--dourado-claro, #DBC082);">img/</code> do projeto.
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const close = modal.querySelector('.modal-close');
    const prev = modal.querySelector('.modal-prev');
    const next = modal.querySelector('.modal-next');
    const img = modal.querySelector('img');
    const fallback = modal.querySelector('.modal-fallback');
    const counter = modal.querySelector('.modal-counter');
    const caption = modal.querySelector('.modal-caption');

    let photos = [];
    let captions = [];
    let idx = 0;

    img.addEventListener('error', () => {
      img.style.display = 'none';
      fallback.style.display = 'flex';
    });
    img.addEventListener('load', () => {
      img.style.display = '';
      fallback.style.display = 'none';
    });

    const showAt = (i) => {
      if (!photos.length) return;
      idx = ((i % photos.length) + photos.length) % photos.length;
      img.style.display = '';
      fallback.style.display = 'none';
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

    document.addEventListener('click', (e) => {
      /* Clique em um quarto (room-photo, room-row-photo, pick-photo) → carrossel completo do quarto */
      const roomEl = e.target.closest('[data-room-id]');
      if (roomEl && window.DB) {
        const room = DB.room(roomEl.dataset.roomId);
        if (room) {
          photos = window.roomGallery(room.id);
          captions = [
            `Quarto ${room.numero} · ${room.tipo}`,
            `Banheiro · pia em mármore`,
            `Banheiro · box do chuveiro`,
          ];
          showAt(0);
          modal.classList.add('open');
          document.body.style.overflow = 'hidden';
          return;
        }
      }
      /* Clique em galeria comum, intro-photo ou room-photo sem ID → foto única */
      const item = e.target.closest('.gallery-item, .room-photo, .room-row-photo, .pick-photo, .intro-photo');
      if (item) {
        const bg = window.getComputedStyle(item).backgroundImage;
        if (bg && bg !== 'none') {
          const url = bg.slice(5, -2).replace(/"/g, "");
          photos = [url];
          captions = [item.querySelector('.label')?.textContent || ''];
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

/* Retorna o array completo de fotos de um quarto (foto principal + banheiros) */
function roomGallery(roomId) {
  const room = (window.DB && DB.room) ? DB.room(roomId) : null;
  const primary = room ? imgForRoom(room) : IMG.quartoSolteiroDuplo;
  return [primary, IMG.banheiroPia, IMG.banheiroBox];
}

window.SITE = SITE;
window.IMG = IMG;
window.imgForRoom = imgForRoom;
window.roomGallery = roomGallery;
window.HOTEL_INFO = HOTEL_INFO;
