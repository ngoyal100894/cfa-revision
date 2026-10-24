/* Deterministic Leitner 3-box scheduler. Pure functions, no DOM, no storage.
   Works in the browser (window.Scheduler) and in Node (require). */
(function (root) {
  'use strict';

  var INTERVAL = { 1: 0, 2: 2, 3: 4 }; // days until due again, by box
  var BASELINE = 1.0;                  // dueness of an unseen question
  var NEW_BOOST = 3.0;                 // unseen question from a reading ticked since the last session
  var NOT_DUE = 0.05;                  // seen, not yet due: only used if the pool runs dry

  var MODES = {
    daily:    { size: 15, calcCap: 0.2, retryShare: 0.4, weakShare: 0.2, newShare: 0.6 },
    calc:     { size: 10, kinds: ['calc'] },
    remember: { size: 15, kinds: ['memorise'] },
    exam:     { size: 10, preferKind: 'exam', calcCap: 0.2 },
    weak:     { size: 10, weakReadings: 3 }
  };

  // ---- dates as "YYYY-MM-DD" strings ----
  function toDate(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { return new Date(toDate(s) + n * 864e5).toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 864e5); }
  function localToday(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ---- seeded RNG (mulberry32) so a given day's session is reproducible ----
  function rng(seed) {
    var a = 0;
    for (var i = 0; i < String(seed).length; i++) a = (a * 31 + String(seed).charCodeAt(i)) | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function emptyState() {
    return { v: 1, coverage: {}, q: {}, recap: {}, sessions: [], lastSessionDate: null };
  }

  // Grade one answer. Wrong -> box 1, due today (so it is back next session). Right -> up a box.
  function grade(qs, correct, today) {
    qs = qs || { box: 1, due: today, seen: 0, right: 0, last: null };
    var box = correct ? Math.min(3, qs.box + 1) : 1; // first-time right lands in box 2, not 3
    return {
      box: box,
      due: addDays(today, INTERVAL[box]),
      seen: qs.seen + 1,
      right: qs.right + (correct ? 1 : 0),
      last: today
    };
  }

  // Smoothed accuracy per reading: (right+1)/(attempts+2). Unseen reading = 0.5.
  function readingStats(questions, state) {
    var out = {};
    questions.forEach(function (q) {
      var r = out[q.reading] || (out[q.reading] = { attempts: 0, right: 0, acc: 0.5 });
      var s = state.q[q.id];
      if (s) { r.attempts += s.seen; r.right += s.right; }
    });
    Object.keys(out).forEach(function (k) { var r = out[k]; r.acc = (r.right + 1) / (r.attempts + 2); });
    return out;
  }

  // Readings with at least 3 attempts, worst first, and below 70% smoothed accuracy.
  function weakReadings(questions, state, coveredOnly) {
    var st = readingStats(questions, state);
    return Object.keys(st)
      .filter(function (k) { return st[k].attempts >= 3 && st[k].acc < 0.7 && (!coveredOnly || state.coverage[k]); })
      .sort(function (a, b) { return st[a].acc - st[b].acc || (a < b ? -1 : 1); })
      .map(function (k) { return { reading: k, acc: st[k].acc, attempts: st[k].attempts }; });
  }

  function topicWeights(curriculum) {
    var w = {};
    curriculum.topics.forEach(function (t) { w[t.id] = (t.weightMin + t.weightMax) / 200; });
    return w;
  }

  // Marked Shaky in Recap within the last 3 days: pull that reading's questions forward.
  function isShaky(reading, state, today) {
    var r = state.recap && state.recap[reading];
    return !!r && r.mark === 'shaky' && daysBetween(r.last, today) <= 3;
  }

  function isNewlyCovered(reading, state) {
    var c = state.coverage[reading];
    return !!c && (!state.lastSessionDate || c >= state.lastSessionDate);
  }

  // priority = exam_weight x (1 - reading_accuracy) x dueness  (+ tiny seeded jitter for variety)
  function scoreAll(pool, state, curriculum, today, rand) {
    var w = topicWeights(curriculum);
    var st = readingStats(pool, state);
    return pool.map(function (q) {
      var s = state.q[q.id];
      var dueness, tag;
      if (!s) {
        tag = isNewlyCovered(q.reading, state) ? 'new' : 'unseen';
        dueness = tag === 'new' ? NEW_BOOST : BASELINE;
      } else if (s.due <= today) {
        tag = s.box === 1 ? 'retry' : 'due';
        dueness = 1 + 0.15 * Math.min(daysBetween(s.due, today), 7) + (s.box === 1 ? 0.5 : 0);
      } else {
        tag = 'later';
        dueness = NOT_DUE;
      }
      var shaky = isShaky(q.reading, state, today);
      if (tag === 'later' && shaky) { tag = 'due'; dueness = BASELINE; }
      var p = (w[q.topic] || 0.1) * (1 - st[q.reading].acc) * dueness * (shaky ? 1.5 : 1);
      return { q: q, tag: tag, p: p * (1 + (rand() - 0.5) * 0.02) };
    }).sort(function (a, b) { return b.p - a.p; });
  }

  // Build a session. Returns { ids: [...], meta: { mode, size, weakReading } }.
  // Only questions from covered readings are ever eligible.
  function buildSession(opts) {
    var questions = opts.questions, state = opts.state, curriculum = opts.curriculum;
    var today = opts.today, mode = MODES[opts.mode || 'daily'];
    var N = opts.size || mode.size;
    var rand = rng(opts.seed || today + (opts.mode || 'daily') + state.sessions.length);

    var pool = questions.filter(function (q) { return state.coverage[q.reading]; });
    if (mode.kinds) pool = pool.filter(function (q) { return mode.kinds.indexOf(q.kind) >= 0; });
    if (opts.readings) pool = pool.filter(function (q) { return opts.readings.indexOf(q.reading) >= 0; }); // "Practice this"
    var weakList = weakReadings(pool, state, true);
    if (mode.weakReadings) {
      var keep = weakList.slice(0, mode.weakReadings).map(function (x) { return x.reading; });
      pool = pool.filter(function (q) { return keep.indexOf(q.reading) >= 0; });
    }

    var scored = scoreAll(pool, state, curriculum, today, rand);
    var picked = [], used = {}, calcCount = 0;
    var calcCap = mode.calcCap ? Math.floor(mode.calcCap * N) : Infinity;
    var newCap = mode.newShare ? Math.ceil(mode.newShare * N) : Infinity, newCount = 0;

    function take(item) {
      if (used[item.q.id] || picked.length >= N) return false;
      if (item.q.kind === 'calc' && calcCount >= calcCap) return false;
      if (item.tag === 'new' && newCount >= newCap) return false;
      used[item.q.id] = true; picked.push(item);
      if (item.q.kind === 'calc') calcCount++;
      if (item.tag === 'new') newCount++;
      return true;
    }

    // 1. Wrong-last-time questions come back first (bounded so a bad day doesn't snowball).
    if (mode.retryShare) {
      var retryCap = Math.ceil(mode.retryShare * N), n = 0;
      scored.forEach(function (it) { if (it.tag === 'retry' && n < retryCap && take(it)) n++; });
    }
    // 2. About 20% from the single weakest covered reading.
    var weakReading = null;
    if (mode.weakShare && weakList.length) {
      weakReading = weakList[0].reading;
      var weakCap = Math.round(mode.weakShare * N), m = 0;
      scored.forEach(function (it) {
        if (it.q.reading === weakReading && it.tag !== 'later' && m < weakCap && take(it)) m++;
      });
    }
    // 3. Exam mode prefers exam-style questions.
    if (mode.preferKind) scored.forEach(function (it) { if (it.q.kind === mode.preferKind && it.tag !== 'later') take(it); });
    // 4. Fill by priority; not-yet-due items only if nothing else is left.
    scored.forEach(function (it) { if (it.tag !== 'later') take(it); });
    scored.forEach(function (it) { take(it); });
    // Ignore the new-reading cap if that's all there is.
    if (picked.length < N) { newCap = Infinity; scored.forEach(function (it) { take(it); }); }

    // Shuffle (seeded) so topics don't clump.
    for (var i = picked.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)); var t = picked[i]; picked[i] = picked[j]; picked[j] = t;
    }
    return {
      ids: picked.map(function (it) { return it.q.id; }),
      meta: { mode: opts.mode || 'daily', size: N, weakReading: weakReading }
    };
  }

  // Record a finished session; returns new state (does not mutate input).
  function finishSession(state, today, mode, answers) {
    var s = JSON.parse(JSON.stringify(state));
    // A lucky guess is scheduled as a miss; the session score still counts it right.
    answers.forEach(function (a) { s.q[a.id] = grade(s.q[a.id], a.correct && !a.guess, today); });
    s.sessions.push({ date: today, mode: mode, n: answers.length, right: answers.filter(function (a) { return a.correct; }).length });
    s.lastSessionDate = today;
    return s;
  }

  // Recap deck: covered readings only, deterministic. Shaky first, then weak, then newly ticked,
  // then never/oldest recapped, then heavier topic, then id.
  function buildRecapDeck(opts) {
    var state = opts.state, today = opts.today, size = opts.size || 10;
    var w = topicWeights(opts.curriculum);
    function topicOf(reading) { return reading.split('-')[0]; } // reading ids are "<topic>-<n>"
    var weak = {};
    weakReadings(opts.questions || [], state, true).forEach(function (x) { weak[x.reading] = true; });
    var rec = state.recap || {};
    function key(c) {
      return [isShaky(c.reading, state, today) ? 0 : 1, weak[c.reading] ? 0 : 1,
        isNewlyCovered(c.reading, state) ? 0 : 1, rec[c.reading] ? rec[c.reading].last : '0000',
        -(w[topicOf(c.reading)] || 0), c.reading];
    }
    return opts.recaps
      .filter(function (c) { return state.coverage[c.reading]; })
      .map(function (c) { return { c: c, k: key(c) }; })
      .sort(function (a, b) {
        for (var i = 0; i < a.k.length; i++) { if (a.k[i] < b.k[i]) return -1; if (a.k[i] > b.k[i]) return 1; }
        return 0;
      })
      .slice(0, size)
      .map(function (x) { return x.c.reading; });
  }

  // Consecutive days (ending today or yesterday) with at least one finished session.
  function streak(state, today) {
    var days = {};
    state.sessions.forEach(function (x) { days[x.date] = true; });
    var d = days[today] ? today : addDays(today, -1), n = 0;
    while (days[d]) { n++; d = addDays(d, -1); }
    return n;
  }

  var api = {
    MODES: MODES, INTERVAL: INTERVAL,
    emptyState: emptyState, grade: grade, readingStats: readingStats, weakReadings: weakReadings,
    buildSession: buildSession, finishSession: finishSession, streak: streak,
    buildRecapDeck: buildRecapDeck, isShaky: isShaky,
    addDays: addDays, daysBetween: daysBetween, localToday: localToday
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Scheduler = api;
})(this);
