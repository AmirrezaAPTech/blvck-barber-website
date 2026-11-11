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

  /* ---------------- Booking panel ---------------- */
  var book = qs('[data-book]'), chosen = null, lastFocus = null;
  var waBase = 'https://wa.me/905540084400';
  function updateWa() {
    var wa = qs('[data-book-wa]'); if (!wa) return;
    var opt = chosen ? qs('[data-opt="' + chosen + '"]') : null;
    var name = opt ? opt.dataset[lang] : '';
    var msg = lang === 'en'
      ? 'Hello BLVCK BARBER, I would like to book an appointment' + (name ? ' for: ' + name : '') + '.'
      : 'Merhaba BLVCK BARBER, ' + (name ? name + ' için ' : '') + 'randevu almak istiyorum.';
    wa.href = waBase + '?text=' + encodeURIComponent(msg);
  }
  function choose(key) {
    chosen = key;
    qsa('.opt').forEach(function (o) { o.setAttribute('aria-checked', String(o.dataset.opt === key)); });
    updateWa();
  }
  function openBook(key) {
    lastFocus = document.activeElement;
    if (key) choose(key);
    if (menu.dataset.open === 'true') setMenu(false);
    book.dataset.open = 'true'; lock(true);
    setTimeout(function () { var c = qs('.book__close', book); if (c) c.focus({ preventScroll: true }); }, 50);
  }
  function closeBook() {
    book.dataset.open = 'false'; lock(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  qsa('[data-book-open]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openBook(b.getAttribute('data-book-open') || null); });
  });
  qsa('[data-book-close]').forEach(function (b) { b.addEventListener('click', closeBook); });
  qsa('.opt').forEach(function (o) { o.addEventListener('click', function () { choose(o.dataset.opt); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (book.dataset.open === 'true') closeBook();
    else if (menu.dataset.open === 'true') setMenu(false);
  });

  /* ---------------- Footer: today's hours, year ---------------- */
  var today = new Date().getDay();
  qsa('[data-hours] [data-day]').forEach(function (r) { if (+r.dataset.day === today) r.classList.add('is-today'); });
  var yr = qs('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  setLang(lang);

  /* ---------------- Video: hero cut by width, reels play in view ---------------- */
  var hv = qs('[data-hero-video]');
  if (hv && !reduced) {
    var mob = window.matchMedia('(max-width: 767px)').matches;
    hv.src = mob ? hv.dataset.srcMobile : hv.dataset.srcDesktop;
    hv.addEventListener('playing', function () { hv.setAttribute('data-playing', ''); }, { once: true });
    var p = hv.play(); if (p && p.catch) p.catch(function () {});
  }
  var reelsV = qsa('[data-reel-video]');
  if (reelsV.length && 'IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.35 });
    reelsV.forEach(function (v) { io.observe(v); });
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
