/* ═══════════════════════════════════════════════════════════════
   APP — Entry point: state, routing, district map, confetti, i18n
   ─────────────────────────────────────────────────────────────── */

/* ───── Storage helper ───── */
window.Store = (function () {
  const PFX = 'ld:'; // little-district namespace
  return {
    get(k)    { try { return localStorage.getItem(PFX + k); } catch(e) { return null; } },
    set(k, v) { try { localStorage.setItem(PFX + k, v); } catch(e) {} },
    remove(k) { try { localStorage.removeItem(PFX + k); } catch(e) {} }
  };
})();

/* ───── App ───── */
window.App = (function () {
  let currentSlug = null;
  let currentLang = (Store.get('lang') || 'ar');

  function arEn(d, lang) {
    if (d == null) return '';
    if (typeof d === 'string') return d;
    return d[lang] || d.ar || d.en || '';
  }

  function setLang(lang) {
    currentLang = lang;
    Store.set('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    // re-render
    buildDistrict();
    if (currentSlug) Render.house(currentSlug);
  }

  /* ───── DISTRICT MAP ───── */
  function buildDistrict() {
    const root = document.getElementById('districtBody');
    if (!root) return;
    root.innerHTML = '';

    // Two category sections
    const cats = [
      { id:'akhlaq', icon:'🌱',
        ttlAr:'أركان الأخلاق', ttlEn:'Houses of Akhlaq',
        subAr:'شخصيتك تُبنى هنا', subEn:'Where character is built' },
      { id:'adab',   icon:'📋',
        ttlAr:'أركان الآداب',   ttlEn:'Houses of Adab',
        subAr:'الآداب اليومية للمسلم',  subEn:'Daily Muslim manners' },
    ];

    cats.forEach(cat => {
      // Header
      const hdr = document.createElement('div');
      hdr.className = 'cat-hdr';
      hdr.innerHTML = `<div class="line"></div>
        <div class="cat-pill ${cat.id}">${cat.icon} <span>${currentLang==='ar'?cat.ttlAr:cat.ttlEn}</span>
          <span style="font-weight:700;font-size:.72rem;opacity:.75">· ${currentLang==='ar'?cat.subAr:cat.subEn}</span>
        </div>
        <div class="line"></div>`;
      root.appendChild(hdr);

      // Houses grid
      const street = document.createElement('div');
      street.className = 'street';
      const grid = document.createElement('div');
      grid.className = 'house-grid';
      window.HOUSE_INDEX.filter(h => h.cat === cat.id).forEach((h, i) => {
        const c = document.createElement('button');
        c.className = 'hc' + (Store.get(`done:${h.slug}`) === '1' ? ' done' : '');
        c.style.setProperty('--hc', h.color);
        c.setAttribute('aria-label', currentLang==='ar' ? h.nameAr : h.nameEn);
        const ptsCur = parseInt(Store.get(`pts:${h.slug}`) || 0, 10);
        const hasData = !!window.HOUSES[h.slug];
        const maxPts = hasData ? (window.HOUSES[h.slug].activities ? window.HOUSES[h.slug].activities.totalPoints : 180) : 180;
        const pct = Math.min(100, Math.round(ptsCur / maxPts * 100));
        c.innerHTML = `
          <span class="star">⭐</span>
          ${hasData ? '' : `<span class="badge-new">${currentLang==='ar'?'قريباً':'Soon'}</span>`}
          <div class="hc-fig">${HouseArt.render(h.art, h.color)}</div>
          <div class="hc-name">${currentLang==='ar'?h.nameAr:h.nameEn}</div>
          <div class="hc-sub">${currentLang==='ar'?h.shortAr:h.shortEn}</div>
          <div class="hc-progress">
            <div class="bar"><div class="fill" style="width:${pct}%;background:${h.color}"></div></div>
            <span>${pct}%</span>
          </div>`;
        c.addEventListener('click', () => openHouse(h.slug));
        grid.appendChild(c);
      });
      street.appendChild(grid);
      root.appendChild(street);

      // Mini garden between category sections
      const garden = document.createElement('div');
      garden.className = 'mini-garden';
      garden.innerHTML = ['🌷','🌳','🌻','🌱','🌼','🌳','🌷'].map(e => `<span>${e}</span>`).join('');
      root.appendChild(garden);
    });

    // Progress garden
    renderProgressGarden(root);

    // Update the header bag-count badge with earned reward total
    const bagCount = document.getElementById('bagCount');
    if (bagCount) bagCount.textContent = window.HOUSE_INDEX.filter(h => Store.get(`done:${h.slug}`) === '1').length;
  }

  function renderProgressGarden(root) {
    const total = window.HOUSE_INDEX.length;
    let done = 0;
    window.HOUSE_INDEX.forEach(h => { if (Store.get(`done:${h.slug}`) === '1') done++; });

    const wrap = document.createElement('section');
    wrap.className = 'prog-garden';
    wrap.innerHTML = `
      <div class="pg-hdr">
        <div class="ic">🌳</div>
        <div>
          <h3>${currentLang==='ar'?'حديقة التقدم':'My Progress Garden'}</h3>
          <p>${currentLang==='ar'?`أكملتَ ${done} من ${total} بيتاً — كل بيت يزرع شجرة!`:`You finished ${done}/${total} houses — each grows a tree!`}</p>
        </div>
      </div>
      <div class="pg-row"></div>
      <div class="pg-legend">
        <span style="color:#4CAF50">${currentLang==='ar'?'شجرة = بيت مكتمل':'tree = completed house'}</span>
        <span style="color:#9A8472">${currentLang==='ar'?'بذرة = بيت لم يكتمل':'seed = not yet completed'}</span>
      </div>`;
    const row = wrap.querySelector('.pg-row');
    window.HOUSE_INDEX.forEach(h => {
      const plant = document.createElement('div');
      const grown = Store.get(`done:${h.slug}`) === '1';
      const seedIcons = ['🌱','🌱','🌱'];
      const growIcons = ['🌳','🌲','🌴','🌵','🌷','🌻','🌸','🌺'];
      const ic = grown
        ? growIcons[h.id % growIcons.length]
        : seedIcons[h.id % seedIcons.length];
      plant.className = 'pg-plant' + (grown ? ' grown' : '');
      plant.title = currentLang==='ar' ? h.nameAr : h.nameEn;
      plant.textContent = ic;
      plant.style.cursor = 'pointer';
      plant.addEventListener('click', () => openHouse(h.slug));
      row.appendChild(plant);
    });
    root.appendChild(wrap);
  }

  function updateProgress() {
    // Re-render district body so any progress updates persist visually
    buildDistrict();
  }

  /* ───── HOUSE ROUTING ───── */
  function openHouse(slug) {
    currentSlug = slug;
    document.body.classList.add('in-house');
    Render.house(slug);
    location.hash = '#' + slug;
  }
  function closeHouse() {
    currentSlug = null;
    document.body.classList.remove('in-house');
    location.hash = '';
    window.scrollTo({ top: 0 });
  }
  function navHouse(dir) {
    const list = window.HOUSE_INDEX;
    let i = list.findIndex(h => h.slug === currentSlug);
    if (i < 0) return;
    i = (i + dir + list.length) % list.length;
    openHouse(list[i].slug);
  }

  /* ───── CONFETTI ───── */
  function confetti() {
    const root = document.getElementById('confetti');
    if (!root) return;
    const colors = ['#E8A82F','#4CAF50','#EC407A','#1E88E5','#FFD56B','#AB47BC'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'cf-piece';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      p.style.animationDuration = (1.6 + Math.random() * 1.5) + 's';
      p.style.width  = (6 + Math.random() * 8) + 'px';
      p.style.height = (10 + Math.random() * 10) + 'px';
      root.appendChild(p);
      setTimeout(() => p.remove(), 3500);
    }
  }

  /* ───── TOAST ───── */
  let toastTimer;
  function toast(msg, type) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + (type || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ───── REWARD WALL ───── */
  // The signature reward for a house = its primary medal (treasures[0]) + house icon.
  function houseReward(h) {
    const data = window.HOUSES[h.slug];
    const t0 = data && data.treasures && data.treasures[0];
    return {
      icon:  (data && data.icon) || (t0 && t0.icon) || '🏅',
      color: h.color,
      title: (t0 && arEn(t0.title, currentLang)) || (currentLang==='ar' ? h.shortAr : h.shortEn),
      house: currentLang==='ar' ? h.nameAr : h.nameEn,
      short: currentLang==='ar' ? h.shortAr : h.shortEn,
    };
  }
  function isEarned(h) { return Store.get(`done:${h.slug}`) === '1'; }

  function openBackpack() {
    const bp = document.getElementById('bpDrawer');
    const ov = document.getElementById('bpOverlay');
    const body = bp.querySelector('.bp-body');
    body.innerHTML = '';

    const total = window.HOUSE_INDEX.length;
    const earned = window.HOUSE_INDEX.filter(isEarned).length;
    const pct = Math.round(earned / total * 100);

    // Summary card
    const sum = document.createElement('div');
    sum.className = 'rw-summary';
    sum.innerHTML = `
      <div class="rw-count"><b>${earned}</b> / ${total}</div>
      <div class="rw-label">${currentLang==='ar'?'جائزة بطل — أكمل بيتاً لتكسب جائزته!':'hero rewards — finish a house to earn its medal!'}</div>
      <div class="rw-bar"><div class="fill" style="width:${pct}%"></div></div>
      <button class="rw-print-cta" id="rwPrint">🖨️ ${currentLang==='ar'?'اطبع حائط جوائزي':'Print my reward wall'}</button>`;
    body.appendChild(sum);

    // Build medal grid per category
    const cats = [
      { id:'akhlaq', ar:'🌱 جوائز الأخلاق', en:'🌱 Akhlaq rewards' },
      { id:'adab',   ar:'📋 جوائز الآداب',   en:'📋 Adab rewards' },
    ];
    cats.forEach(cat => {
      const houses = window.HOUSE_INDEX.filter(h => h.cat === cat.id);
      const ttl = document.createElement('div');
      ttl.className = 'rw-section-title';
      ttl.textContent = currentLang==='ar' ? cat.ar : cat.en;
      body.appendChild(ttl);

      const grid = document.createElement('div');
      grid.className = 'reward-grid';
      houses.forEach(h => {
        const r = houseReward(h);
        const won = isEarned(h);
        const m = document.createElement('div');
        m.className = 'reward-medal ' + (won ? 'earned' : 'locked');
        m.style.setProperty('--rm-color', r.color);
        m.title = r.house;
        m.innerHTML = `
          <div class="rm-disc">
            ${won ? r.icon : '<span class="rm-lock">🔒</span>'}
            ${won ? '<span class="rm-check">✓</span>' : ''}
          </div>
          <div class="rm-name">${won ? r.title : r.short}</div>`;
        m.addEventListener('click', () => { closeBackpack(); openHouse(h.slug); });
        grid.appendChild(m);
      });
      body.appendChild(grid);
    });

    const printBtn = document.getElementById('rwPrint');
    if (printBtn) printBtn.addEventListener('click', printRewards);

    bp.classList.add('open');
    ov.classList.add('open');
  }

  function printRewards() {
    const total = window.HOUSE_INDEX.length;
    const earned = window.HOUSE_INDEX.filter(isEarned).length;
    const childName = Store.get('childName') || '';
    const dateStr = new Date().toLocaleDateString(currentLang==='ar' ? 'ar-EG' : 'en-US');

    const medals = window.HOUSE_INDEX.map(h => {
      const r = houseReward(h);
      const won = isEarned(h);
      const dk = HouseArt.darken(r.color, 0.3);
      return `<div class="rs-medal ${won ? 'earned' : 'locked'}">
        <div class="disc" style="${won ? `background:${r.color};border-color:${dk}` : ''}">${won ? r.icon : '🔒'}</div>
        <div class="lbl">${won ? r.title : r.short}</div>
      </div>`;
    }).join('');

    const sheet = `<div class="reward-sheet">
      <div class="rs-head">
        <h1>${currentLang==='ar'?'🏆 حائط جوائزي':'🏆 My Reward Wall'}</h1>
        <div class="rs-sub">${currentLang==='ar'?'حيّنا الصغير — جائزة بطل من كل بيت':'Little District — a hero medal from every house'}</div>
      </div>
      <div class="rs-name">
        ${currentLang==='ar'?'البطل:':'Hero:'} <span class="blank">${childName}</span>
        &nbsp;&nbsp; ${currentLang==='ar'?'الجوائز:':'Rewards:'} <b>${earned} / ${total}</b>
      </div>
      <div class="rs-grid">${medals}</div>
      <div class="rs-foot">${currentLang==='ar'?`📅 ${dateStr} — قُصَّ الميداليات والصِقها على لوحتك!`:`📅 ${dateStr} — cut out the medals and stick them on your board!`}</div>
    </div>`;

    const print = document.getElementById('printArea');
    print.style.display = 'block';
    print.innerHTML = sheet;
    setTimeout(() => {
      window.print();
      setTimeout(() => { print.style.display = 'none'; print.innerHTML = ''; }, 500);
    }, 120);
  }
  function closeBackpack() {
    document.getElementById('bpDrawer').classList.remove('open');
    document.getElementById('bpOverlay').classList.remove('open');
  }

  /* ───── INIT ───── */
  function init() {
    // Lang
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });
    setLang(currentLang);

    // Header buttons
    document.getElementById('btnBack').addEventListener('click', closeHouse);
    document.getElementById('btnBackpack').addEventListener('click', openBackpack);
    document.getElementById('bpClose').addEventListener('click', closeBackpack);
    document.getElementById('bpOverlay').addEventListener('click', closeBackpack);
    const bpPrintBtn = document.getElementById('bpPrint');
    if (bpPrintBtn) bpPrintBtn.addEventListener('click', printRewards);

    // House nav buttons
    document.getElementById('hnBack').addEventListener('click', closeHouse);
    document.getElementById('hnPrev').addEventListener('click', () => navHouse(-1));
    document.getElementById('hnNext').addEventListener('click', () => navHouse(1));

    // Story reader close
    document.getElementById('storyReader').addEventListener('click', (e) => {
      if (e.target.id === 'storyReader') e.currentTarget.classList.remove('open');
    });
    document.getElementById('srClose').addEventListener('click', () => {
      document.getElementById('storyReader').classList.remove('open');
    });

    // Hash route
    const initialSlug = (location.hash || '').replace('#', '');
    if (initialSlug && window.HOUSE_BY_SLUG[initialSlug]) {
      openHouse(initialSlug);
    }

    // Keyboard nav
    window.addEventListener('keydown', (e) => {
      if (!currentSlug) return;
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.target && e.target.isContentEditable) return;
      if (e.key === 'Escape') closeHouse();
      if (e.key === 'ArrowLeft')  navHouse(currentLang==='ar' ? 1 : -1);
      if (e.key === 'ArrowRight') navHouse(currentLang==='ar' ? -1 : 1);
    });

    // Reduce-motion: pause walkers
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.walker,.cloud,.hero-grass').forEach(n => {
        n.style.animation = 'none';
      });
    }
  }

  return {
    init, setLang, openHouse, closeHouse, navHouse,
    confetti, toast, updateProgress, openBackpack, closeBackpack,
    buildDistrict
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
