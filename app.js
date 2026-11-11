/* BLVCK BARBER · motion and chrome, ported from the template's
   motion/modules (reveal, hero, parallax) and chrome islands
   (SiteNav, BookingPanel) to plain JavaScript. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* ---------------- Language ---------------- */
  var lang = 'tr';
  try { if (localStorage.getItem('blvck-lang') === 'en') lang = 'en'; } catch (e) {}
  function setLang(l) {
    lang = l;
    doc.classList.toggle('is-en', l === 'en');
    doc.lang = l;
    var label = qs('[data-locale-label]'); if (label) label.textContent = l.toUpperCase();
    qsa('.locale').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.lang === l)); });
    try { localStorage.setItem('blvck-lang', l); } catch (e) {}
    updateWa();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  var trig = qs('[data-locale-trigger]'), lmenu = qs('[data-locale-menu]');
  if (trig && lmenu) {
    trig.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = trig.getAttribute('aria-expanded') === 'true';
      trig.setAttribute('aria-expanded', String(!open)); lmenu.hidden = open;
    });
    document.addEventListener('click', function () { trig.setAttribute('aria-expanded', 'false'); lmenu.hidden = true; });
    qsa('.locale').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
  }

  /* ---------------- Scroll lock ---------------- */
  function lock(on) {
    if (on) { doc.style.setProperty('--scroll-gutter', (window.innerWidth - doc.clientWidth) + 'px'); doc.setAttribute('data-scroll-locked', ''); }
    else { doc.removeAttribute('data-scroll-locked'); }
  }

  /* ---------------- Nav: retreat on scroll down, solid past the hero ---------------- */
  var nav = qs('[data-nav]'), hero = qs('[data-hero]'), lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY, heroEnd = hero ? hero.offsetHeight - 80 : 200;
    nav.dataset.solid = String(y > heroEnd * 0.35);
    if (nav.dataset.menu !== 'open') nav.dataset.hidden = String(y > lastY && y > heroEnd * 0.6);
    lastY = y; ticking = false;
    var cur = null;
    qsa('[data-section]').forEach(function (a) {
      var s = document.getElementById(a.dataset.section);
      if (s) { var r = s.getBoundingClientRect(); if (r.top < window.innerHeight * 0.4 && r.bottom > window.innerHeight * 0.4) cur = a.dataset.section; }
    });
    qsa('[data-section]').forEach(function (a) { a.dataset.active = String(a.dataset.section === cur); });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------------- Mobile menu ---------------- */
  var toggle = qs('[data-menu-toggle]'), menu = qs('[data-menu]');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.dataset.open = String(open);
    nav.dataset.menu = open ? 'open' : 'closed';
    lock(open);
  }
  toggle.addEventListener('click', function () { setMenu(menu.dataset.open !== 'true'); });
  qsa('[data-close]', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------------- Booking sheet ----------------
     Ported from emrahair: src/components/chrome/BookingPanel.tsx,
     src/lib/booking-store.ts and bookingUrl() in src/lib/site.ts.
     Services are chosen here, then handed to Kolay Randevu with every
     service preselected: randevu3.php?hizmetler[]=<id>&...&sube=207161.
     Kolay Randevu reads no staff parameter, so the summary tells the guest
     which name to pick under "Personel Seçimi". */
  var KR = { branch: '207161', base: 'https://www.kolayrandevu.com/randevu3.php', page: 'https://www.kolayrandevu.com/isletme/black-barber-basaksehir' };
  var WA = 'https://wa.me/905540084400';
  // Kolay Randevu catalogue, Erkek Bölümü, read 2026-11-11 from kolayrandevu.com/isletme/black-barber-basaksehir
  var GROUPS = [
    { key: 'hair', tr: 'Saç & Sakal', en: 'Hair & Beard', items: [
      { id: '24-2', tr: 'Saç Kesimi', en: 'Haircut', price: [700, 850] },
      { id: '58-2', tr: 'Sakal Tıraşı', en: 'Beard Shave', price: [600] },
      { id: '625582-2', tr: 'Saç + Sakal Tıraşı', en: 'Haircut + Beard', price: [1200], signature: true },
      { id: '59-2', tr: 'Çocuk Tıraşı', en: "Kids' Haircut", price: [500, 600] },
      { id: '60-2', tr: 'Damat Tıraşı', en: "Groom's Package", price: [6000], signature: true },
      { id: '22-2', tr: 'Fön', en: 'Blow-dry', price: [250] },
      { id: '32-2', tr: 'Saç Bakımı', en: 'Hair Treatment', price: [400] },
      { id: '169-2', tr: 'Keratin Bakım', en: 'Keratin Treatment', price: [1500, 5000] },
      { id: '45-2', tr: 'Brezilya Fönü', en: 'Brazilian Blowout', price: [1500, 5000] },
      { id: '26-2', tr: 'Saç Boyama', en: 'Hair Colour', price: [800] },
      { id: '43-2', tr: 'Saç Dip Boyama', en: 'Root Colour', price: [800] },
      { id: '626758-2', tr: 'Perma', en: 'Perm', price: [1500, 6000] }
    ] },
    { key: 'wax', tr: 'Ağda', en: 'Waxing', items: [
      { id: '625585-2', tr: 'Ağda (Kaş)', en: 'Brow Wax', price: [200] },
      { id: '625584-2', tr: 'Ağda (Yüz)', en: 'Face Wax', price: [250] }
    ] },
    { key: 'skin', tr: 'Cilt Bakımı', en: 'Skin Care', items: [
      { id: '37-2', tr: 'Cilt Bakımı', en: 'Skin Care', price: null }
    ] }
  ];
  var TEAM = [
    { key: 'youssef', name: 'Youssef Alzedo', kr: 'Youssef Alzedo', tr: 'Kurucu · usta berber', en: 'Founder · master barber' },
    { key: 'muhammed', name: 'Muhammed', kr: 'Muhammed', tr: 'Kesim, fade ve sakal', en: 'Cuts, fades and beards' }
  ];
  var byId = {}; GROUPS.forEach(function (g) { g.items.forEach(function (s) { byId[s.id] = s; s.group = g.key; }); });
  var T = {
    tr: { eyebrow: 'Online randevu', close: 'Kapat', titles: { services: 'Hizmet seçin', staff: 'Berberiniz', summary: 'Özet' },
      steps: { services: 'Hizmet', staff: 'Berber', summary: 'Özet', calendar: 'Tarih & saat' },
      search: 'Ara — kesim, sakal, keratin…', signature: 'Popüler', noResults: 'Bu aramayla eşleşen hizmet yok.',
      priceNote: 'Aralıklı fiyatlar saçın uzunluğuna ve işleme göre değişir. Fiyatlar Kolay Randevu’daki listeyle aynıdır.',
      onRequest: 'Fiyat salonda belirlenir', staffLede: 'Kiminle çalışmak istersiniz?', anyTitle: 'Fark etmez', any: 'İlk uygun berber',
      staffWhy: 'Kolay Randevu berber tercihini bağlantıyla almıyor; bu seçimi bir sonraki ekranda bir kez daha işaretlemeniz yeterli. Size orada hatırlatacağız.',
      remove: 'kaldır', estLabel: 'Tahmini toplam', unpriced: function (n) { return n + ' hizmetin fiyatı salonda belirlenir.'; },
      hoEyebrow: 'Kolay Randevu’da sizi bekleyen', staffAny: '“Personel Seçimi” Fark Etmez olarak gelir; dilerseniz değiştirin.',
      staffPick: function (n) { return '“Personel Seçimi” listesinde şunu seçin: <strong>' + n + '</strong>'; },
      calendar: 'Size uygun gün ve saati seçin.', confirm: 'Telefon numaranızla onaylayın; randevunuz SMS ile kesinleşir.',
      cta: 'Tarih & saat seç', count: function (n) { return n === 0 ? 'Henüz hizmet seçilmedi' : n + ' hizmet seçildi'; },
      back: 'Geri', next: 'Devam', wa: 'Ya da WhatsApp’tan yazın' },
    en: { eyebrow: 'Book online', close: 'Close', titles: { services: 'Choose services', staff: 'Your barber', summary: 'Summary' },
      steps: { services: 'Services', staff: 'Barber', summary: 'Summary', calendar: 'Date & time' },
      search: 'Search — haircut, beard, keratin…', signature: 'Popular', noResults: 'No service matches that search.',
      priceNote: 'Ranges depend on hair length and the work involved. Prices match the Kolay Randevu list.',
      onRequest: 'Priced at the shop', staffLede: 'Who would you like to see?', anyTitle: 'No preference', any: 'First available barber',
      staffWhy: 'Kolay Randevu can’t receive the barber through a link, so you tick it once more on the next screen. We’ll remind you there.',
      remove: 'Remove', estLabel: 'Estimated total', unpriced: function (n) { return n + (n === 1 ? ' service is' : ' services are') + ' priced at the shop.'; },
      hoEyebrow: 'What happens on Kolay Randevu', staffAny: '“Personel Seçimi” (barber) arrives set to Fark Etmez — change it if you like.',
      staffPick: function (n) { return 'Under “Personel Seçimi” (barber), choose <strong>' + n + '</strong>'; },
      calendar: 'Pick the day and time that suit you.', confirm: 'Confirm with your phone number; the booking is confirmed by SMS.',
      cta: 'Choose date & time', count: function (n) { return n === 0 ? 'No services chosen yet' : n + (n === 1 ? ' service chosen' : ' services chosen'); },
      back: 'Back', next: 'Continue', wa: 'Or message us on WhatsApp' }
  };
  var STORE = 'blvck:booking';
  var st = { selected: [], staff: 'any' };
  try { var raw = JSON.parse(sessionStorage.getItem(STORE) || 'null'); if (raw) { st.selected = (raw.selected || []).filter(function (id) { return byId[id]; }); st.staff = raw.staff || 'any'; } } catch (e) {}
  var ui = { open: false, step: 'services', group: 'hair', query: '', armed: false };
  var bp = qs('[data-bp]'), bpPanel = qs('.bp-panel', bp), bpVeil = qs('.bp-veil', bp), bpScroll = qs('[data-bp-scroll]', bp), opener = null, armTimer = null;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tl = function (n) { return n.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB') + ' ₺'; };
  var nm = function (s) { return lang === 'tr' ? s.tr : s.en; };
  var priceLabel = function (s) { return !s.price ? T[lang].onRequest : s.price.length > 1 ? tl(s.price[0]) + ' – ' + tl(s.price[1]) : tl(s.price[0]); };
  var fold = function (s) { return s.toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, function (c) { return { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c]; }).normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(st)); } catch (e) {} }
  function estimate() {
    var min = 0, max = 0, un = 0;
    st.selected.forEach(function (id) { var p = byId[id] && byId[id].price; if (!p) { un++; return; } min += p[0]; max += p[1] || p[0]; });
    return { min: min, max: max, unpriced: un };
  }
  function estText() { var e = estimate(); return e.min === 0 ? T[lang].onRequest : e.min === e.max ? tl(e.min) : tl(e.min) + ' – ' + tl(e.max); }
  function bookingUrl() {
    if (!st.selected.length) return KR.page;
    return KR.base + '?' + st.selected.map(function (id) { return 'hizmetler%5B%5D=' + encodeURIComponent(id); }).join('&') + '&sube=' + KR.branch;
  }
  var STEPS = ['services', 'staff', 'summary'];
  function render() {
    var L = T[lang], i = STEPS.indexOf(ui.step), h = '';
    qs('[data-bp-eyebrow]', bp).textContent = L.eyebrow;
    qs('[data-bp-title]', bp).textContent = L.titles[ui.step];
    qs('.bp-close', bp).setAttribute('aria-label', L.close);
    qs('[data-bp-steps]', bp).innerHTML = STEPS.map(function (s, k) {
      return '<li data-state="' + (k < i ? 'done' : k === i ? 'current' : 'todo') + '"><span class="bp-stepNum">' + (k + 1) + '</span><span>' + L.steps[s] + '</span></li>';
    }).join('') + '<li data-state="external"><span class="bp-stepNum">4</span><span>' + L.steps.calendar + '</span></li>';
    if (ui.step === 'services') {
      var q = fold(ui.query.trim());
      var list = q ? GROUPS.reduce(function (a, g) { return a.concat(g.items); }, []).filter(function (s) { return fold(s.tr).indexOf(q) > -1 || fold(s.en).indexOf(q) > -1; })
                   : GROUPS.filter(function (g) { return g.key === ui.group; })[0].items;
      h += '<label class="bp-search"><span class="visually-hidden">' + L.search + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.4"/></svg>'
        + '<input type="search" data-bp-q value="' + esc(ui.query) + '" placeholder="' + esc(L.search) + '"></label>';
      if (!q) h += '<div class="bp-tabs" role="tablist">' + GROUPS.map(function (g) {
        var c = g.items.filter(function (s) { return st.selected.indexOf(s.id) > -1; }).length;
        return '<button type="button" role="tab" class="bp-tab" data-bp-group="' + g.key + '" aria-selected="' + (ui.group === g.key) + '">' + (lang === 'tr' ? g.tr : g.en) + (c ? '<span class="bp-tabCount">' + c + '</span>' : '') + '</button>';
      }).join('') + '</div>';
      h += '<ul class="bp-list">' + (list.length ? list.map(function (s) {
        return '<li><button type="button" class="bp-row" data-bp-toggle="' + s.id + '" aria-pressed="' + (st.selected.indexOf(s.id) > -1) + '"><span class="bp-check" aria-hidden="true"></span>'
          + '<span class="bp-rowMain"><span class="bp-rowName">' + nm(s) + (s.signature ? '<span class="bp-badge">' + L.signature + '</span>' : '') + '</span><span class="bp-rowStaff">Youssef Alzedo · Muhammed</span></span>'
          + '<span class="bp-rowPrice">' + priceLabel(s) + '</span></button></li>';
      }).join('') : '<li class="bp-empty">' + L.noResults + '</li>') + '</ul><p class="bp-fine">' + L.priceNote + '</p>';
    } else if (ui.step === 'staff') {
      var opts = TEAM.map(function (m) { return { key: m.key, title: m.name, note: m[lang] }; }).concat([{ key: 'any', title: L.anyTitle, note: L.any }]);
      h += '<p class="bp-lede">' + L.staffLede + '</p><div class="bp-staffGrid" role="radiogroup">' + opts.map(function (o) {
        return '<button type="button" role="radio" class="bp-staffCard" data-bp-staff="' + o.key + '" aria-checked="' + (st.staff === o.key) + '"><span class="bp-staffMark" aria-hidden="true">' + (o.key === 'any' ? '∗' : o.title.charAt(0)) + '</span>'
          + '<span class="bp-staffTitle">' + o.title + '</span><span class="bp-staffNote">' + o.note + '</span></button>';
      }).join('') + '</div><p class="bp-fine">' + L.staffWhy + '</p>';
    } else {
      var e = estimate(), who = TEAM.filter(function (m) { return m.key === st.staff; })[0];
      h += '<ul class="bp-summary">' + st.selected.map(function (id) {
        var s = byId[id]; return '<li class="bp-summaryRow"><span class="bp-rowName">' + nm(s) + '</span><span class="bp-rowPrice">' + priceLabel(s) + '</span><button type="button" class="bp-remove" data-bp-toggle="' + id + '" aria-label="' + esc(L.remove + ' ' + nm(s)) + '">×</button></li>';
      }).join('') + '</ul><div class="bp-total"><span class="eyebrow eyebrow--muted">' + L.estLabel + '</span><span class="bp-totalValue">' + estText() + '</span>'
        + (e.unpriced ? '<span class="bp-fine">' + L.unpriced(e.unpriced) + '</span>' : '') + '</div>'
        + '<div class="bp-handoff"><span class="eyebrow">' + L.hoEyebrow + '</span><ol class="bp-handoffSteps"><li><span>' + (who ? L.staffPick(who.kr) : L.staffAny) + '</span></li><li><span>' + L.calendar + '</span></li><li><span>' + L.confirm + '</span></li></ol></div>';
    }
    bpScroll.innerHTML = h;
    qs('[data-bp-count]', bp).textContent = L.count(st.selected.length);
    qs('[data-bp-total]', bp).textContent = st.selected.length ? estText() : '';
    var act = (i > 0 ? '<button type="button" class="bp-backBtn" data-bp-back>' + L.back + '</button>' : '')
      + (ui.step !== 'summary' ? '<button type="button" class="btn" data-bp-next' + (st.selected.length ? '' : ' disabled') + '>' + L.next + '</button>'
         : '<a class="btn" data-bp-go href="' + bookingUrl() + '" rel="noopener">' + L.cta + '</a>');
    qs('[data-bp-actions]', bp).innerHTML = act;
    var wa = qs('[data-bp-wa]', bp); wa.hidden = ui.step !== 'summary'; wa.textContent = L.wa;
    var names = st.selected.map(function (id) { return nm(byId[id]); }).join(', ');
    wa.href = WA + '?text=' + encodeURIComponent(lang === 'en' ? 'Hello BLVCK BARBER, I would like to book' + (names ? ': ' + names : ' an appointment') + '.' : 'Merhaba BLVCK BARBER, ' + (names ? names + ' için ' : '') + 'randevu almak istiyorum.');
  }
  function go(step) {
    ui.step = step; render(); bpScroll.scrollTop = 0;
    clearTimeout(armTimer); ui.armed = false;
    // A double tap on "Devam" must not land on the hand-off link before the summary is seen.
    if (step === 'summary') armTimer = setTimeout(function () { ui.armed = true; }, 500);
  }
  function openBP(service) {
    opener = document.activeElement;
    if (service && byId[service]) { if (st.selected.indexOf(service) < 0) st.selected.push(service); ui.group = byId[service].group; save(); }
    if (menu.dataset.open === 'true') setMenu(false);
    ui.query = ''; ui.open = true; go('services');
    bp.hidden = false; lock(true);
    if (window.gsap && !reduced) {
      gsap.fromTo(bpVeil, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.fromTo(bpPanel, { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: 'expo.out' });
    } else { bpVeil.style.opacity = 1; }
    var af = qs('[data-bp-autofocus]', bp); if (af) af.focus({ preventScroll: true });
  }
  function closeBP() {
    if (!ui.open) return; ui.open = false; lock(false);
    var done = function () { bp.hidden = true; };
    if (window.gsap && !reduced) {
      gsap.to(bpPanel, { xPercent: 100, duration: 0.5, ease: 'power3.in' });
      gsap.to(bpVeil, { opacity: 0, duration: 0.4, delay: 0.1, onComplete: done });
    } else done();
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-book-open]');
    if (t) { e.preventDefault(); openBP(t.getAttribute('data-book-open') || null); return; }
    if (!bp.contains(e.target)) return;
    var el;
    if ((el = e.target.closest('[data-bp-close]'))) return closeBP();
    if ((el = e.target.closest('[data-bp-toggle]'))) {
      var id = el.getAttribute('data-bp-toggle'), k = st.selected.indexOf(id);
      if (k > -1) st.selected.splice(k, 1); else st.selected.push(id);
      save(); if (ui.step === 'summary' && !st.selected.length) go('services'); else render(); return;
    }
    if ((el = e.target.closest('[data-bp-group]'))) { ui.group = el.getAttribute('data-bp-group'); render(); return; }
    if ((el = e.target.closest('[data-bp-staff]'))) { st.staff = el.getAttribute('data-bp-staff'); save(); render(); return; }
    if (e.target.closest('[data-bp-next]')) return go(STEPS[Math.min(STEPS.indexOf(ui.step) + 1, 2)]);
    if (e.target.closest('[data-bp-back]')) return go(STEPS[Math.max(STEPS.indexOf(ui.step) - 1, 0)]);
    if (e.target.closest('[data-bp-go]') && !ui.armed) e.preventDefault();
  });
  bp.addEventListener('input', function (e) {
    if (!e.target.matches('[data-bp-q]')) return;
    var pos = e.target.selectionStart; ui.query = e.target.value; render();
    var inp = qs('[data-bp-q]', bp); inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (er) {}
  });
  document.addEventListener('keydown', function (e) {
    if (ui.open) {
      if (e.key === 'Escape') return closeBP();
      if (e.key === 'Tab') {
        var els = qsa('a[href], button:not([disabled]), input', bpPanel).filter(function (x) { return x.offsetParent !== null; });
        var first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === 'Escape' && menu.dataset.open === 'true') setMenu(false);
  });
  function updateWa() { if (ui && ui.open) render(); }


  /* ---------------- Footer: today's hours, year ---------------- */
  var today = new Date().getDay();
  qsa('[data-hours] [data-day]').forEach(function (r) { if (+r.dataset.day === today) r.classList.add('is-today'); });
  var yr = qs('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  setLang(lang);

  /* ---------------- Video (ported from motion/modules/hero-video + service-video) ---------------- */
  var hv = qs('[data-hero-video]');
  if (hv && !reduced) {
    var src = window.matchMedia('(min-width: 768px)').matches ? hv.dataset.srcDesktop : hv.dataset.srcMobile;
    hv.src = src; hv.muted = true;
    var playHero = function () { var p = hv.play(); if (p && p.catch) p.catch(function () {}); };
    hv.addEventListener('playing', function () { hv.setAttribute('data-playing', 'true'); });
    playHero();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) playHero(); else hv.pause(); }, { threshold: 0 }).observe(hv);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) hv.pause(); else if (hv.getBoundingClientRect().bottom > 0) playHero();
    });
  }
  var clips = qsa('[data-svc-video]');
  if (clips.length && !reduced && 'IntersectionObserver' in window) {
    var onScreen = new Set();
    var playClip = function (v) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var clipIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { onScreen.add(e.target); playClip(e.target); }
        else { onScreen.delete(e.target); e.target.pause(); }
      });
    }, { rootMargin: '200px 0px', threshold: 0 });
    clips.forEach(function (v) { clipIO.observe(v); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clips.forEach(function (v) { v.pause(); }); else onScreen.forEach(playClip);
    });
  }

  /* ---------------- Motion (GSAP) ---------------- */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST || reduced) return;
  gsap.registerPlugin(ST);
  gsap.defaults({ ease: 'expo.out' });
  var START = 'top 88%';
  var inHero = function (el) { return !!el.closest('[data-hero]'); };

  // Hero intro — the type rises through its masks, then the CTA row arrives.
  if (hero) {
    var hl = qsa('[data-reveal-line] > span', hero);
    var hf = qsa('[data-hero-fade]', hero);
    gsap.set(hl, { yPercent: 126 });
    gsap.set(hf, { opacity: 0, y: 18 });
    gsap.timeline()
      .to(hf[0], { opacity: 1, y: 0, duration: 1 }, 0.15)
      .to(hl, { yPercent: 0, duration: 1.5, stagger: 0.1 }, 0.3)
      .to(hf.slice(1), { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 1.05);

    if (!touch) {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to(qs('[data-hero-media]', hero), { yPercent: 3, ease: 'none' }, 0)
        .to(qs('[data-hero-inner]', hero), { yPercent: -12, opacity: 0.35, ease: 'none' }, 0);
    }
  }

  // Blocks: fade and rise, batched.
  var blocks = qsa('[data-reveal]').filter(function (el) { return !inHero(el); });
  if (blocks.length) {
    gsap.set(blocks, { opacity: 0, y: 26 });
    ST.batch(blocks, { start: START, once: true, batchMax: 6,
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }); } });
  }

  // Headlines: each line rises through its own window.
  var groups = new Map();
  qsa('[data-reveal-line]').filter(function (el) { return !inHero(el); }).forEach(function (line) {
    var owner = line.closest('h1, h2, h3, p, div') || line.parentElement;
    if (!groups.has(owner)) groups.set(owner, []);
    groups.get(owner).push(line);
  });
  groups.forEach(function (group, owner) {
    var inners = group.map(function (l) { return l.firstElementChild; }).filter(Boolean);
    gsap.set(inners, { yPercent: 126 });
    ST.create({ trigger: owner, start: START, once: true,
      onEnter: function () { gsap.to(inners, { yPercent: 0, duration: 1.25, stagger: 0.085 }); } });
  });

  // Photographs: a wipe up from the floor on desktop, a fade and rise on touch.
  qsa('[data-reveal-media]').filter(function (el) { return !inHero(el); }).forEach(function (frame) {
    var img = frame.querySelector('img');
    if (touch) gsap.set(frame, { opacity: 0, y: 24 });
    else { gsap.set(frame, { clipPath: 'inset(0% 0% 100% 0%)' }); if (img) gsap.set(img, { scale: 1.16 }); }
    ST.create({ trigger: frame, start: 'top 90%', once: true, onEnter: function () {
      if (touch) { gsap.to(frame, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }); return; }
      var tl = gsap.timeline();
      tl.to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4 });
      if (img) tl.to(img, { scale: 1, duration: 1.8, clearProps: 'transform' }, 0.05);
    } });
  });

  // Parallax on the invitation plate.
  if (!touch) {
    qsa('[data-parallax-y]').forEach(function (el) {
      var a = parseFloat(el.dataset.parallaxY || '0.12');
      gsap.fromTo(el, { yPercent: -a * 50 }, { yPercent: a * 50, ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  var refresh = function () { ST.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
})();
