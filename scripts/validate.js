// Run: node scripts/validate.js [file ...]   (default: every data/questions/*.json)
// Exit code 1 on any error. Warnings don't fail.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KINDS = ['concept', 'calc', 'memorise', 'exam'];
const LIMITS = { stem: 420, examStem: 750, option: 160, explanation: 360, remember: 130 };

const curriculum = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));
const readings = {}, losIds = {};
curriculum.topics.forEach(t => t.readings.forEach(r => {
  readings[r.id] = t.id;
  r.los.forEach(l => { losIds[l.id] = r.id; });
}));

let files = process.argv.slice(2);
if (!files.length) {
  const dir = path.join(ROOT, 'data/questions');
  files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json').map(f => path.join(dir, f));
}

let errors = 0, warnings = 0;
const seenIds = {}, seenStems = {};
const err = (f, m) => { errors++; console.log(`ERROR ${path.basename(f)}: ${m}`); };
const warn = (f, m) => { warnings++; console.log(`warn  ${path.basename(f)}: ${m}`); };

files.forEach(file => {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return err(file, `not valid JSON: ${e.message}`); }
  if (!Array.isArray(data.questions)) return err(file, 'missing "questions" array');

  const counts = { concept: 0, calc: 0, memorise: 0, exam: 0 }, answers = [0, 0, 0];
  data.questions.forEach((q, i) => {
    const at = `#${i} ${q.id || '(no id)'}`;
    const e = m => err(file, `${at}: ${m}`);
    if (typeof q.id !== 'string' || !q.id) return e('missing id');
    if (seenIds[q.id]) e(`duplicate id (also in ${seenIds[q.id]})`); else seenIds[q.id] = path.basename(file);
    if (!readings[q.reading]) e(`unknown reading "${q.reading}"`);
    else if (readings[q.reading] !== q.topic) e(`reading "${q.reading}" is not in topic "${q.topic}"`);
    if (!losIds[q.los]) e(`unknown los "${q.los}"`);
    else if (losIds[q.los] !== q.reading) e(`los "${q.los}" belongs to ${losIds[q.los]}, not ${q.reading}`);
    if (!KINDS.includes(q.kind)) e(`kind must be one of ${KINDS.join('/')}`); else counts[q.kind]++;
    if (typeof q.stem !== 'string' || q.stem.trim().length < 15) e('stem missing/too short');
    else if (q.stem.length > (q.kind === 'exam' ? LIMITS.examStem : LIMITS.stem)) e(`stem too long (${q.stem.length})`);
    if (!Array.isArray(q.options) || q.options.length !== 3 || q.options.some(o => typeof o !== 'string' || !o.trim())) e('options must be exactly 3 non-empty strings');
    else {
      if (new Set(q.options.map(o => o.trim().toLowerCase())).size !== 3) e('duplicate options');
      q.options.forEach(o => { if (o.length > LIMITS.option) e(`option too long (${o.length})`); if (/^\s*[ABC][.)]\s/.test(o)) e('option starts with a letter label; the app adds A/B/C'); });
      if (q.options.some(o => /all of the above|none of the above/i.test(o))) e('no "all/none of the above"');
    }
    if (![0, 1, 2].includes(q.answer)) e('answer must be 0, 1 or 2'); else answers[q.answer]++;
    if (typeof q.explanation !== 'string' || q.explanation.trim().length < 20) e('explanation missing/too short');
    else {
      if (q.explanation.length > LIMITS.explanation) e(`explanation too long (${q.explanation.length} > ${LIMITS.explanation})`);
      if ((q.explanation.match(/[.!?](\s|$)/g) || []).length > 4) warn(file, `${at}: explanation has >4 sentences`);
    }
    if (q.kind === 'memorise' && !q.remember) e('memorise questions need a "remember" one-liner');
    if (q.remember && q.remember.length > LIMITS.remember) e(`remember too long (${q.remember.length})`);
    const sk = (q.stem || '').trim().toLowerCase();
    if (seenStems[sk]) warn(file, `${at}: same stem as ${seenStems[sk]}`); else seenStems[sk] = q.id;
  });

  // Recap cards: one per reading of the file's topic (skipped for the mixed dummy file).
  const topic = curriculum.topics.find(t => t.id === data.topic);
  if (topic) {
    const recaps = data.recaps || [];
    const have = {};
    recaps.forEach((c, i) => {
      const e = m => err(file, `recap #${i} ${c.reading || '?'}: ${m}`);
      if (readings[c.reading] !== topic.id) return e('reading not in this topic');
      if (have[c.reading]) e('duplicate recap for reading'); have[c.reading] = true;
      if (!Array.isArray(c.ideas) || c.ideas.length !== 3) e('ideas must be exactly 3 strings');
      else c.ideas.forEach((s, k) => { if (typeof s !== 'string' || s.length < 40 || s.length > 140) e(`idea ${k + 1} must be 40-140 chars (${(s || '').length})`); });
      if (c.formula != null && (typeof c.formula !== 'string' || c.formula.length > 120 || /\\|<[a-z]/i.test(c.formula))) e('formula must be plain text <=120 chars (no LaTeX/HTML)');
      if (typeof c.trap !== 'string' || c.trap.length < 40 || c.trap.length > 170) e(`trap must be 40-170 chars (${(c.trap || '').length})`);
    });
    const missing = topic.readings.filter(r => !have[r.id]).map(r => r.id);
    if (missing.length) warn(file, `no recap card for: ${missing.join(', ')}`);
    const noQ = topic.readings.filter(r => !data.questions.some(q => q.reading === r.id)).map(r => r.id);
    if (noQ.length) warn(file, `no questions for: ${noQ.join(', ')}`);
    console.log(`${path.basename(file)}: ${recaps.length}/${topic.readings.length} recap cards`);
  }

  const n = data.questions.length;
  if (n && counts.calc / n > 0.25) warn(file, `calc share ${(100 * counts.calc / n).toFixed(0)}% > 25%`);
  if (n >= 10) answers.forEach((c, k) => { if (c / n > 0.45) warn(file, `answer ${'ABC'[k]} is correct in ${(100 * c / n).toFixed(0)}% of questions`); });
  console.log(`${path.basename(file)}: ${n} questions (concept ${counts.concept}, calc ${counts.calc}, memorise ${counts.memorise}, exam ${counts.exam}); answers A/B/C = ${answers.join('/')}`);
});

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
