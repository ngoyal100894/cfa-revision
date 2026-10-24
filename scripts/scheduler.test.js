// Run: node scripts/scheduler.test.js
const assert = require('assert');
const S = require('../scheduler.js');

const curriculum = { topics: [
  { id: 'ethics', weightMin: 15, weightMax: 20 },
  { id: 'fi', weightMin: 11, weightMax: 14 },
  { id: 'deriv', weightMin: 5, weightMax: 8 }
] };
// 3 readings x 20 questions; every 5th question is quick-calc.
const questions = [];
[['ethics', 'ethics-2'], ['fi', 'fi-6'], ['deriv', 'deriv-8']].forEach(([topic, reading]) => {
  for (let i = 0; i < 20; i++) {
    questions.push({ id: `${reading}-q${i}`, topic, reading, los: `${reading}-a`, kind: i % 5 === 0 ? 'calc' : (i % 7 === 0 ? 'memorise' : 'concept') });
  }
});
const T = '2026-10-24';
const build = (state, extra = {}) => S.buildSession({ questions, curriculum, state, today: T, ...extra }).ids;
const readingOf = id => questions.find(q => q.id === id).reading;

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok -', name); }

test('1. uncovered readings are excluded entirely', () => {
  const st = S.emptyState();
  st.coverage['ethics-2'] = '2026-10-20';
  const ids = build(st);
  assert.strictEqual(ids.length, 15);
  assert.ok(ids.every(id => readingOf(id) === 'ethics-2'));
  st.coverage = {};
  assert.strictEqual(build(st).length, 0);
});

test('2. wrong answer -> box 1 and back in the very next session', () => {
  let st = S.emptyState();
  ['ethics-2', 'fi-6', 'deriv-8'].forEach(r => st.coverage[r] = '2026-10-01');
  st.lastSessionDate = '2026-10-23';
  // Deriv is lowest-weight, so only the retry rule can guarantee its return.
  st = S.finishSession(st, '2026-10-23', 'daily', [{ id: 'deriv-8-q3', correct: false }]);
  assert.strictEqual(st.q['deriv-8-q3'].box, 1);
  assert.strictEqual(st.q['deriv-8-q3'].due, '2026-10-23');
  assert.ok(build(st).includes('deriv-8-q3'));
});

test('3. right answer moves up a box; box 3 waits ~4 days', () => {
  let q = S.grade(undefined, true, T);
  assert.deepStrictEqual([q.box, q.due], [2, '2026-10-26']);
  q = S.grade(q, true, '2026-10-26');
  assert.deepStrictEqual([q.box, q.due], [3, '2026-10-30']);
  q = S.grade(q, true, '2026-10-30');
  assert.deepStrictEqual([q.box, q.due], [3, '2026-11-03']);
  q = S.grade(q, false, '2026-11-03');
  assert.deepStrictEqual([q.box, q.due], [1, '2026-11-03']);
  // A box-3 question not yet due is not picked while due/unseen ones exist.
  let st = S.emptyState();
  st.coverage['ethics-2'] = '2026-10-01'; st.lastSessionDate = '2026-10-23';
  st.q['ethics-2-q1'] = { box: 3, due: '2026-10-28', seen: 2, right: 2, last: '2026-10-22' };
  assert.ok(!build(st).includes('ethics-2-q1'));
});

test('4. about 20% of a daily session comes from the weakest reading', () => {
  let st = S.emptyState();
  ['ethics-2', 'fi-6', 'deriv-8'].forEach(r => st.coverage[r] = '2026-10-01');
  st.lastSessionDate = '2026-10-23';
  // Deriv: 4 attempts, all wrong, but answered long ago and since moved to "not due" boxes
  // so only the weak-reading rule can pull them in.
  for (let i = 1; i <= 4; i++) st.q[`deriv-8-q${i}`] = { box: 2, due: '2026-10-30', seen: 1, right: 0, last: '2026-10-20' };
  const weak = S.weakReadings(questions, st, true);
  assert.strictEqual(weak[0].reading, 'deriv-8');
  const ids = build(st);
  const n = ids.filter(id => readingOf(id) === 'deriv-8').length;
  assert.ok(n >= 3, `expected >=3 deriv questions, got ${n}`);
});

test('5. newly ticked reading gets first-session priority', () => {
  let st = S.emptyState();
  st.coverage['ethics-2'] = '2026-10-01';
  st.lastSessionDate = '2026-10-23';
  questions.filter(q => q.reading === 'ethics-2').forEach(q => st.q[q.id] = { box: 2, due: T, seen: 1, right: 1, last: '2026-10-22' });
  st.coverage['deriv-8'] = T; // ticked today, after the last session
  const ids = build(st);
  const n = ids.filter(id => readingOf(id) === 'deriv-8').length;
  assert.ok(n >= 8, `expected new deriv reading to dominate (cap 60%), got ${n}`);
  assert.ok(n <= 9, `new-reading cap exceeded: ${n}`);
});

test('6. quick-calc capped at 20% in daily mix; calc mode is calc-only', () => {
  const st = S.emptyState();
  ['ethics-2', 'fi-6', 'deriv-8'].forEach(r => st.coverage[r] = '2026-10-01');
  const ids = build(st);
  const calc = ids.filter(id => questions.find(q => q.id === id).kind === 'calc').length;
  assert.ok(calc <= 3, `calc ${calc} > 3`);
  const c = build(st, { mode: 'calc' });
  assert.ok(c.length > 0 && c.every(id => questions.find(q => q.id === id).kind === 'calc'));
});

test('7. deterministic for same day and state; streak counts consecutive days', () => {
  const st = S.emptyState();
  st.coverage['fi-6'] = '2026-10-01';
  assert.deepStrictEqual(build(st), build(st));
  st.sessions = [{ date: '2026-10-22' }, { date: '2026-10-23' }, { date: T }].map(x => ({ ...x, mode: 'daily', n: 15, right: 10 }));
  assert.strictEqual(S.streak(st, T), 3);
  assert.strictEqual(S.streak(st, '2026-10-25'), 3);
  assert.strictEqual(S.streak(st, '2026-10-26'), 0);
});

test('8. lucky guess is scheduled as a miss but scored as right', () => {
  let st = S.emptyState();
  st.coverage['fi-6'] = '2026-10-01';
  st = S.finishSession(st, T, 'daily', [{ id: 'fi-6-q1', correct: true, guess: true }, { id: 'fi-6-q2', correct: true }]);
  assert.deepStrictEqual([st.q['fi-6-q1'].box, st.q['fi-6-q1'].due], [1, T]);
  assert.strictEqual(st.q['fi-6-q2'].box, 2);
  assert.strictEqual(st.sessions[0].right, 2);
});

test('9. shaky pulls a reading forward for 3 days; recap deck puts it first', () => {
  const recaps = ['ethics-2', 'fi-6', 'deriv-8'].map(reading => ({ reading }));
  let st = S.emptyState();
  ['ethics-2', 'fi-6', 'deriv-8'].forEach(r => st.coverage[r] = '2026-10-01');
  st.lastSessionDate = '2026-10-23';
  // Everything seen and not due for days.
  questions.forEach(q => st.q[q.id] = { box: 3, due: '2026-10-30', seen: 2, right: 2, last: '2026-10-22' });
  st.recap = { 'deriv-8': { last: T, mark: 'shaky' }, 'fi-6': { last: T, mark: 'solid' } };
  const ids = build(st);
  assert.ok(ids.filter(id => readingOf(id) === 'deriv-8').length >= 12, 'shaky reading should dominate');
  assert.strictEqual(S.buildRecapDeck({ recaps, state: st, curriculum, questions, today: T })[0], 'deriv-8');
  const later = S.buildSession({ questions, curriculum, state: st, today: '2026-10-28' }).ids;
  assert.ok(later.filter(id => readingOf(id) === 'deriv-8').length < 12, 'shaky effect should expire after 3 days');
  st.coverage = { 'fi-6': T };
  assert.deepStrictEqual(S.buildRecapDeck({ recaps, state: st, curriculum, questions, today: T }), ['fi-6']);
});

console.log(`\n${passed} passed`);
