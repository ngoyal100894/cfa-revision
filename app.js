/* CFA revision app. One file, no dependencies.
   Structure: helpers -> Store (state load/save) -> Data -> Router -> one render function per screen -> boot.
   To add a screen:  Router.register('name', function (root, args) { ... });  then Router.go('name'). */
(function () {
  'use strict';

  var Sched = window.Scheduler;
  var KEY = 'cfa-rev-v1';
  var NAMES = { daily: "Today's 15", recap: 'Recap', calc: 'Quick-calc', remember: 'Must-remember', weak: 'Weak spots', exam: 'Exam practice', sheet: 'Formula sheet' };
  var LETTERS = ['A', 'B', 'C', 'D'];
  var PACE_SECONDS = 90;   // exam practice pace bar (visual only)
  // Momentum: XP, levels and a daily goal. Rewards practice, not just being right, so effort always counts.
  var GOAL = 25;           // questions a day: one Today's 15 plus a couple of short rounds
  var XP = { right: 10, wrong: 4, finish: 20, recap: 5 };
  var LUCKY_CHANCE = 0.12; // occasional 2x on a right answer (variable reward)
  var MILESTONES = [25, 50, 100, 200, 300, 500, 750, 1000, 1500];
  var LEVELS = ['Starter', 'Reader', 'Reviser', 'Analyst', 'Associate', 'Senior Analyst', 'Portfolio Manager', 'Head of Research', 'CIO', 'Exam-ready'];

  /* =====================================================================
     Helpers
     ===================================================================== */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(el, x); });
    else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  var ICONS = {
    chev: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 4.5 13 10l-5.5 5.5"/></svg>',
    back: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l12 12M17 5 5 17"/></svg>',
    gear: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h0a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>',
    tick: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7.4 5.6 10.4 11.5 3.8"/></svg>',
    tickCircle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" opacity=".35"/><path d="M7.6 12.4 10.6 15.3 16.4 9"/></svg>',
    flame: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.6 2.3c.4 3.1-1.2 4.9-2.8 6.6C8.2 10.6 6.5 12.4 6.5 15a5.5 5.5 0 0 0 11 0c0-1.9-.8-3.3-1.7-4.4-.2 1.3-.9 2.3-2 2.8.6-3.6-.2-7.9-1.2-11.1z"/></svg>',
    // Home mode tiles
    recap: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 5h6a3.5 3.5 0 0 1 3.5 3.5V20a2.5 2.5 0 0 0-2.5-2.5h-7z"/><path d="M21.5 5h-6A3.5 3.5 0 0 0 12 8.5V20a2.5 2.5 0 0 1 2.5-2.5h7z"/></svg>',
    remember: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/></svg>',
    calc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 18h.01M12 18h.01"/></svg>',
    sheet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    weak: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></svg>',
    exam: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M10 2.5h4M18.5 6l1.5-1.5"/></svg>'
  };
  function icon(name) { var s = h('span', { 'aria-hidden': 'true', style: 'display:inline-flex' }); s.innerHTML = ICONS[name]; return s; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function el(id) { return document.getElementById(id); }
  function today() { return Sched.localToday(); }

  var toastTimer = null;
  function notice(msg) {
    var t = el('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3600);
  }

  // Calm confirm sheet. Returns a Promise<boolean>.
  function confirmDialog(title, body, okLabel, cancelLabel, danger) {
    return new Promise(function (resolve) {
      var root = el('modal-root');
      function close(v) { root.innerHTML = ''; resolve(v); }
      var ok = h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), text: okLabel, onclick: function () { close(true); } });
      var cancel = h('button', { class: 'btn btn-quiet', text: cancelLabel || 'Cancel', onclick: function () { close(false); } });
      var dlg = h('div', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true' },
        h('h2', { text: title }), body ? h('p', { text: body }) : null, h('div', { class: 'btn-row' }, ok, cancel));
      var scrim = h('div', { class: 'scrim', onclick: function (e) { if (e.target === scrim) close(false); } }, dlg);
      root.innerHTML = ''; root.appendChild(scrim); cancel.focus();
    });
  }

  // "Keep going?" sheet. Resolves true only if she chooses to leave.
  function stayDialog(title, body, stayLabel, leaveLabel) {
    return new Promise(function (resolve) {
      var root = el('modal-root');
      function close(v) { root.innerHTML = ''; resolve(v); }
      var stay = h('button', { class: 'btn btn-primary', text: stayLabel, onclick: function () { close(false); } });
      var leave = h('button', { class: 'btn btn-quiet', text: leaveLabel, onclick: function () { close(true); } });
      var dlg = h('div', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true' },
        h('h2', { text: title }), body ? h('p', { text: body }) : null, h('div', { class: 'btn-row stay-row' }, stay, leave));
      var scrim = h('div', { class: 'scrim', onclick: function (e) { if (e.target === scrim) close(false); } }, dlg);
      root.innerHTML = ''; root.appendChild(scrim); stay.focus();
    });
  }

  /* =====================================================================
     Store: the one place that touches localStorage
     ===================================================================== */
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }

  // Fill in anything missing so older or partial states still work.
  function normalise(s) {
    var base = Sched.emptyState();
    if (!isObj(s)) { base.onboarded = false; return base; }
    var out = {};
    Object.keys(s).forEach(function (k) { out[k] = s[k]; }); // keep unknown keys: later features add their own
    out.v = typeof s.v === 'number' ? s.v : base.v;
    out.coverage = isObj(s.coverage) ? s.coverage : {};
    out.q = isObj(s.q) ? s.q : {};
    out.sessions = Array.isArray(s.sessions) ? s.sessions : [];
    out.lastSessionDate = typeof s.lastSessionDate === 'string' ? s.lastSessionDate : null;
    out.onboarded = !!s.onboarded;
    out.recap = isObj(s.recap) ? s.recap : {};
    out.nudge = isObj(s.nudge) ? s.nudge : {};
    out.xp = typeof s.xp === 'number' ? s.xp : seedXp(out.sessions);
    out.bestRun = typeof s.bestRun === 'number' ? s.bestRun : 0;
    return out;
  }
  function seedXp(sessions) {
    return sessions.reduce(function (t, x) {
      if (!isObj(x) || typeof x.n !== 'number') return t;
      if (x.right === null) return t + x.n * XP.recap;
      return t + x.right * XP.right + (x.n - x.right) * XP.wrong + (x.n >= 10 ? XP.finish : 0);
    }, 0);
  }
  // Does this look like a progress file from this app?
  function looksLikeState(o) {
    if (!isObj(o) || !isObj(o.coverage) || !isObj(o.q) || !Array.isArray(o.sessions)) return false;
    if (typeof o.v !== 'number') return false;
    var okCov = Object.keys(o.coverage).every(function (k) { return typeof o.coverage[k] === 'string'; });
    var okQ = Object.keys(o.q).every(function (k) { var x = o.q[k]; return isObj(x) && typeof x.box === 'number' && typeof x.due === 'string'; });
    var okS = o.sessions.every(function (x) { return isObj(x) && typeof x.date === 'string'; });
    return okCov && okQ && okS;
  }

  var Store = {
    state: null,
    ok: true,
    load: function () {
      var parsed = null;
      try {
        localStorage.setItem(KEY + '-probe', '1'); localStorage.removeItem(KEY + '-probe');
        var raw = localStorage.getItem(KEY);
        if (raw) parsed = JSON.parse(raw);
      } catch (e) { if (!(e instanceof SyntaxError)) this.ok = false; }
      this.state = normalise(parsed);
      this.banner();
    },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); this.ok = true; }
      catch (e) { this.ok = false; }
      this.banner();
      return this.ok;
    },
    replace: function (s) { this.state = normalise(s); return this.save(); },
    reset: function () { this.state = normalise(null); try { localStorage.removeItem(KEY); } catch (e) { this.ok = false; } this.banner(); },
    banner: function () {
      var b = el('banner');
      b.hidden = this.ok;
      b.textContent = this.ok ? '' : "Progress can't be saved in this browser mode. Export from Settings.";
    }
  };

  /* =====================================================================
     Data
     ===================================================================== */
  var D = { curriculum: null, questions: [], q: {}, lo: {}, reading: {}, topic: {}, readingCount: 0, recaps: {}, recapList: [] };

  function fetchJson(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }
  function loadData() {
    return fetchJson('data/curriculum.json').then(function (cur) {
      D.curriculum = cur;
      cur.topics.forEach(function (t) {
        D.topic[t.id] = t;
        t.readings.forEach(function (r) {
          D.readingCount++;
          D.reading[r.id] = { reading: r, topic: t };
          r.los.forEach(function (lo) { D.lo[lo.id] = lo; });
        });
      });
      return fetchJson('data/questions/index.json');
    }).then(function (idx) {
      // A file that is missing or broken is skipped, so the app works with whatever is present.
      return Promise.all(idx.files.map(function (f) {
        return fetchJson('data/questions/' + f).catch(function (e) {
          if (window.console) console.warn('Skipping ' + f + ': ' + (e && e.message ? e.message : e));
          return null;
        });
      }));
    }).then(function (files) {
      files = files.filter(function (f) { return isObj(f); });
      D.questions = [].concat.apply([], files.map(function (f) { return Array.isArray(f.questions) ? f.questions : []; }));
      D.questions.forEach(function (q) { D.q[q.id] = q; });
      files.forEach(function (f) {
        (Array.isArray(f.recaps) ? f.recaps : []).forEach(function (c) {
          if (c && D.reading[c.reading] && Array.isArray(c.ideas)) { D.recaps[c.reading] = c; D.recapList.push(c); }
        });
      });
    });
  }
  function coveredCount() {
    var c = Store.state.coverage;
    return Object.keys(c).filter(function (k) { return D.reading[k]; }).length;
  }

  /* =====================================================================
     Router: #/name or #/name/arg. One render function per screen.
     ===================================================================== */
  var Router = {
    routes: {},
    register: function (name, fn) { this.routes[name] = fn; },
    parse: function () {
      var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
      return { name: parts[0] || '', args: parts.slice(1) };
    },
    go: function (path, replace) {
      if (replace) { history.replaceState(null, '', '#/' + path); this.render(); }
      else if (location.hash === '#/' + path) this.render();
      else location.hash = '#/' + path;
    },
    render: function () {
      var p = this.parse(), name = p.name;
      if (!Store.state.onboarded && name !== 'coverage' && name !== 'settings') name = 'coverage';
      else if (!this.routes[name]) name = 'home';
      // Left a session another way (iOS swipe-back, Back button): still count what was done.
      if (name !== 'session' && Session.cur) { Session.record(); Session.cur = null; }
      if (name !== 'recap' && Recap.cur) { Recap.record(); Recap.cur = null; }
      var root = el('screen');
      var fresh = root.cloneNode(false);        // new node restarts the fade-in animation
      root.parentNode.replaceChild(fresh, root);
      this.routes[name](fresh, p.args);
    }
  };

  /* =====================================================================
     Shared UI pieces
     ===================================================================== */
  function screenFrame(root, body, bar) {
    var scroll = h('div', { class: 'scroll' }, body);
    root.appendChild(scroll);
    if (bar) root.appendChild(bar);
    return scroll;
  }
  function streakChip() {
    var n = Sched.streak(Store.state, today());
    if (!n) return null;
    return h('div', { class: 'streak', 'aria-label': n + '-day streak' }, icon('flame'), plural(n, 'day', 'days'));
  }
  function greeting() {
    var hr = new Date().getHours();
    return hr < 5 ? 'Up late' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  }
  // Soft colour wash behind the top of a screen (home, results).
  function glow() { return h('div', { class: 'glow', 'aria-hidden': 'true' }); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  var PRAISE = ['Correct', 'Spot on', 'Nailed it', 'Exactly right', 'Yes!', 'Well done', 'Right on', 'Correct'];

  /* ---------- Momentum: levels, daily goal ring, celebrations ---------- */
  function levelFloor(L) { return 50 * L * (L - 1); }   // XP needed to reach level L: 0, 100, 300, 600, 1000...
  function levelOf(xp) { var L = 1; while (xp >= levelFloor(L + 1)) L++; return L; }
  function levelName(L) { return LEVELS[Math.min(L, LEVELS.length) - 1]; }
  function answeredOn(day) {
    return Store.state.sessions.reduce(function (t, x) { return t + (x.date === day && x.right !== null && typeof x.n === 'number' ? x.n : 0); }, 0);
  }
  function answeredEver() {
    return Store.state.sessions.reduce(function (t, x) { return t + (x.right !== null && typeof x.n === 'number' ? x.n : 0); }, 0);
  }
  function reducedMotion() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function levelBar(xp) {
    var L = levelOf(xp), lo = levelFloor(L), hi = levelFloor(L + 1);
    return h('div', { class: 'lvl' },
      h('div', { class: 'lvl-top' }, h('b', { text: 'Level ' + L + ' · ' + levelName(L) }), h('span', { class: 'lvl-to', text: (hi - xp) + ' XP to level ' + (L + 1) })),
      h('div', { class: 'lvl-track', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round((xp - lo) / (hi - lo) * 100) + '%' })));
  }
  function goalRing(n) {
    var C = 2 * Math.PI * 26, f = Math.min(1, n / GOAL);
    var w = h('div', { class: 'ring' + (f >= 1 ? ' done' : ''), role: 'img', 'aria-label': n + ' of ' + GOAL + ' questions today' });
    w.innerHTML = '<svg viewBox="0 0 64 64"><circle class="ring-bg" cx="32" cy="32" r="26"/><circle class="ring-fg" cx="32" cy="32" r="26" stroke-dasharray="' +
      C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - f)).toFixed(1) + '" transform="rotate(-90 32 32)"/></svg>';
    w.appendChild(h('span', { class: 'ring-n' }, f >= 1 ? icon('tick') : String(n), f >= 1 ? null : h('small', { text: '/' + GOAL })));
    return w;
  }
  function momentumCard() {
    var st = Store.state, t = today(), n = answeredOn(t), left = Math.max(0, GOAL - n);
    var streakN = Sched.streak(st, t), doneToday = st.sessions.some(function (x) { return x.date === t; });
    var msg = !left ? 'Today’s goal done. Anything more is a bonus.'
      : streakN && !doneToday ? 'Practise today to keep your ' + streakN + '-day streak going.'
      : n ? left + ' more to today’s goal of ' + GOAL + '.'
      : 'Today’s goal: ' + GOAL + ' questions.';
    return h('div', { class: 'momentum' }, goalRing(n), h('div', { class: 'mo-body' }, levelBar(st.xp || 0), h('p', { class: 'mo-msg', text: msg })));
  }
  // Home hero: the countdown, today's goal ring, level and one line of what to do next.
  function heroCard() {
    var d = Sched.daysBetween(today(), D.curriculum.examDate);
    var dateText = new Date(D.curriculum.examDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    var count = d > 0
      ? h('div', { class: 'hc-count' }, h('span', { class: 'hc-n', text: String(d) }),
          h('span', { class: 'hc-l' }, d === 1 ? 'day to go' : 'days to go', h('small', { text: 'Exam ' + dateText })))
      : h('div', { class: 'hc-count' }, h('span', { class: 'hc-l big', text: daysToExamText() }));
    if (!coveredCount()) return h('div', { class: 'hero-card' }, h('div', { class: 'hc-top' }, count));
    var m = momentumCard();
    return h('div', { class: 'hero-card' },
      h('div', { class: 'hc-top' }, count, m.querySelector('.ring')),
      m.querySelector('.mo-body'));
  }
  // Confetti from the top of the screen. Skipped when the phone asks for reduced motion.
  function burst(n) {
    if (reducedMotion()) return;
    var colors = ['#4553d6', '#f5b301', '#2fb36d', '#ff6b6b', '#8a5cff', '#22b8cf'];
    var layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (var i = 0; i < n; i++) {
      var p = h('i');
      p.style.cssText = 'left:' + (4 + Math.random() * 92).toFixed(1) + '%;background:' + colors[i % colors.length] +
        ';--dx:' + ((Math.random() - 0.5) * 180).toFixed(0) + 'px;--rot:' + (Math.random() * 900 - 450).toFixed(0) + 'deg' +
        ';animation-delay:' + (Math.random() * 0.3).toFixed(2) + 's;animation-duration:' + (1.2 + Math.random() * 0.9).toFixed(2) + 's';
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 2800);
  }
  function countUp(node, to) {
    if (reducedMotion() || to <= 0) { node.textContent = '+' + to; return; }
    var t0 = null;
    function f(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 800); node.textContent = '+' + Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }
    node.textContent = '+0'; requestAnimationFrame(f);
    setTimeout(function () { node.textContent = '+' + to; }, 1000); // in case frames are paused
  }

  /* =====================================================================
     Screen: Coverage
     ===================================================================== */
  var covOpen = {};   // topic ids currently expanded (kept across re-renders)

  function renderCoverage(root) {
    var st = Store.state;
    var onboarded = st.onboarded;
    var list = h('div');
    var startBtn = h('button', { class: 'btn btn-primary', text: "Start today's 15", onclick: start });
    var hint = h('div', { class: 'hint' });

    var head = h('div', { class: 'cov-head' + (onboarded ? '' : ' no-back') },
      onboarded ? h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: function () { history.length > 1 ? history.back() : Router.go('home'); } }, icon('back')) : null,
      h('div', null, h('h1', { class: 'title', text: 'What have you covered so far?' }),
        h('p', { class: 'subtitle', text: "Questions only come from what you tick. You can change this any time." })));

    var scroll = screenFrame(root, [head, list], h('div', { class: 'bar' }, startBtn, hint));

    function topicState(t) {
      var n = t.readings.filter(function (r) { return st.coverage[r.id]; }).length;
      return { n: n, all: n === t.readings.length };
    }
    function setReading(id, on) {
      if (on) { if (!st.coverage[id]) st.coverage[id] = today(); } else delete st.coverage[id];
    }
    function draw() {
      var top = scroll.scrollTop;
      list.innerHTML = '';
      D.curriculum.topics.forEach(function (t) {
        var ts = topicState(t);
        var open = !!covOpen[t.id];
        var wholeState = ts.all ? 'true' : (ts.n ? 'mixed' : 'false');
        var whole = h('button', { class: 'whole', role: 'switch', 'aria-checked': wholeState, 'aria-label': 'Whole topic: ' + t.name,
          onclick: function () {
            var turnOn = !ts.all;
            t.readings.forEach(function (r) { setReading(r.id, turnOn); });
            Store.save(); draw();
          } }, h('span', { class: 'switch' }), h('span', { class: 'cap', text: 'Whole topic' }));
        var main = h('button', { class: 'topic-main', 'aria-expanded': String(open),
          onclick: function () { covOpen[t.id] = !covOpen[t.id]; draw(); } },
          h('div', { style: 'flex:1;min-width:0' },
            h('div', { class: 'topic-name', text: t.name }),
            h('div', { class: 'topic-meta' }, t.weightMin + '–' + t.weightMax + '% of exam',
              ts.n ? [' · ', h('b', { text: ts.n + ' of ' + t.readings.length })] : null)),
          h('span', { class: 'chev' }, icon('chev')));
        var box = h('section', { class: 'topic' + (open ? ' open' : ''), 'data-t': t.id }, h('div', { class: 'topic-row' }, main, whole));
        if (open) {
          box.appendChild(h('div', { class: 'readings' }, t.readings.map(function (r) {
            var on = !!st.coverage[r.id];
            return h('button', { class: 'reading', role: 'checkbox', 'aria-checked': String(on),
              onclick: function () { setReading(r.id, !on); Store.save(); draw(); } },
              h('span', { class: 'check' }, icon('tick')),
              h('span', { style: 'flex:1;min-width:0' },
                h('div', { class: 'reading-short', text: r.short }),
                h('div', { class: 'reading-title', text: r.title })));
          })));
        }
        list.appendChild(box);
      });
      var n = coveredCount();
      startBtn.disabled = n === 0;
      hint.textContent = n === 0 ? 'Tick at least one reading' : plural(n, 'reading', 'readings') + ' ticked';
      scroll.scrollTop = top;
    }
    function start() {
      st.onboarded = true; Store.save();
      if (!Session.start('daily')) Router.go('home', true);
    }
    draw();
  }

  /* =====================================================================
     Reading status (shared by Home strip and the map)
     none = not covered | untested = covered, under 3 attempts | shaky | solid
     ===================================================================== */
  function readingStatus(rid, stats) {
    var st = Store.state;
    if (!st.coverage[rid]) return 'none';
    var s = stats[rid] || { attempts: 0, acc: 0.5 };
    var r = st.recap && st.recap[rid];
    var markedShaky = !!r && r.mark === 'shaky' && Sched.daysBetween(r.last, today()) <= 7;
    if (markedShaky || (s.attempts >= 3 && s.acc < 0.7)) return 'shaky';
    if (s.attempts >= 3) return 'solid';
    return 'untested';
  }
  function mapCounts() {
    var stats = Sched.readingStats(D.questions, Store.state);
    var c = { covered: 0, solid: 0, shaky: 0, untested: 0, none: 0 };
    Object.keys(D.reading).forEach(function (rid) {
      var s = readingStatus(rid, stats);
      c[s]++;
      if (s !== 'none') c.covered++;
    });
    return c;
  }

  /* =====================================================================
     Bottom sheet (reading recap, map cell). build(api) fills it via api.set(body, foot).
     ===================================================================== */
  function openSheet(build) {
    var root = el('modal-root');
    var body = h('div', { class: 'sheet-body' }), foot = h('div', { class: 'sheet-foot' });
    function onKey(e) { if (e.key === 'Escape') close(); }
    function close() { root.innerHTML = ''; document.removeEventListener('keydown', onKey); }
    var x = h('button', { class: 'icon-btn sheet-x', 'aria-label': 'Close', onclick: close }, icon('close'));
    var box = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, x, body, foot);
    var scrim = h('div', { class: 'scrim', onclick: function (e) { if (e.target === scrim) close(); } }, box);
    var api = {
      close: close,
      set: function (b, f) { body.innerHTML = ''; foot.innerHTML = ''; add(body, b); add(foot, f); body.scrollTop = 0; }
    };
    root.innerHTML = ''; root.appendChild(scrim);
    document.addEventListener('keydown', onKey);
    build(api);
  }

  // The recap card itself: reading title, 3 ideas, formula (if any), trap.
  function recapBody(rid, withTitle) {
    var info = D.reading[rid], c = D.recaps[rid];
    return [
      withTitle === false ? null : [h('div', { class: 'eyebrow', text: info.topic.name }), h('h2', { class: 'sheet-title', text: info.reading.title })],
      h('ol', { class: 'ideas' }, c.ideas.map(function (t, i) {
        return h('li', null, h('span', { class: 'n', text: String(i + 1) }), h('span', { text: t }));
      })),
      c.formula ? h('div', { class: 'formula' }, h('div', { class: 'eyebrow', text: 'Formula' }), h('div', { class: 'f', text: c.formula })) : null,
      c.trap ? h('div', { class: 'trap' }, h('b', { text: 'Classic trap: ' }), c.trap) : null
    ];
  }
  function openRecapSheet(rid) {
    openSheet(function (sh) {
      sh.set(recapBody(rid), h('button', { class: 'btn btn-quiet', text: 'Close', onclick: sh.close }));
    });
  }

  /* =====================================================================
     Screen: Home
     ===================================================================== */
  function daysToExamText() {
    var n = Sched.daysBetween(today(), D.curriculum.examDate);
    if (n > 1) return n + ' days to the exam';
    if (n === 1) return '1 day to the exam';
    if (n === 0) return 'Exam day. You are ready for this.';
    return 'The exam date has passed';
  }
  function modePool(mode) {
    var st = Store.state;
    if (mode === 'weak' && !Sched.weakReadings(D.questions, st, true).length) return 0;
    return Sched.buildSession({ questions: D.questions, curriculum: D.curriculum, state: st, today: today(), mode: mode }).ids.length;
  }
  function recapDeck() {
    return Sched.buildRecapDeck({ recaps: D.recapList, state: Store.state, curriculum: D.curriculum, questions: D.questions, today: today(), size: 10 });
  }

  var MODE_CARDS = {
    recap: { note: 'One minute per reading: the key ideas, the formula, the classic trap. Tap Shaky and its questions come back sooner.', empty: 'Tick some readings first' },
    remember: { note: "Facts the exam asks directly: rules, lists, thresholds. You can't reason your way to these; learn them cold.", empty: 'No must-remember questions in what you’ve covered yet' },
    calc: { note: "Formula drills with easy numbers. On exam day you'll have your calculator; this trains knowing which formula and which number goes where.", empty: 'No formula questions in what you’ve covered yet' },
    weak: { note: 'Only your 3 weakest readings, until they aren’t.', empty: 'Answer a few more first' },
    exam: { note: '10 exam-style questions at real pace, 90 seconds each. Answers at the end, like the real thing.', empty: 'No questions in what you’ve covered yet' },
    sheet: { note: 'Every formula and must-remember fact from what you’ve covered, answers hidden. Say it, then tap. Three minutes, anywhere.', empty: 'Tick some readings first' }
  };
  var MODE_ORDER = ['recap', 'remember', 'calc', 'sheet', 'weak', 'exam'];

  // One suggested step, driven by days to the exam. Returns { mode, text, week } (mode may be null).
  function suggestion(avail) {
    var st = Store.state, t = today();
    var d = Sched.daysBetween(t, D.curriculum.examDate);
    if (d < 0) return null;
    if (!coveredCount()) return { mode: null, text: 'Tick the readings you’ve finished in the books, and their questions start coming.' };
    if (d === 0) return { mode: 'sheet', text: 'Exam day. A quick sweep of the Formula sheet if you want a warm-up. Good luck, Ishita.', week: true };
    if (d === 1) return { mode: 'sheet', text: 'Tomorrow. Sweep the Formula sheet and Recap anything shaky, then stop. Nothing new tonight.', week: true };
    if (d <= 3) return { mode: 'exam', text: 'Exam week. Mix Today’s 15 with Exam practice; sweep Recap for anything shaky.', week: true };
    // Readings ticked in the last 3 days that have a card but no recap yet.
    var fresh = Object.keys(st.coverage).filter(function (r) {
      return D.recaps[r] && !(st.recap && st.recap[r]) && Sched.daysBetween(st.coverage[r], t) <= 3;
    });
    if (fresh.length && avail.recap) return { mode: 'recap', text: 'Recap the readings you just ticked: one minute each.' };
    var done = st.sessions.filter(function (x) { return typeof x.right === 'number' && x.n >= 5; });
    var lastDone = done[done.length - 1];
    if (lastDone && lastDone.right / lastDone.n < 0.6 && Sched.daysBetween(lastDone.date, t) <= 1 && avail.weak) {
      return { mode: 'weak', text: 'Last session was a tough one. Weak spots will firm up the readings that need it.' };
    }
    var rush = 0, tagged = 0;
    st.sessions.forEach(function (x) { if (x.errs && Sched.daysBetween(x.date, t) <= 7) { rush += x.errs.rush; tagged += x.errs.know + x.errs.mix + x.errs.rush; } });
    if (rush >= 3 && rush / tagged >= 0.4 && avail.exam) return { mode: 'exam', text: 'Lots of your recent misses were misreads. Exam practice trains careful reading at real pace.' };
    var recentExam = st.sessions.some(function (x) { return x.mode === 'exam' && Sched.daysBetween(x.date, t) <= 7; });
    if (d <= 14 && !recentExam && avail.exam) return { mode: 'exam', text: 'Try Exam practice once this week to feel the pace.' };
    return { mode: null, text: 'Start with Today’s 15. It picks what needs you most.' };
  }

  function renderHome(root) {
    var st = Store.state;
    var avail = {
      recap: recapDeck().length > 0,
      remember: modePool('remember') > 0,
      calc: modePool('calc') > 0,
      weak: modePool('weak') > 0,
      exam: modePool('exam') > 0,
      sheet: Object.keys(sheetLines(false)).length > 0
    };
    var sug = suggestion(avail);
    var order = MODE_ORDER.slice();
    if (sug && sug.mode && avail[sug.mode]) order = [sug.mode].concat(order.filter(function (m) { return m !== sug.mode; }));

    var modes = h('div', { class: 'modes' }, order.map(function (m) {
      var c = MODE_CARDS[m], ok = avail[m];
      var tagged = !!(sug && sug.mode === m && ok);
      return h('button', { class: 'mode' + (tagged ? ' suggested' : ''), 'data-m': m, 'aria-disabled': ok ? null : 'true',
        onclick: function () { if (!ok) return; if (m === 'recap') Recap.start(); else if (m === 'sheet') Router.go('sheet'); else Session.start(m); } },
        h('span', { class: 'mode-ic' }, icon(m)),
        h('span', { class: 'mode-main' },
          h('div', { class: 'mode-head' }, h('div', { class: 'mode-name', text: NAMES[m] }), tagged ? h('span', { class: 'tag', text: 'Suggested' }) : null),
          h('div', { class: 'mode-note', text: c.note }),
          ok ? null : h('div', { class: 'mode-reason', text: c.empty })));
    }));

    var mc = mapCounts();
    var strip = h('button', { class: 'map-strip', onclick: function () { Router.go('map'); } },
      h('div', { class: 'ms-text' },
        h('div', { text: mc.covered + ' of ' + D.readingCount + ' covered' }),
        h('div', { class: 'ms-sub' },
          h('span', { class: 'ms-i' }, h('span', { class: 'sw solid' }), mc.solid + ' solid'),
          h('span', { class: 'ms-i' }, h('span', { class: 'sw shaky' }), mc.shaky + ' shaky'),
          h('span', { class: 'ms-i' }, h('span', { class: 'sw untested' }), mc.untested + ' untested'))),
      h('span', { class: 'ms-link' }, 'Your map', icon('chev')));
    var nx = readNext(1)[0];
    var standStrip = h('button', { class: 'map-strip', onclick: function () { Router.go('standing'); } },
      h('div', { class: 'ms-text' },
        h('div', { text: weightCovered() + '% of the exam covered, by weight' }),
        h('div', { class: 'ms-sub', text: nx ? 'Read next: ' + nx.t.name + ' R' + nx.r.n : 'Everything ticked. Now make it stick.' })),
      h('span', { class: 'ms-link', 'aria-label': 'Where you stand' }, icon('chev')));

    var nudges = [];
    if (st.sessions.length >= 5 && !st.nudge.export) {
      nudges.push(h('div', { class: 'nudge' },
        h('p', { text: 'Save a progress file in Settings, in case Safari clears it.' }),
        h('div', { class: 'nudge-btns' },
          h('button', { class: 'btn-link', text: 'Open Settings', onclick: function () { st.nudge.export = true; Store.save(); Router.go('settings'); } }),
          h('button', { class: 'btn-link muted', text: 'Not now', onclick: function () { st.nudge.export = true; Store.save(); Router.render(); } }))));
    }
    var body = [
      glow(),
      h('div', { class: 'home-top' },
        h('div', null, h('p', { class: 'greet', text: greeting() + ',' }), h('h1', { class: 'hello', text: 'Ishita' })),
        h('div', { class: 'home-actions' }, streakChip(),
          h('button', { class: 'icon-btn', 'aria-label': 'Settings', onclick: function () { Router.go('settings'); } }, icon('gear')))),
      heroCard(),
      h('div', { class: 'cover-row' },
        h('span', { text: coveredCount() + ' of ' + D.readingCount + ' readings' }),
        h('button', { class: 'btn-link', text: 'Tick new readings', onclick: function () { Router.go('coverage'); } })),
      sug ? h('div', { class: 'suggest' + (sug.week ? ' week' : '') }, h('div', { class: 'eyebrow', text: 'Suggested' }), h('p', { text: sug.text })) : null,
      nudges,
      modes,
      h('div', { class: 'strips' }, strip, standStrip)
    ];
    var bar = h('div', { class: 'bar hero' },
      h('button', { class: 'btn btn-primary', text: NAMES.daily, onclick: function () { Session.start('daily'); } }),
      h('p', { class: 'note', text: 'Your daily mix. Mistakes come back next session; what you know well fades out.' }));
    screenFrame(root, body, bar);
  }

  /* =====================================================================
     Session (state + screen)
     ===================================================================== */
  var Session = {
    cur: null,       // {mode, opts, ids, i, answers[], picked, recorded}
    last: null,      // summary shown on the Result screen
    EMPTY: {
      daily: 'No questions available for what you’ve covered yet.',
      calc: 'No formula questions in what you’ve covered yet.',
      remember: 'No must-remember questions in what you’ve covered yet.',
      weak: 'Answer a few more questions first.',
      exam: 'No questions available yet.'
    },
    start: function (mode, opts) {
      opts = opts || {};
      // opts.ids: a fixed list (Retry the ones I missed); otherwise the scheduler picks.
      var ids = opts.ids ? opts.ids.filter(function (id) { return D.q[id]; })
        : Sched.buildSession({ questions: D.questions, curriculum: D.curriculum, state: Store.state, today: today(), mode: mode, readings: opts.readings, size: opts.size }).ids;
      if (!ids.length) { notice(this.EMPTY[mode] || this.EMPTY.daily); return false; }
      var st = Store.state;
      this.cur = { mode: mode, opts: opts, ids: ids, i: 0, answers: [], picked: null, recorded: false,
        combo: 0, run: 0, xp: 0, finished: false, startXp: st.xp || 0, startToday: answeredOn(today()), startEver: answeredEver(), startBest: st.bestRun || 0 };
      Router.go('session');
      return true;
    },
    // Grade one answer and save straight away: quitting mid-session loses nothing.
    // The question's earlier state is kept so "Lucky guess" can re-grade it.
    answer: function (pick) {
      var c = this.cur, q = D.q[c.ids[c.i]], st = Store.state;
      var correct = pick === q.answer;
      var prev = st.q[q.id];
      st.q[q.id] = Sched.grade(prev, correct, today());
      c.combo = correct ? c.combo + 1 : 0;
      c.run = Math.max(c.run, c.combo);
      var lucky = correct && Math.random() < LUCKY_CHANCE;
      var gain = correct ? XP.right + Math.min(10, Math.max(0, c.combo - 2) * 2) : XP.wrong;
      if (lucky) gain *= 2;
      c.xp += gain; st.xp = (st.xp || 0) + gain;
      if (c.run > (st.bestRun || 0)) st.bestRun = c.run;
      Store.save();
      c.picked = pick;
      c.answers.push({ id: q.id, pick: pick, correct: correct, guess: false, prev: prev, xp: gain, lucky: lucky, combo: c.combo });
    },
    // Lucky guess on the answer just given: scheduled as a miss, still counted right in the score. Tap again to undo.
    toggleGuess: function () {
      var c = this.cur, a = c && c.answers[c.answers.length - 1], st = Store.state;
      if (!a || !a.correct) return false;
      a.guess = !a.guess;
      st.q[a.id] = Sched.grade(a.prev, !a.guess, today());
      Store.save();
      return a.guess;
    },
    // Optional reason for the miss just given: know | mix | rush. Tap the same one again to clear.
    tagMiss: function (tag) {
      var c = this.cur, a = c && c.answers[c.answers.length - 1];
      if (!a || a.correct) return null;
      a.err = a.err === tag ? null : tag;
      return a.err;
    },
    // Add the session record (once). Called at the end, or on quit if anything was answered.
    record: function () {
      var c = this.cur, st = Store.state;
      if (!c || c.recorded || !c.answers.length) return;
      c.recorded = true;
      var right = c.answers.filter(function (a) { return a.correct; }).length;
      var rec = { date: today(), mode: c.mode, n: c.answers.length, right: right, xp: c.xp };
      var errs = errCounts(c.answers);
      if (errs.total) rec.errs = { know: errs.know, mix: errs.mix, rush: errs.rush };
      st.sessions.push(rec);
      st.lastSessionDate = today();
      Store.save();
      this.last = { mode: c.mode, opts: c.opts, n: c.answers.length, right: right, answers: c.answers.slice(),
        xp: c.xp, finished: c.finished, run: c.run, startXp: c.startXp, startToday: c.startToday, startEver: c.startEver, startBest: c.startBest };
    },
    next: function () {
      var c = this.cur;
      if (c.i + 1 >= c.ids.length) {
        c.finished = true; c.xp += XP.finish; Store.state.xp = (Store.state.xp || 0) + XP.finish;
        this.record(); this.cur = null; Router.go('result', true); return;
      }
      c.i++; c.picked = null; Router.render();
    },
    quit: function () {
      var self = this, c = this.cur;
      var left = c.ids.length - c.answers.length;
      if (left <= 0) { this.next(); return; }   // last one answered: just show the results
      var title = c.answers.length && left <= 5 ? (left === 1 ? 'Just 1 to go' : 'Only ' + left + ' to go') : 'Stop here?';
      var body = c.answers.length
        ? 'Finish the round for +' + XP.finish + ' XP' + (c.combo >= 2 ? ' and keep your ' + c.combo + '-in-a-row run' : '') + '. Your answers so far are saved either way.'
        : 'Nothing answered yet.';
      stayDialog(title, body, 'Keep going', 'Stop for now').then(function (leave) {
        if (!leave) return;
        self.record(); self.cur = null; self.last = null; Router.go('home', true);
      });
    }
  };

  var ERR_TAGS = [['know', 'Didn’t know it'], ['mix', 'Mixed two things up'], ['rush', 'Misread or rushed']];
  var ERR_ADVICE = {
    know: 'Most misses were things you didn’t know yet. Recap those readings; the questions come back next session.',
    mix: 'Most misses were mix-ups. The trap line on each Recap card is written for exactly this.',
    rush: 'Most misses were misreads. Read the last line of the question first, then the options. You have 90 seconds each.'
  };
  function errCounts(answers) {
    var c = { know: 0, mix: 0, rush: 0, total: 0 };
    answers.forEach(function (a) { if (!a.correct && a.err && c[a.err] !== undefined) { c[a.err]++; c.total++; } });
    return c;
  }
  // Wrong-answer screen: optional one-tap reason. Updates in place.
  function missControl() {
    var chips = ERR_TAGS.map(function (t) {
      return h('button', { class: 'btn-small chip', 'aria-pressed': 'false', text: t[1], onclick: function () {
        var cur = Session.tagMiss(t[0]);
        chips.forEach(function (b, i) { var on = ERR_TAGS[i][0] === cur; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on)); });
      } });
    });
    return h('div', { class: 'miss-why' }, h('div', { class: 'eyebrow', text: 'Why did you miss it? Optional' }), h('div', { class: 'chips' }, chips));
  }

  function optionEl(letter, text, cls, tag, onclick) {
    var inner = [h('span', { class: 'opt-key', text: letter }),
      h('span', { class: 'opt-body' }, tag ? h('span', { class: 'opt-tag', text: tag }) : null, h('span', { class: 'opt-text', text: text }))];
    var attrs = { class: 'opt' + (cls ? ' ' + cls : '') };
    if (onclick) { attrs.onclick = onclick; return h('button', attrs, inner); }
    return h('div', attrs, inner);
  }

  // Small secondary button on the right-answer screen. Updates in place so the screen doesn't jump.
  function luckyControl() {
    var marked = false;
    var btn = h('button', { class: 'btn-small', onclick: function () { marked = Session.toggleGuess(); paint(); } });
    var hint = h('p', { class: 'lucky-hint' });
    function paint() {
      btn.textContent = marked ? 'Marked as a lucky guess' : 'Lucky guess';
      btn.setAttribute('aria-pressed', String(marked));
      btn.classList.toggle('on', marked);
      hint.textContent = marked ? 'It comes back next session. Tap again to undo.' : 'Guessed? Tap and it comes back next session.';
    }
    paint();
    return h('div', { class: 'lucky' }, btn, hint);
  }

  function renderSession(root) {
    var c = Session.cur;
    if (!c) { Router.go('home', true); return; }
    var q = D.q[c.ids[c.i]];
    var info = D.reading[q.reading];
    var exam = c.mode === 'exam';
    var answered = c.picked !== null;
    var done = c.i + (answered ? 1 : 0);

    var head = h('div', { class: 's-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Stop', onclick: function () { Session.quit(); } }, icon('close')),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(c.ids.length), 'aria-valuenow': String(done) },
        h('i', { style: 'width:' + Math.round(done / c.ids.length * 100) + '%' })),
      h('div', { class: 'count', text: (c.i + 1) + ' / ' + c.ids.length }));
    root.appendChild(head);
    // Exam practice: a calm pace bar. It only shows time; it never locks or skips anything.
    if (exam) root.appendChild(h('div', { class: 'pace', 'aria-hidden': 'true', title: PACE_SECONDS + ' seconds per question' }, h('i', { style: 'animation-duration:' + PACE_SECONDS + 's' })));

    var label = exam ? 'Exam practice · ' + PACE_SECONDS + ' seconds each' : (info ? info.topic.short + ' · ' + info.reading.short : '');
    var top = [h('div', { class: 's-label', 'data-t': exam || !info ? null : info.topic.id, text: label }), h('p', { class: 'stem', text: q.stem })];

    if (!answered) {
      var opts = h('div', { class: 'options at-bottom', role: 'group', 'aria-label': 'Answer options' },
        q.options.map(function (t, i) {
          return optionEl(LETTERS[i], t, '', null, function () {
            Session.answer(i);
            if (exam) Session.next();       // no feedback until the end
            else Router.render();
          });
        }));
      var scroll = h('div', { class: 'scroll s-body' }, top, opts);
      scroll.style.paddingTop = '14px';
      scroll.style.paddingBottom = 'calc(14px + env(safe-area-inset-bottom))';
      root.appendChild(scroll);
      return;
    }

    var correct = c.picked === q.answer;
    var a = c.answers[c.answers.length - 1] || {};
    var fresh = !c.shown || c.shown !== c.answers.length;   // celebrate once per answer, not on every re-render
    c.shown = c.answers.length;
    if (fresh) {
      if (c.startToday < GOAL && c.startToday + c.answers.length === GOAL) { notice('Daily goal reached: ' + GOAL + ' questions today!'); burst(70); }
      else if (correct && (a.combo === 5 || a.combo === 10 || a.combo === 15)) burst(40);
    }
    var optsFb = h('div', { class: 'options' }, q.options.map(function (t, i) {
      if (i === q.answer) return optionEl(LETTERS[i], t, 'right', correct ? null : 'Correct answer');
      if (i === c.picked) return optionEl(LETTERS[i], t, 'wrong', 'Your answer');
      return optionEl(LETTERS[i], t, 'dim');
    }));

    var lo = D.lo[q.los];
    var tests = lo ? h('p', { class: 'tests' }, h('b', { text: 'Tests: ' }), lo.text) : null;
    var extras = h('div', { class: 'feedback-extras' });
    var remember = q.remember ? h('div', { class: 'remember' }, h('b', { text: 'Remember: ' }), q.remember) : null;
    var fb;
    if (correct) {
      extras.appendChild(luckyControl());
      fb = h('div', { class: 'fb' },
        h('div', { class: 'verdict' + (fresh ? ' pop' : '') }, icon('tickCircle'), a.praise || (a.praise = pick(PRAISE)),
          h('span', { class: 'xp-chip' + (a.lucky ? ' lucky' : ''), text: '+' + a.xp + ' XP' + (a.lucky ? ' · 2× bonus' : '') }),
          a.combo >= 3 ? h('span', { class: 'combo', text: '🔥 ' + a.combo + ' in a row' }) : null),
        h('p', { class: 'plain-expl', text: q.explanation }), extras, tests, remember);
    } else {
      if (D.recaps[q.reading]) {
        extras.appendChild(h('button', { class: 'btn-small', text: 'Recap this reading', onclick: function () { openRecapSheet(q.reading); } }));
      }
      fb = h('div', { class: 'fb' },
        h('div', { class: 'why' }, h('div', { class: 'eyebrow', text: 'Not quite. Here’s why' }), h('p', { text: q.explanation })),
        extras, tests, remember, missControl(),
        h('p', { class: 'calm', text: 'This one comes back next session. +' + (a.xp || XP.wrong) + ' XP for the attempt.' }));
    }
    var last = c.i + 1 >= c.ids.length;
    var bar = h('div', { class: 'bar' }, h('button', { class: 'btn btn-primary', text: last ? 'See results' : 'Next', onclick: function () { Session.next(); } }));
    var sc = h('div', { class: 'scroll s-body' }, top, optsFb, fb);
    sc.style.paddingTop = '14px';
    root.appendChild(sc); root.appendChild(bar);
    sc.scrollTop = 0;
  }

  /* =====================================================================
     Screen: Result
     ===================================================================== */
  // One expandable question row: used for "missed" lists and the full exam review.
  function reviewItem(a, showStatus) {
    var q = D.q[a.id], info = D.reading[q.reading], lo = D.lo[q.los];
    var box = h('div', { class: 'miss' });
    var ans = a.correct
      ? h('p', { class: 'ans' }, 'You chose the right answer: ', h('b', { text: LETTERS[q.answer] + '. ' + q.options[q.answer] }))
      : h('p', { class: 'ans' }, 'Correct answer: ', h('b', { text: LETTERS[q.answer] + '. ' + q.options[q.answer] }), h('br'),
          'You chose: ', h('s', { text: LETTERS[a.pick] + '. ' + q.options[a.pick] }));
    var detail = h('div', { class: 'miss-detail' }, ans,
      h('p', { class: 'ex', text: q.explanation }),
      lo ? h('p', { class: 'tests' }, h('b', { text: 'Tests: ' }), lo.text) : null,
      q.remember ? h('div', { class: 'remember' }, h('b', { text: 'Remember: ' }), q.remember) : null);
    detail.hidden = true;
    var head = h('button', { class: 'miss-head', 'aria-expanded': 'false', onclick: function () {
      var open = detail.hidden; detail.hidden = !open; box.classList.toggle('open', open); head.setAttribute('aria-expanded', String(open));
    } }, h('div', { class: 't' },
      h('div', { class: 'l' }, info ? info.reading.short : '',
        showStatus ? h('span', { class: 'badge ' + (a.correct ? 'ok' : 'no'), text: a.correct ? 'Right' : 'Missed' }) : null),
      h('div', { class: 's', text: q.stem })),
      h('span', { class: 'chev' }, icon('chev')));
    box.appendChild(head); box.appendChild(detail);
    return box;
  }

  function resultTitle(r) {
    if (r.opts && r.opts.retry) return 'Retry round';
    if (r.opts && r.opts.bonus) return 'Bonus round';
    if (r.opts && r.opts.readings && r.opts.readings.length === 1 && D.reading[r.opts.readings[0]]) return 'Practice · ' + D.reading[r.opts.readings[0]].reading.short;
    return NAMES[r.mode] || 'Session';
  }

  function renderResult(root) {
    var r = Session.last;
    if (!r) { Router.go('home', true); return; }
    var exam = r.mode === 'exam';
    var missed = r.answers.filter(function (a) { return !a.correct; });
    var guesses = r.answers.filter(function (a) { return a.correct && a.guess; }).length;
    var streakN = Sched.streak(Store.state, today());
    var line = missed.length || guesses
      ? 'Wrong ones' + (guesses ? ' and lucky guesses' : '') + ' come back next session'
      : 'A clean round. Nothing to repeat.';
    // Momentum: XP this round, level-ups, records, milestones, daily goal.
    var xpNum = h('span', { class: 'xp-num', text: '+' + (r.xp || 0) });
    var xpRow = h('div', { class: 'xp-gain' }, xpNum, ' XP', r.finished ? h('span', { class: 'xp-note', text: ' incl. +' + XP.finish + ' for finishing' }) : null);
    var st = Store.state, lvBefore = levelOf(r.startXp || 0), lvNow = levelOf(st.xp || 0);
    var todayN = answeredOn(today()), goalLeft = Math.max(0, GOAL - todayN);
    var goalHit = (r.startToday || 0) < GOAL && todayN >= GOAL;
    var goalText = goalHit ? 'Daily goal done: ' + todayN + ' questions today.' : goalLeft ? todayN + ' of ' + GOAL + ' today. ' + goalLeft + ' more to hit your goal.' : todayN + ' questions today. Goal done; this is all bonus.';
    var wins = [];
    if (lvNow > lvBefore) wins.push(h('div', { class: 'win big' }, h('b', { text: 'Level up!' }), ' You’re now Level ' + lvNow + ': ' + levelName(lvNow) + '.'));
    if (r.run >= 3 && r.run > (r.startBest || 0)) wins.push(h('div', { class: 'win' }, h('b', { text: 'New record: ' }), r.run + ' right in a row.'));
    MILESTONES.forEach(function (m) { if ((r.startEver || 0) < m && (r.startEver || 0) + r.n >= m) wins.push(h('div', { class: 'win' }, h('b', { text: 'Milestone: ' }), m + ' questions answered.')); });
    wins.push(levelBar(st.xp || 0));
    if (!r.celebrated) {
      r.celebrated = true;
      setTimeout(function () { countUp(xpNum, r.xp || 0); }, 150);
      if (lvNow > lvBefore || goalHit || (!missed.length && r.n >= 5)) burst(90);
      else if (r.finished) burst(30);
    }
    var pct = r.n ? r.right / r.n : 0;
    var headline = pct === 1 ? 'Flawless!' : pct >= 0.8 ? 'Brilliant round' : pct >= 0.6 ? 'Solid work' : pct >= 0.4 ? 'Good effort' : 'Tough one. That’s how it sticks.';
    var body = [
      glow(),
      h('div', { class: 'score-card' + (pct >= 0.8 ? ' great' : '') },
        h('div', { class: 'eyebrow', text: resultTitle(r) }),
        h('h1', { class: 'headline', text: headline }),
        h('div', { class: 'score' }, r.right + ' ', h('small', { text: '/ ' + r.n })),
        h('div', { class: 'score-track', 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(r.right / r.n * 100) + '%' })),
        h('p', { class: 'result-line', text: line }),
        xpRow),
      wins.length ? h('div', { class: 'wins' }, wins) : null,
      h('div', { class: 'goal-row' }, goalRing(todayN), h('p', { text: goalText })),
      (function () {
        var e = errCounts(r.answers), top = null;
        ['know', 'mix', 'rush'].forEach(function (k) { if (e[k] && (!top || e[k] > e[top])) top = k; });
        return top && e.total >= 2 ? h('p', { class: 'err-line', text: ERR_ADVICE[top] }) : null;
      })(),
      streakN ? h('div', null, streakChip(), streakN >= 3 ? h('span', { class: 'muted small', style: 'margin-left:10px', text: 'Nice streak!' }) : null) : null
    ];
    if (exam) {
      body.push(h('div', { class: 'missed' }, h('div', { class: 'eyebrow', text: 'Every question' }),
        r.answers.map(function (a) { return reviewItem(a, true); })));
    } else if (missed.length) {
      body.push(h('div', { class: 'missed' }, h('div', { class: 'eyebrow', text: 'To look at again' }),
        missed.map(function (a) { return reviewItem(a, false); })));
    } else {
      body.push(h('div', { class: 'perfect', text: 'Everything you answered was right. These will show up less often now.' }));
    }
    // Keep the momentum: a short 5-question round is the default next step; misses can be retried right away.
    var moreOpts = { size: 5, bonus: true };
    if (r.opts && r.opts.readings) moreOpts.readings = r.opts.readings;
    var moreMode = r.opts && r.opts.retry ? 'daily' : r.mode;
    var more = h('button', { class: 'btn btn-primary', onclick: function () { Session.start(moreMode, moreOpts); } },
      goalLeft && goalLeft <= 5 ? 'Hit today’s goal · ' + goalLeft + ' more' : 'Keep going · 5 more');
    var retry = missed.length ? h('button', { class: 'btn btn-quiet', text: 'Retry ' + missed.length + ' missed',
      onclick: function () { Session.start('daily', { ids: missed.map(function (a) { return a.id; }), retry: true }); } }) : null;
    var bar = h('div', { class: 'bar' }, more,
      h('div', { class: 'btn-row' }, retry,
        h('button', { class: 'btn btn-quiet', text: 'Done', onclick: function () { Session.last = null; Router.go('home', true); } })));
    screenFrame(root, body, bar);
  }

  /* =====================================================================
     Recap mode: a deck of recap cards, Solid or Shaky on each
     ===================================================================== */
  var Recap = {
    cur: null,   // {ids, i, marks[], recorded}
    start: function () {
      var ids = recapDeck();
      if (!ids.length) { notice('No recap cards for what you’ve covered yet.'); return false; }
      this.cur = { ids: ids, i: 0, marks: [], recorded: false, finished: false };
      Router.go('recap');
      return true;
    },
    mark: function (mark) {
      var c = this.cur, st = Store.state, rid = c.ids[c.i];
      st.recap[rid] = { last: today(), mark: mark };
      st.xp = (st.xp || 0) + XP.recap;
      c.marks.push(mark);
      Store.save();
      c.i++;
      if (c.i >= c.ids.length) { this.record(); c.finished = true; }
      Router.render();
    },
    // Counts towards the streak; right is null because nothing was scored. Nothing else is touched.
    record: function () {
      var c = this.cur, st = Store.state;
      if (!c || c.recorded || !c.marks.length) return;
      c.recorded = true;
      st.sessions.push({ date: today(), mode: 'recap', n: c.marks.length, right: null });
      Store.save();
    },
    quit: function () {
      var self = this;
      confirmDialog('Stop here?', 'Cards so far are saved.', 'Stop and go home', 'Keep going').then(function (yes) {
        if (!yes) return;
        self.record(); self.cur = null; Router.go('home', true);
      });
    }
  };

  function renderRecap(root) {
    var c = Recap.cur;
    if (!c) { Router.go('home', true); return; }
    if (c.finished) {
      var shaky = c.marks.filter(function (m) { return m === 'shaky'; }).length;
      var streakN = Sched.streak(Store.state, today());
      screenFrame(root, [
        glow(),
        h('div', { class: 'score-card great' },
          h('div', { class: 'eyebrow', text: 'Recap' }),
          h('h1', { class: 'headline', text: 'Recap done' }),
          h('div', { class: 'score' }, String(c.marks.length), ' ', h('small', { text: c.marks.length === 1 ? 'reading' : 'readings' })),
          h('p', { class: 'result-line', text: shaky ? plural(shaky, 'reading', 'readings') + ' marked shaky. Their questions come back sooner.' : 'All marked solid. The questions will tell if that holds.' }),
          h('div', { class: 'xp-gain' }, h('span', { class: 'xp-num', text: '+' + c.marks.length * XP.recap }), ' XP')),
        h('div', { class: 'wins' }, levelBar(Store.state.xp || 0)),
        streakN ? h('div', null, streakChip(), streakN >= 3 ? h('span', { class: 'muted small', style: 'margin-left:10px', text: 'Nice streak!' }) : null) : null
      ], h('div', { class: 'bar' },
        h('button', { class: 'btn btn-primary', text: NAMES.daily, onclick: function () { Recap.cur = null; Session.start('daily'); } }),
        h('button', { class: 'btn btn-quiet', text: 'Done', onclick: function () { Recap.cur = null; Router.go('home', true); } })));
      return;
    }
    var rid = c.ids[c.i], info = D.reading[rid];
    root.appendChild(h('div', { class: 's-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Stop', onclick: function () { Recap.quit(); } }, icon('close')),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(c.ids.length), 'aria-valuenow': String(c.i) },
        h('i', { style: 'width:' + Math.round(c.i / c.ids.length * 100) + '%' })),
      h('div', { class: 'count', text: (c.i + 1) + ' / ' + c.ids.length })));
    var sc = h('div', { class: 'scroll s-body' },
      h('div', { class: 's-label', 'data-t': info.topic.id, text: info.topic.short + ' · Reading ' + info.reading.n }),
      h('h1', { class: 'card-title', text: info.reading.title }),
      h('div', { class: 'recap-card' }, recapBody(rid, false)));
    sc.style.paddingTop = '14px';
    root.appendChild(sc);
    root.appendChild(h('div', { class: 'bar' },
      h('div', { class: 'btn-row stack' },
        h('button', { class: 'btn btn-solid', text: 'Solid', onclick: function () { Recap.mark('solid'); } }),
        h('button', { class: 'btn btn-shaky', text: 'Shaky · bring its questions forward', onclick: function () { Recap.mark('shaky'); } }))));
  }

  /* =====================================================================
     Screen: Your map (all readings, coloured)
     ===================================================================== */
  var STATUS_TEXT = {
    none: 'Not covered yet',
    untested: 'Covered, not tested much yet',
    shaky: 'Shaky',
    solid: 'Solid'
  };

  function openReadingSheet(rid, redraw) {
    var info = D.reading[rid], st = Store.state;
    var stats = Sched.readingStats(D.questions, st);
    var status = readingStatus(rid, stats), s = stats[rid];
    var nQ = D.questions.filter(function (q) { return q.reading === rid; }).length;
    var rec = st.recap && st.recap[rid];

    openSheet(function (sh) {
      function showSummary() {
        var facts = [];
        if (!st.coverage[rid]) facts.push('You haven’t marked this reading as covered.');
        else if (s && s.attempts) facts.push('You’ve answered ' + plural(s.attempts, 'question', 'questions') + ' from it, ' + s.right + ' right.');
        else facts.push('No questions answered from it yet.');
        if (rec) {
          var ago = Sched.daysBetween(rec.last, today());
          facts.push('Recapped ' + (ago === 0 ? 'today' : ago === 1 ? 'yesterday' : ago + ' days ago') + ', marked ' + rec.mark + '.');
        }
        var foot = [];
        if (!st.coverage[rid]) {
          foot.push(h('button', { class: 'btn btn-primary', text: 'Mark as covered', onclick: function () {
            st.coverage[rid] = today(); Store.save(); sh.close(); notice('Marked as covered.'); redraw();
          } }));
        } else {
          if (nQ) foot.push(h('button', { class: 'btn btn-primary', text: 'Practice this', onclick: function () {
            sh.close(); Session.start('daily', { readings: [rid], size: 10 });
          } }));
        }
        if (D.recaps[rid]) foot.push(h('button', { class: 'btn btn-quiet', text: 'Recap', onclick: showRecap }));
        foot.push(h('button', { class: 'btn btn-quiet', text: 'Close', onclick: sh.close }));
        sh.set([
          h('div', { class: 'eyebrow', text: info.topic.name + ' · Reading ' + info.reading.n }),
          h('h2', { class: 'sheet-title', text: info.reading.title }),
          h('div', { class: 'status-line' }, h('span', { class: 'sw ' + status }), STATUS_TEXT[status]),
          facts.map(function (f) { return h('p', { class: 'fact', text: f }); }),
          st.coverage[rid] && !nQ ? h('p', { class: 'fact muted', text: 'No practice questions for this reading yet.' }) : null
        ], foot);
      }
      function showRecap() {
        function mark(m) {
          st.recap[rid] = { last: today(), mark: m }; Store.save();
          sh.close(); notice(m === 'solid' ? 'Marked solid.' : 'Marked shaky. Its questions come back sooner.'); redraw();
        }
        var foot = [];
        if (st.coverage[rid]) {
          foot.push(h('button', { class: 'btn btn-solid', text: 'Solid', onclick: function () { mark('solid'); } }));
          foot.push(h('button', { class: 'btn btn-shaky', text: 'Shaky · bring its questions forward', onclick: function () { mark('shaky'); } }));
        }
        foot.push(h('button', { class: 'btn btn-quiet', text: 'Back', onclick: showSummary }));
        sh.set(recapBody(rid), foot);
      }
      showSummary();
    });
  }

  function renderMap(root) {
    var st = Store.state;
    var list = h('div');
    var summary = h('p', { class: 'map-sum' });
    function legendItem(cls, text) { return h('span', { class: 'lg' }, h('span', { class: 'sw ' + cls }), text); }
    var head = h('div', { class: 'cov-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: function () { history.length > 1 ? history.back() : Router.go('home'); } }, icon('back')),
      h('div', null, h('h1', { class: 'title', text: 'Your map' }),
        h('p', { class: 'subtitle', text: 'Every reading, coloured by how you’re doing. Tap one to recap it or practise it.' })));
    var legend = h('div', { class: 'legend', role: 'group', 'aria-label': 'Colour key' },
      legendItem('solid', 'Solid'), legendItem('shaky', 'Shaky'), legendItem('untested', 'Covered, not tested yet'), legendItem('none', 'Not covered'));
    var foot = h('button', { class: 'btn-link map-foot', text: 'Update what you’ve covered', onclick: function () { Router.go('coverage'); } });
    var standLink = h('button', { class: 'btn-link', text: 'Where you stand, by exam weight', onclick: function () { Router.go('standing'); } });
    var scroll = screenFrame(root, [head, summary, standLink, legend, list, foot]);
    scroll.style.paddingBottom = 'calc(28px + env(safe-area-inset-bottom))';

    function draw() {
      var top = scroll.scrollTop;
      var stats = Sched.readingStats(D.questions, st), mc = mapCounts();
      summary.textContent = mc.covered + ' of ' + D.readingCount + ' covered · ' + mc.solid + ' solid · ' + mc.shaky + ' shaky · ' + mc.untested + ' untested';
      list.innerHTML = '';
      D.curriculum.topics.forEach(function (t) {
        var n = t.readings.filter(function (r) { return st.coverage[r.id]; }).length;
        list.appendChild(h('section', { class: 'map-topic', 'data-t': t.id },
          h('div', { class: 'map-topic-head' }, h('div', { class: 'map-topic-name', text: t.name }), h('div', { class: 'map-topic-n', text: n + ' of ' + t.readings.length })),
          h('div', { class: 'grid' }, t.readings.map(function (r) {
            var status = readingStatus(r.id, stats);
            return h('button', { class: 'cell ' + status, 'aria-label': 'Reading ' + r.n + ', ' + r.short + ': ' + STATUS_TEXT[status],
              onclick: function () { openReadingSheet(r.id, draw); } }, String(r.n));
          }))));
      });
      scroll.scrollTop = top;
    }
    draw();
  }

  /* =====================================================================
     Screen: Where you stand. Exam weight covered, per-topic accuracy, what to read next.
     ===================================================================== */
  function midWeight(t) { return (t.weightMin + t.weightMax) / 2; }
  function weightCovered() {
    var st = Store.state, tot = 0, got = 0;
    D.curriculum.topics.forEach(function (t) {
      var n = t.readings.filter(function (r) { return st.coverage[r.id]; }).length;
      tot += midWeight(t); got += midWeight(t) * n / t.readings.length;
    });
    return tot ? Math.round(100 * got / tot) : 0;
  }
  // Unread readings worth the most exam weight each (topic weight shared across its readings).
  function readNext(k) {
    var st = Store.state, out = [];
    D.curriculum.topics.forEach(function (t) {
      t.readings.forEach(function (r) {
        if (!st.coverage[r.id]) out.push({ r: r, t: t, per: midWeight(t) / t.readings.length });
      });
    });
    out.sort(function (a, b) { return b.per - a.per || a.r.n - b.r.n; });
    return out.slice(0, k);
  }

  function renderStanding(root) {
    var st = Store.state;
    var head = h('div', { class: 'cov-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: function () { history.length > 1 ? history.back() : Router.go('home'); } }, icon('back')),
      h('div', null, h('h1', { class: 'title', text: 'Where you stand' }),
        h('p', { class: 'subtitle', text: 'The exam counts topics unevenly. Ethics, FSA, Equity and Fixed Income are about half the paper.' })));
    var body = h('div');
    var scroll = screenFrame(root, [head, body]);
    scroll.style.paddingBottom = 'calc(28px + env(safe-area-inset-bottom))';

    function draw() {
      body.innerHTML = '';
      var stats = Sched.readingStats(D.questions, st);
      body.appendChild(h('p', { class: 'stand-big', text: 'About ' + weightCovered() + '% of the exam covered, by weight.' }));

      var next = readNext(3);
      if (next.length) {
        body.appendChild(h('section', { class: 'stand-next' },
          h('div', { class: 'eyebrow', text: 'Read next in the books' }),
          h('p', { class: 'fact muted', text: 'The unread readings worth the most exam marks each. Tap one to mark it covered when you finish it.' }),
          next.map(function (x) {
            return h('button', { class: 'next-row', onclick: function () { openReadingSheet(x.r.id, draw); } },
              h('span', null, h('b', { text: x.t.name }), ' · Reading ' + x.r.n + ': ' + x.r.title),
              icon('chev'));
          })));
      }

      body.appendChild(h('div', { class: 'eyebrow stand-eyebrow', text: 'By topic' }));
      D.curriculum.topics.forEach(function (t) {
        var n = 0, att = 0, right = 0;
        t.readings.forEach(function (r) {
          if (st.coverage[r.id]) n++;
          var s = stats[r.id]; if (s) { att += s.attempts; right += s.right; }
        });
        var acc = att >= 5 ? Math.round(100 * right / att) : null;
        var accText = acc === null ? (n ? 'not enough answers yet' : '') : acc + '% right';
        body.appendChild(h('div', { class: 'stand-row', 'data-t': t.id },
          h('div', { class: 'stand-top' },
            h('span', { class: 'stand-name', text: t.name }),
            h('span', { class: 'stand-w', text: t.weightMin + '–' + t.weightMax + '%' })),
          h('div', { class: 'stand-bar' }, h('span', { style: 'width:' + Math.round(100 * n / t.readings.length) + '%' })),
          h('div', { class: 'stand-sub' },
            h('span', { text: n + ' of ' + t.readings.length + ' read' }),
            accText ? h('span', { class: acc === null ? '' : acc < 70 ? 'acc-low' : 'acc-ok', text: accText }) : null)));
      });
      body.appendChild(h('p', { class: 'fact muted stand-foot', text: 'Aim for 70% or more in every topic you’ve read. Below that, use Weak spots or Practice this from Your map.' }));
    }
    draw();
  }

  /* =====================================================================
     Screen: Formula sheet. Every formula and must-remember line from covered readings,
     cue shown and answer blurred: say it, then tap. Retrieval, not rereading.
     ===================================================================== */
  var sheetAll = false, sheetShown = false;

  function sheetLines(all) {
    var st = Store.state, by = {}, seen = {};
    function add(rid, cue, text) {
      var key = text.trim().toLowerCase();
      if (seen[key]) return; seen[key] = true;
      (by[rid] = by[rid] || []).push({ cue: cue, text: text });
    }
    D.recapList.forEach(function (c) {
      if (!c.formula || (!all && !st.coverage[c.reading])) return;
      c.formula.split(/;\s+/).forEach(function (part) {
        var i = part.indexOf('=');
        add(c.reading, i > 0 ? part.slice(0, i).trim() : D.reading[c.reading].reading.short, part.trim());
      });
    });
    D.questions.forEach(function (q) {
      if (!q.remember || (!all && !st.coverage[q.reading])) return;
      var i = q.remember.indexOf(':');
      var lo = D.lo[q.los];
      add(q.reading, i > 0 && i <= 40 ? q.remember.slice(0, i) : (lo ? lo.text : D.reading[q.reading].reading.short), q.remember);
    });
    return by;
  }

  function renderFormulaSheet(root) {
    var head = h('div', { class: 'cov-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: function () { history.length > 1 ? history.back() : Router.go('home'); } }, icon('back')),
      h('div', null, h('h1', { class: 'title', text: NAMES.sheet }),
        h('p', { class: 'subtitle', text: 'Every formula and must-remember fact. Read the cue, say the answer out loud, then tap to check.' })));
    var controls = h('div', { class: 'sheet-ctl' });
    var body = h('div');
    var scroll = screenFrame(root, [head, controls, body]);
    scroll.style.paddingBottom = 'calc(28px + env(safe-area-inset-bottom))';

    function draw() {
      var by = sheetLines(sheetAll), total = 0;
      controls.innerHTML = '';
      controls.appendChild(h('button', { class: 'btn-small' + (sheetAll ? '' : ' sel'), text: 'What I’ve covered', onclick: function () { sheetAll = false; draw(); } }));
      controls.appendChild(h('button', { class: 'btn-small' + (sheetAll ? ' sel' : ''), text: 'Everything', onclick: function () { sheetAll = true; draw(); } }));
      controls.appendChild(h('button', { class: 'btn-link', text: sheetShown ? 'Hide answers' : 'Show all', onclick: function () { sheetShown = !sheetShown; draw(); } }));
      body.innerHTML = '';
      D.curriculum.topics.forEach(function (t) {
        var rows = [];
        t.readings.forEach(function (r) {
          (by[r.id] || []).forEach(function (x) {
            total++;
            var line = h('button', { class: 'fl' + (sheetShown ? ' open' : ''), 'aria-label': x.cue + '. Tap to reveal.',
              onclick: function () { line.classList.toggle('open'); } },
              h('div', { class: 'fl-r', text: 'Reading ' + r.n + ' · ' + r.short }),
              h('div', { class: 'fl-cue', text: x.cue }),
              h('div', { class: 'fl-a', text: x.text }));
            rows.push(line);
          });
        });
        if (rows.length) body.appendChild(h('section', { class: 'map-topic', 'data-t': t.id },
          h('div', { class: 'map-topic-head' }, h('div', { class: 'map-topic-name', text: t.name }), h('div', { class: 'map-topic-n', text: String(rows.length) })),
          rows));
      });
      if (!total) body.appendChild(h('p', { class: 'fact muted', text: 'Nothing here yet. Tick the readings you’ve covered, or tap Everything.' }));
    }
    draw();
  }

  /* =====================================================================
     Screen: Settings
     ===================================================================== */
  function exportText() { return JSON.stringify(Store.state, null, 2); }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = h('textarea', { readonly: true, 'aria-hidden': 'true', style: 'position:fixed;left:-9999px;top:0;opacity:0' });
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function markExported() { Store.state.nudge.export = true; Store.state.lastExport = today(); Store.save(); }

  function doExport() {
    markExported();
    var name = 'cfa-progress-' + today() + '.json';
    try {
      var blob = new Blob([exportText()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = h('a', { href: url, download: name, style: 'display:none' });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      notice('Progress file saved: ' + name);
    } catch (e) {
      doCopy(true);
    }
  }
  function doCopy(fallback) {
    markExported();
    copyText(exportText()).then(function () {
      notice(fallback ? "Couldn't save a file, so your progress is copied. Paste it into Notes." : 'Progress copied. Paste it into Notes to keep it safe.');
    }, function () { notice("Couldn't copy. Try saving the progress file instead."); });
  }

  function doImport(file) {
    var reader = new FileReader();
    reader.onerror = function () { notice("Couldn't read that file."); };
    reader.onload = function () { importText(reader.result, "That doesn't look like a progress file from this app."); };
    reader.readAsText(file);
  }
  // Restore from progress copied into Notes earlier: she copies the text there, then taps this.
  function doPaste() {
    if (!navigator.clipboard || !navigator.clipboard.readText) { notice("This phone can't paste here. Use a progress file instead."); return; }
    navigator.clipboard.readText().then(function (t) {
      importText(t, 'Copy the whole progress text from Notes first, then tap this again.');
    }, function () { notice("Couldn't paste. Copy the progress text from Notes, then try again."); });
  }
  function importText(text, badMsg) {
    var data;
    try { data = JSON.parse(text); } catch (e) { data = null; }
    if (!looksLikeState(data)) { notice(badMsg); return; }
    var n = Object.keys(data.q).length, cov = Object.keys(data.coverage).length;
    confirmDialog('Replace your progress?',
      'This backup has ' + plural(cov, 'covered reading', 'covered readings') + ' and ' + plural(n, 'answered question', 'answered questions') + '. It will replace what is on this phone now.',
      'Replace', 'Cancel', true).then(function (yes) {
      if (!yes) return;
      if (!('onboarded' in data)) data.onboarded = cov > 0;
      Store.replace(data);
      notice('Progress restored.');
      Router.go('home');
    });
  }

  function renderSettings(root) {
    var file = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden-file', tabindex: '-1', 'aria-hidden': 'true',
      onchange: function () { if (file.files && file.files[0]) doImport(file.files[0]); file.value = ''; } });
    function row(name, desc, fn, cls) {
      return h('button', { class: 'row' + (cls ? ' ' + cls : ''), onclick: fn },
        h('div', { class: 't' }, h('div', { class: 'n', text: name }), desc ? h('div', { class: 'd', text: desc }) : null),
        h('span', { class: 'chev' }, icon('chev')));
    }
    var body = [
      h('div', { class: 'cov-head', style: 'margin-bottom:0' },
        h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: function () { history.length > 1 ? history.back() : Router.go('home'); } }, icon('back')),
        h('h1', { class: 'title', style: 'margin-top:4px', text: 'Settings' })),
      h('div', { class: 'group' }, h('div', { class: 'eyebrow', text: 'Your progress' }),
        h('div', { class: 'list' },
          row('Save a progress file', 'Downloads a backup of everything you’ve done', doExport),
          row('Copy progress instead', 'If saving a file doesn’t work on this phone', function () { doCopy(false); }),
          row('Restore from a progress file', 'Pick a file you saved earlier', function () { file.click(); }),
          row('Restore from copied progress', 'Copy the progress text from Notes, then tap here', doPaste)),
        h('p', { class: 'reminder', text: 'Safari can clear a web app’s saved data if you don’t open it for about a week. Save a progress file now and then.' }), file),
      h('div', { class: 'group' }, h('div', { class: 'eyebrow', text: 'Study' }),
        h('div', { class: 'list' }, row('Edit what you’ve covered', coveredCount() + ' of ' + D.readingCount + ' readings ticked', function () { Router.go('coverage'); }))),
      h('div', { class: 'group' }, h('div', { class: 'eyebrow', text: 'Start over' }),
        h('div', { class: 'list' }, row('Reset all progress', 'Clears your ticks, answers and streak', function () {
          confirmDialog('Reset all progress?', 'Everything you’ve ticked and answered on this phone will be cleared.', 'Continue', 'Cancel', true).then(function (a) {
            if (!a) return;
            return confirmDialog('Are you really sure?', "This can't be undone unless you saved a progress file.", 'Yes, clear everything', 'No, keep it', true).then(function (b) {
              if (!b) return;
              Store.reset(); Session.cur = null; Session.last = null; Recap.cur = null; covOpen = {};
              Router.go('coverage', true);
            });
          });
        }, 'danger'))),
      h('div', { class: 'group' }, h('div', { class: 'eyebrow', text: 'About' }),
        h('div', { class: 'about' },
          h('p', { text: 'The questions are written by AI and then reviewed. They are not official CFA Institute material.' }),
          h('p', { text: 'Official mock exams are still the real check of whether you are ready.' })))
    ];
    var s = screenFrame(root, body);
    s.style.paddingBottom = 'calc(32px + env(safe-area-inset-bottom))';
  }

  /* =====================================================================
     Boot
     ===================================================================== */
  Router.register('coverage', renderCoverage);
  Router.register('home', renderHome);
  Router.register('session', renderSession);
  Router.register('result', renderResult);
  Router.register('recap', renderRecap);
  Router.register('map', renderMap);
  Router.register('settings', renderSettings);
  Router.register('standing', renderStanding);
  Router.register('sheet', renderFormulaSheet);

  function boot() {
    Store.load();
    loadData().then(function () {
      window.addEventListener('hashchange', function () { Router.render(); });
      Router.render();
    }).catch(function (err) {
      var root = el('screen');
      root.innerHTML = '';
      root.appendChild(h('div', { class: 'scroll' },
        h('h1', { class: 'title', text: "Couldn't load your questions" }),
        h('p', { class: 'subtitle', text: 'Check your connection and try again. Your progress is safe.' }),
        h('div', { style: 'margin-top:24px' }, h('button', { class: 'btn btn-primary', text: 'Try again', onclick: function () { location.reload(); } }))));
      if (window.console) console.error(err);
    });
  }
  window.CFA = { Store: Store, Router: Router, Session: Session, D: D, h: h, notice: notice, confirmDialog: confirmDialog, icon: icon };
  boot();
})();
