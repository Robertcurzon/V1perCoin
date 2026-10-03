const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const rates = require('../src/rewardSchedule.json');
const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'src/economics.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, require: (name) => { assert.equal(name, './rewardSchedule.json'); return rates; }, BigInt });
const { parseAmount, netReward, fullReward, exitPreview, MONTH_MS, ratePpm, formatAmount } = exportsObject;
assert.equal(rates.length, 24);
assert.equal(rates[0], 10000); assert.equal(rates[23], 100000);
const move = fs.readFileSync(path.join(root, 'viper/sources/reward_schedule.move'), 'utf8');
const moveRates = move.match(/vector\[([^\]]+)\]/)[1].split(',').map(Number);
assert.deepEqual(moveRates, rates);
for (let m = 1; m <= 24; m++) {
  const expected = Math.floor(10000 * 10 ** ((m - 1) / 23) + 1e-8);
  assert.equal(rates[m - 1], expected);
  if (m > 1) assert.ok(ratePpm(m) > ratePpm(m - 1));
  const p = parseAmount('1000000');
  assert.equal(netReward(p, m), p * BigInt(rates[m - 1]) * BigInt(m) / 12_000_000n);
  const q = fullReward(p, m); const duration = BigInt(m) * MONTH_MS;
  const instant = exitPreview(p, q, duration, 0n);
  assert.equal(instant.fee, 50_000n * 1_000_000n); assert.equal(instant.earned, 0n);
  for (const [elapsed, fee] of [[duration / 10n, 45_000n], [duration * 9n / 10n, 5_000n]]) {
    const early = exitPreview(p, q, duration, elapsed);
    assert.equal(early.fee, fee * 1_000_000n);
    assert.equal(early.community + early.burn + early.founder, early.fee);
    assert.equal(early.net, p - early.fee + early.earned);
  }
  for (const elapsed of [duration, duration + MONTH_MS]) {
    const mature = exitPreview(p, q, duration, elapsed);
    assert.equal(mature.fee, 0n); assert.equal(mature.earned, q); assert.equal(mature.net, p - mature.fee + q);
  }
}
assert.equal(fullReward(parseAmount('1000000'), 24), 200_000_000_000n);
assert.equal(parseAmount('0.000001'), 1n); assert.equal(formatAmount(1234567n), '1.234567');
for (const text of ['0', '-1', '1e6', '1.0000001', '18446744073709.551616', 'Infinity', '']) assert.throws(() => parseAmount(text));
assert.throws(() => ratePpm(0)); assert.throws(() => ratePpm(25)); assert.throws(() => ratePpm(1.5));
assert.equal(fs.readFileSync(path.join(root, 'docs/WHITEPAPER.md'), 'utf8'), fs.readFileSync(path.join(root, 'public/WHITEPAPER.md'), 'utf8'));
console.log('Economics checks passed: all 24 exponential terms, Move/site parity, payout boundaries, precision, and white paper parity.');

assert.equal(formatAmount(-1234567n), '-1.234567');
for (let m = 1; m <= 24; m++) {
  const p = parseAmount('1000000');
  const q = fullReward(p, m);
  const mature = exitPreview(p, q, BigInt(m) * MONTH_MS, BigInt(m) * MONTH_MS);
  assert.ok(mature.net > p, `Term ${m} must be net positive before gas.`);
}

assert.equal(netReward(parseAmount('10000'), 1), 8_333_333n);
assert.equal(netReward(parseAmount('10000'), 24), 2_000_000_000n);
assert.equal(exitPreview(parseAmount('10000'), fullReward(parseAmount('10000'), 24), 24n * MONTH_MS, 24n * MONTH_MS).net, 12_000_000_000n);

for (let m = 1; m < 24; m++) {
  const termRate = Number(ratePpm(m)) / 1e6 * m / 12;
  assert.ok((1 + termRate) ** (24 / m) - 1 < .2, `Compounded ${m}-month term must be below 20%.`);
  if (m > 1) assert.ok(termRate / m > (Number(ratePpm(m-1)) / 1e6 / 12));
}
for (let T = 1; T <= 24; T++) for (let m = 0; m < T; m++) {
  const p = parseAmount('1000000');
  const early = exitPreview(p, fullReward(p,T), BigInt(T)*MONTH_MS, BigInt(m)*MONTH_MS);
  const finished = m === 0 ? p : p + netReward(p,m);
  assert.ok(early.net <= finished);
  assert.equal(early.earned, m === 0 ? 0n : netReward(p,m));
}

const vectors = JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/economics.json')));
for (const v of vectors) {
  const p=BigInt(v.principal), reserved=fullReward(p,v.term);
  assert.equal(reserved.toString(),v.reserved);
  const result=exitPreview(p,reserved,BigInt(v.term)*MONTH_MS,BigInt(v.elapsedMs));
  for (const field of ['earned','fee','community','burn','founder','net']) assert.equal(result[field].toString(),v[field]);
}
require('node:child_process').execFileSync(process.execPath,['scripts/generate_economics_vectors.mjs','--check'],{cwd:root,stdio:'inherit'});
