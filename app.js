/* CFA revision app. One file, no dependencies.
   Structure: helpers -> Store (state load/save) -> Data -> Router -> one render function per screen -> boot.
   To add a screen:  Router.register('name', function (root, args) { ... });  then Router.go('name'). */
(function () {
  'use strict';

  var Sched = window.Scheduler;
  var KEY = 'cfa-rev-v1';
  var NAMES = { daily: "Today's 15", recap: 'Recap', calc: 'Quick-calc', remember: 'Must-remember', weak: 'Weak spots', exam: 'Exam practice' };
  var LETTERS = ['A', 'B', 'C', 'D'];
  var PACE_SECONDS = 90;   // exam practice pace bar (visual only)

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
    tickCircle: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" opacity=".35"/><path d="M7.6 12.4 10.6 15.3 16.4 9"/></svg>'
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
    return out;
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
    return h('div', { class: 'streak' }, h('span', { class: 'dot' }), n + '-day streak');
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
        var box = h('section', { class: 'topic' + (open ? ' open' : '') }, h('div', { class: 'topic-row' }, main, whole));
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
    exam: { note: '10 exam-style questions at real pace, 90 seconds each. Answers at the end, like the real thing.', empty: 'No questions in what you’ve covered yet' }
  };
  var MODE_ORDER = ['recap', 'remember', 'calc', 'weak', 'exam'];

  // One suggested step, driven by days to the exam. Returns { mode, text, week } (mode may be null).
  function suggestion(avail) {
    var st = Store.state, t = today();
    var d = Sched.daysBetween(t, D.curriculum.examDate);
    if (d < 0) return null;
    if (d === 0) return { mode: 'remember', text: 'Exam day. A quick Must-remember if you want a warm-up. Good luck, Ishita.', week: true };
    if (d === 1) return { mode: 'remember', text: 'Tomorrow. Must-remember and a Recap sweep; nothing new tonight.', week: true };
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
      exam: modePool('exam') > 0
    };
    var sug = suggestion(avail);
    var order = MODE_ORDER.slice();
    if (sug && sug.mode && avail[sug.mode]) order = [sug.mode].concat(order.filter(function (m) { return m !== sug.mode; }));

    var modes = h('div', { class: 'modes' }, order.map(function (m) {
      var c = MODE_CARDS[m], ok = avail[m];
      var tagged = !!(sug && sug.mode === m && ok);
      return h('button', { class: 'mode' + (tagged ? ' suggested' : ''), 'aria-disabled': ok ? null : 'true',
        onclick: function () { if (!ok) return; if (m === 'recap') Recap.start(); else Session.start(m); } },
        h('div', { class: 'mode-head' }, h('div', { class: 'mode-name', text: NAMES[m] }), tagged ? h('span', { class: 'tag', text: 'Suggested' }) : null),
        h('div', { class: 'mode-note', text: c.note }),
        ok ? null : h('div', { class: 'mode-reason', text: c.empty }));
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

    var nudges = [];
    if (st.sessions.length >= 5 && !st.nudge.export) {
      nudges.push(h('div', { class: 'nudge' },
        h('p', { text: 'Save a progress file in Settings, in case Safari clears it.' }),
        h('div', { class: 'nudge-btns' },
          h('button', { class: 'btn-link', text: 'Open Settings', onclick: function () { st.nudge.export = true; Store.save(); Router.go('settings'); } }),
          h('button', { class: 'btn-link muted', text: 'Not now', onclick: function () { st.nudge.export = true; Store.save(); Router.render(); } }))));
    }
    var body = [
      h('div', { class: 'home-top' },
        h('div', null, h('h1', { class: 'hello', text: 'Hi Ishita' }),
          h('p', { class: 'exam-line', text: daysToExamText() }), streakChip()),
        h('button', { class: 'icon-btn', 'aria-label': 'Settings', onclick: function () { Router.go('settings'); } }, icon('gear'))),
      sug ? h('div', { class: 'suggest' + (sug.week ? ' week' : '') }, h('div', { class: 'eyebrow', text: 'Suggested' }), h('p', { text: sug.text })) : null,
      nudges,
      modes,
      strip
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
      var b = Sched.buildSession({ questions: D.questions, curriculum: D.curriculum, state: Store.state, today: today(), mode: mode, readings: opts.readings, size: opts.size });
      if (!b.ids.length) { notice(this.EMPTY[mode] || this.EMPTY.daily); return false; }
      this.cur = { mode: mode, opts: opts, ids: b.ids, i: 0, answers: [], picked: null, recorded: false };
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
      Store.save();
      c.picked = pick;
      c.answers.push({ id: q.id, pick: pick, correct: correct, guess: false, prev: prev });
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
    // Add the session record (once). Called at the end, or on quit if anything was answered.
    record: function () {
      var c = this.cur, st = Store.state;
      if (!c || c.recorded || !c.answers.length) return;
      c.recorded = true;
      var right = c.answers.filter(function (a) { return a.correct; }).length;
      st.sessions.push({ date: today(), mode: c.mode, n: c.answers.length, right: right });
      st.lastSessionDate = today();
      Store.save();
      this.last = { mode: c.mode, opts: c.opts, n: c.answers.length, right: right, answers: c.answers.slice() };
    },
    next: function () {
      var c = this.cur;
      if (c.i + 1 >= c.ids.length) { this.record(); this.cur = null; Router.go('result', true); return; }
      c.i++; c.picked = null; Router.render();
    },
    quit: function () {
      var self = this;
      confirmDialog('Stop here?', 'Answers so far are saved.', 'Stop and go home', 'Keep going').then(function (yes) {
        if (!yes) return;
        self.record(); self.cur = null; self.last = null; Router.go('home', true);
      });
    }
  };

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
    var top = [h('div', { class: 's-label', text: label }), h('p', { class: 'stem', text: q.stem })];

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
        h('div', { class: 'verdict' }, icon('tickCircle'), 'Correct'),
        h('p', { class: 'plain-expl', text: q.explanation }), extras, tests, remember);
    } else {
      if (D.recaps[q.reading]) {
        extras.appendChild(h('button', { class: 'btn-small', text: 'Recap this reading', onclick: function () { openRecapSheet(q.reading); } }));
      }
      fb = h('div', { class: 'fb' },
        h('div', { class: 'why' }, h('div', { class: 'eyebrow', text: 'Why' }), h('p', { text: q.explanation })),
        extras, tests, remember,
        h('p', { class: 'calm', text: 'This one comes back next session.' }));
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
    var body = [
      h('div', { class: 'eyebrow', text: resultTitle(r) }),
      h('div', { class: 'score' }, r.right + ' ', h('small', { text: '/ ' + r.n })),
      h('p', { class: 'result-line', text: line }),
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
    var bar = h('div', { class: 'bar' },
      h('button', { class: 'btn btn-primary', text: 'Another round', onclick: function () { Session.start(r.mode, r.opts); } }),
      h('button', { class: 'btn btn-quiet', text: 'Done', onclick: function () { Session.last = null; Router.go('home', true); } }));
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
        h('div', { class: 'eyebrow', text: 'Recap' }),
        h('div', { class: 'score' }, String(c.marks.length), ' ', h('small', { text: c.marks.length === 1 ? 'reading recapped' : 'readings recapped' })),
        h('p', { class: 'result-line', text: shaky ? plural(shaky, 'reading', 'readings') + ' marked shaky. Their questions come back sooner.' : 'All marked solid. The questions will tell if that holds.' }),
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
      h('div', { class: 's-label', text: info.topic.short + ' · Reading ' + info.reading.n }),
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
    var scroll = screenFrame(root, [head, summary, legend, list, foot]);
    scroll.style.paddingBottom = 'calc(28px + env(safe-area-inset-bottom))';

    function draw() {
      var top = scroll.scrollTop;
      var stats = Sched.readingStats(D.questions, st), mc = mapCounts();
      summary.textContent = mc.covered + ' of ' + D.readingCount + ' covered · ' + mc.solid + ' solid · ' + mc.shaky + ' shaky · ' + mc.untested + ' untested';
      list.innerHTML = '';
      D.curriculum.topics.forEach(function (t) {
        var n = t.readings.filter(function (r) { return st.coverage[r.id]; }).length;
        list.appendChild(h('section', { class: 'map-topic' },
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
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (e) { data = null; }
      if (!looksLikeState(data)) { notice("That doesn't look like a progress file from this app."); return; }
      var n = Object.keys(data.q).length, cov = Object.keys(data.coverage).length;
      confirmDialog('Replace your progress?',
        'This file has ' + plural(cov, 'covered reading', 'covered readings') + ' and ' + plural(n, 'answered question', 'answered questions') + '. It will replace what is on this phone now.',
        'Replace', 'Cancel', true).then(function (yes) {
        if (!yes) return;
        if (!('onboarded' in data)) data.onboarded = cov > 0;
        Store.replace(data);
        notice('Progress restored.');
        Router.go('home');
      });
    };
    reader.readAsText(file);
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
          row('Restore from a progress file', 'Pick a file you saved earlier', function () { file.click(); })),
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
