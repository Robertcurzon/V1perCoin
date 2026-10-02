const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const fixtures = new Map();
function load(file) {
  file = path.resolve(file);
  if (fixtures.has(file)) return fixtures.get(file);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, AbortSignal, require: (name) => {
    if (!name.startsWith('.')) return require(name);
    const resolved = path.resolve(path.dirname(file), name);
    if (fixtures.has(resolved)) return fixtures.get(resolved);
    return name.endsWith('.json') ? JSON.parse(fs.readFileSync(resolved, 'utf8')) : load(`${resolved}.ts`);
  } });
  return exports;
}
const { readDexVolume } = load('src/volume.ts');
const { CurrencyBcs, VaultBcs, ClaimsBcs, PositionBcs } = load('src/chainSchemas.ts');
const id = `0x${'a'.repeat(64)}`, other = `0x${'b'.repeat(64)}`;
const coin = `${id}::v1pr::V1PR`;
const pair = { chainId: 'sui', pairAddress: id, baseToken: { address: coin }, quoteToken: { address: '0x2::sui::SUI' }, volume: { h24: 125.5 } };
assert.equal(readDexVolume({ pairs: [pair] }, id, coin), 125.5);
assert.equal(readDexVolume({ pairs: [{ ...pair, volume: { h24: 0 } }] }, id, coin), 0);
for (const changed of [{ chainId: 'ethereum' }, { pairAddress: other }, { baseToken: { address: `${other}::v1pr::V1PR` } }, { volume: {} }, { volume: { h24: -1 } }, { volume: { h24: Infinity } }]) assert.throws(() => readDexVolume({ pairs: [{ ...pair, ...changed }] }, id, coin));
assert.throws(() => readDexVolume({ pairs: null }, id, coin));
const currency = CurrencyBcs.parse(CurrencyBcs.serialize({
  id, decimals: 6, name: 'Viper Coin', symbol: 'V1PR', description: '', icon_url: '',
  supply: { BurnOnly: '999999999999999' }, regulated: { Unregulated: true },
  treasury_cap_id: id, metadata_cap_id: { Deleted: true }, extra_fields: [],
}).toBytes());
assert.equal(currency.supply.$kind, 'BurnOnly'); assert.equal(currency.supply.BurnOnly, '999999999999999');
const position = PositionBcs.parse(PositionBcs.serialize({ id, vault: id, owner: other, principal: '1000000000000', reward: '53000000000', start_ms: '1', duration_ms: '62208000000' }).toBytes());
assert.equal(position.reward, '53000000000'); assert.equal(position.owner, other);
const vault = VaultBcs.parse(VaultBcs.serialize({ id, rewards: '100', community: id, founder: other, paused: false, total_locked: '1000', reward_committed: '30', reward_paid: '20', reward_funded: '150', community_paid: '7', founder_paid: '1', burned: '2', locks_opened: '5', locks_closed: '2' }).toBytes());
assert.equal(BigInt(vault.rewards) + BigInt(vault.reward_committed) + BigInt(vault.reward_paid), BigInt(vault.reward_funded));
const pool = ClaimsBcs.parse(ClaimsBcs.serialize({ id, inventory: '99990000000000', eligibility: { id, size: '1' }, approved: '1', claimed: '1', end_ms: '7776000000' }).toBytes());
assert.equal(pool.claimed, '1');
console.log('Monitor checks passed: verified-pair volume rejects mismatches and missing data; BCS supply, escrow, claim, and activity fields preserve integer precision.');

const { explorerUrl, dataIsStale } = load('src/explorer.ts');
const txDigest = 'A'.repeat(44);
assert.equal(explorerUrl('testnet', 'object', id), `https://suiscan.xyz/testnet/object/${id}`);
assert.equal(explorerUrl('mainnet', 'coin', coin), `https://suiscan.xyz/mainnet/coin/${encodeURIComponent(coin)}/txs`);
assert.equal(explorerUrl('mainnet', 'tx', txDigest), `https://suiscan.xyz/mainnet/tx/${txDigest}`);
for (const args of [['devnet','object',id],['mainnet','account',''],['mainnet','object',`0x${'0'.repeat(64)}`],['mainnet','tx','https://bad.example'],['mainnet','coin',`${coin}/../../account/evil`]]) assert.equal(explorerUrl(...args), null);
assert.equal(dataIsStale(0, 100000), true);
assert.equal(dataIsStale(100000, 190001), true);
assert.equal(dataIsStale(100000, 150000), false);
assert.equal(dataIsStale(200000, 100000), true);
const { EventSchemas, decodeActivity } = load('src/activity.ts');
const event = { eventType: `${id}::lock_vault::Opened`, transactionDigest: txDigest, eventIndex: 0, checkpoint: '9007199254740993', sender: other, bcs: EventSchemas.Opened.serialize({ vault: id, timestamp_ms: '1000', position: other, owner: other, principal: '1000000000000', months: '24', reward: '53000000000', maturity_ms: '62208001000' }).toBytes() };
assert.equal(decodeActivity(event, id, id, id).amount, '1000000000000');
assert.equal(decodeActivity(event, id, other, id), null);
assert.equal(decodeActivity({ ...event, eventType: `${other}::lock_vault::Opened` }, id, id, id), null);
assert.equal(decodeActivity({ ...event, eventType: `${id}::unrelated::Opened` }, id, id, id), null);
assert.throws(() => decodeActivity({ ...event, bcs: new Uint8Array([0]) }, id, id, id));
const claimEvent = { ...event, eventType: `${id}::free_claims::Claimed`, bcs: EventSchemas.Claimed.serialize({ pool: id, timestamp_ms: '1000', owner: other, amount: '10000000000' }).toBytes() };
assert.equal(decodeActivity(claimEvent, id, id, id).label, 'Free claim paid');
assert.equal(decodeActivity(claimEvent, id, id, other), null);
fixtures.set(path.resolve('src/launch.json'), { currencyId: id, vaultId: id, claimsId: id, founder: other, community: id });
const { validateState } = load('src/chainState.ts');
validateState(currency, vault, pool);
for (const [c,v,p] of [
  [{ ...currency, id: other },vault,pool],
  [{ ...currency, metadata_cap_id: { $kind: 'Claimed', Claimed: id } },vault,pool],
  [{ ...currency, supply: { $kind: 'BurnOnly', BurnOnly: '1000000000000001' } },vault,pool],
  [currency,{ ...vault, reward_funded: '149' },pool],
  [currency,{ ...vault, founder: id },pool],
  [currency,{ ...vault, locks_closed: '6' },pool],
  [currency,vault,{ ...pool, claimed: '2' }],
  [currency,vault,{ ...pool, approved: '10001' }],
  [currency,vault,{ ...pool, inventory: '100000000000000' }],
]) assert.throws(() => validateState(c,v,p));
console.log('Verification checks passed: explorer routing, freshness, scoped event decoding and fail-closed currency/accounting checks.');

const { isManifestConfigured } = load('src/manifest.ts');
const manifest = { network: 'testnet', status: 'verified', packageId: id, currencyId: id, vaultId: id, claimsId: id, founder: other, community: id, publicReserve: id, initialLiquidity: id, laterLiquidity: id, vaultAdminCapId: id, claimsAdminCapId: id, coinType: coin, publishDigest: txDigest, allocationDigest: txDigest, immutableDigest: txDigest, metadataDigest: txDigest, dexPairId: '' };
assert.equal(isManifestConfigured(manifest), true);
for (const patch of [{ network: 'devnet' },{ publicReserve: '' },{ metadataDigest: '' },{ founder: id },{ vaultAdminCapId: `0x${'0'.repeat(64)}` },{ publishDigest: '<script>' },{ coinType: `${other}::v1pr::V1PR` }]) assert.equal(isManifestConfigured({ ...manifest, ...patch }), false);
console.log('Manifest checks passed: required custody, authorities, network, coin type and receipts.');
