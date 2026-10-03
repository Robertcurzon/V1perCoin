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
    return name.endsWith('.json') ? JSON.parse(fs.readFileSync(resolved, 'utf8')) : load(/\.(mjs|ts)$/.test(resolved) ? resolved : `${resolved}.ts`);
  } });
  return exports;
}
const { readDexVolume } = load('src/volume.ts');
const { CurrencyBcs, VaultBcs, ClaimsBcs, PositionBcs, FeastBcs } = load('src/chainSchemas.ts');
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
const vault = VaultBcs.parse(VaultBcs.serialize({ id, rewards: '100', community: id, founder: other, paused: false, total_locked: '1000', reward_committed: '30', reward_paid: '20', reward_funded: '150', community_paid: '7', founder_paid: '1', burned: '2', pending_burn: '3', locks_opened: '5', locks_closed: '2', opens_at_ms:'604800000', feast_committed:'0' }).toBytes());
assert.equal(BigInt(vault.rewards) + BigInt(vault.reward_committed) + BigInt(vault.reward_paid), BigInt(vault.reward_funded));
const pool = ClaimsBcs.parse(ClaimsBcs.serialize({ id, inventory: '99990000000000', eligibility: { id, size: '1' }, approved: '1', claimed: '1', start_ms: '604800000', end_ms: '1814400000' }).toBytes());
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
const feast = FeastBcs.parse(FeastBcs.serialize({id, inventory:'0', allocations:{id,size:'2'}, allocated:'10000000000000',claimed:'10000000000000',burned:'90000000000000',finalized:true,start_ms:'604800000',allocations_hash:new Array(32).fill(7),last_change_ms:'0',locked_reward_required:'0',reward_reserve:'0',reservation_vault:id}).toBytes());
fixtures.set(path.resolve('src/launch.json'), { currencyId: id, vaultId: id, claimsId: id, feastId: id, founder: other, community: id, freeClaimsStartMs:604800000,vaultOpensAtMs:604800000 });
const { validateState } = load('src/chainState.ts');
validateState(currency, vault, pool, feast);
for (const [c,v,p] of [
  [{ ...currency, id: other },vault,pool],
  [{ ...currency, metadata_cap_id: { $kind: 'Claimed', Claimed: id } },vault,pool],
  [{ ...currency, supply: { $kind: 'BurnOnly', BurnOnly: '1000000000000001' } },vault,pool],
  [currency,{ ...vault, reward_funded: '149' },pool],
  [currency,{ ...vault, founder: id },pool],
  [currency,{ ...vault, locks_closed: '6' },pool],
  [currency,vault,{ ...pool, claimed: '2' }],
  [currency,vault,{ ...pool, approved: '10001' }],
  [currency,vault,{ ...pool, end_ms: '1814400001' }],
  [currency,vault,{ ...pool, eligibility: {id,size:'2'} }],
  [currency,vault,{ ...pool, end_ms:'0',start_ms:'0' }],
  [currency,vault,{ ...pool, inventory: '100000000000000' }],
]) assert.throws(() => validateState(c,v,p,feast));
console.log('Verification checks passed: explorer routing, freshness, scoped event decoding and fail-closed currency/accounting checks.');

const { isManifestConfigured } = load('src/manifest.ts');
const manifest = { network: 'testnet', status: 'verified', packageId: id, currencyId: id, vaultId: id, claimsId: id, founder: other, community: id, feastId:id, feastAdminCapId:id, upgradeCapId:id, feastOpen:false, feastStartMs:0, feastSubmissionUrl:'', freeClaimsStartMs:604800000,vaultOpensAtMs:604800000, freeClaimsApplicationUrl:'https://example.com/apply', feastTreasury:{ethereum:'',solana:'',dogecoin:'',memecore:''}, initialLiquidity: `0x${'c'.repeat(64)}`, laterLiquidity: `0x${'d'.repeat(64)}`, vaultAdminCapId: id, claimsAdminCapId: id, coinType: coin, publishDigest: txDigest, allocationDigest: txDigest, immutableDigest: txDigest, metadataDigest: txDigest, dexPairId: '' };
assert.equal(isManifestConfigured(manifest), true);
for (const patch of [{ network: 'devnet' },{ feastId: '' },{ upgradeCapId:'' },{ initialLiquidity:other },{ feastOpen:true },{ metadataDigest: '' },{ founder: id },{ vaultAdminCapId: `0x${'0'.repeat(64)}` },{ publishDigest: '<script>' },{ coinType: `${other}::v1pr::V1PR` }]) assert.equal(isManifestConfigured({ ...manifest, ...patch }), false);
console.log('Manifest checks passed: required custody, authorities, network, coin type and receipts.');

for (const patch of [{id:other},{inventory:'1'},{allocated:'1'},{claimed:'1000000000000001'},{finalized:false}]) assert.throws(() => validateState(currency,vault,pool,{...feast,...patch}));
const { ObjectError } = require('@mysten/sui/client');
const { objectAbsent, verifyUpgradeCap } = load('src/chainState.ts');
assert.equal(objectAbsent(new ObjectError('notExists','missing',{reason:'notFound',objectId:id})),true);
assert.equal(objectAbsent(new ObjectError('deleted','deleted',{reason:'deleted',objectId:id})),true);
assert.equal(objectAbsent(new ObjectError('UNKNOWN','unknown',{reason:'unknown',objectId:id})),false);
assert.equal(objectAbsent(new Error('not found')),false);
const { vestedAllocation, treasuryExplorer } = load('src/feastData.ts');
const { parseFeastReport } = load('src/feastReport.ts');
const report = {csvSha256:'a'.repeat(64),scriptCommit:'b'.repeat(40),windowStart:1000,liquidityProceedsPercent:25,usdScale:'100000000',receivedBaseUnits:{dogecoin:'100'},treasuryReceivedBaseUnits:{dogecoin:'101'},totalUsdScaled:'100000000',allocatedBaseUnits:'1000000',burnAtFinalizeBaseUnits:'99999999000000',clearingPrice:{usdNumerator:'100000000000000',tokenDenominator:'100000000000000'}};
assert.equal(parseFeastReport(report,['dogecoin'],1000),report);
for(const changed of [{receivedBaseUnits:{}},{treasuryReceivedBaseUnits:{}},{receivedBaseUnits:{dogecoin:'102'}},{treasuryReceivedBaseUnits:{dogecoin:'101',unexpected:'0'}},{allocatedBaseUnits:'1000001'},{burnAtFinalizeBaseUnits:'0'},{clearingPrice:null},{clearingPrice:{usdNumerator:'1',tokenDenominator:'1'}},{liquidityProceedsPercent:24},{windowStart:1001},{usdScale:'1'}]) assert.throws(()=>parseFeastReport({...report,...changed},['dogecoin'],1000));
assert.equal(parseFeastReport({...report,receivedBaseUnits:{dogecoin:'0'},treasuryReceivedBaseUnits:{dogecoin:'0'},totalUsdScaled:'0',allocatedBaseUnits:'0',burnAtFinalizeBaseUnits:'100000000000000',clearingPrice:null},['dogecoin'],1000).clearingPrice,null);
console.log('Feast report checks passed: explicit per-asset zeros, complete receipt totals, allocation conservation and exact clearing-price accounting.');
assert.equal(vestedAllocation({amount:'1001',claimed:'0',lock_months:'0'},0n),500n);
assert.equal(vestedAllocation({amount:'1001',claimed:'0',lock_months:'0'},30n*86400000n),750n);
assert.equal(vestedAllocation({amount:'1001',claimed:'0',lock_months:'0'},60n*86400000n),1001n);
assert.equal(vestedAllocation({amount:'1001',claimed:'0',lock_months:'24'},0n),1001n);
assert.equal(treasuryExplorer('ethereum','0x'+'1'.repeat(40)),'https://etherscan.io/address/0x'+'1'.repeat(40));
assert.equal(treasuryExplorer('ethereum','https://bad.example'),null);
void (async () => {
  for (const reason of ['notFound','deleted']) await verifyUpgradeCap({core:{getObject:async()=>{throw new ObjectError('absent','absent',{reason,objectId:id});}}},id,AbortSignal.timeout(1000));
  for (const error of [new Error('RPC timed out'),new ObjectError('UNKNOWN','unknown',{reason:'unknown',objectId:id}),new ObjectError('notFound','wrong lookup',{reason:'notFound',objectId:other})]) await assert.rejects(verifyUpgradeCap({core:{getObject:async()=>{throw error;}}},id,AbortSignal.timeout(1000)));
  await assert.rejects(verifyUpgradeCap({core:{getObject:async()=>({object:{}})}},id,AbortSignal.timeout(1000)),/still exists/);
  const panel=fs.readFileSync('src/FeastPanel.tsx','utf8');
  assert(panel.includes('!campaignOpen || !consent || !account'));
  assert(panel.includes('FEAST_DISCLOSURE'));
  assert(panel.includes('SIGN WALLET BINDING'));
  const rpcManifest = {...manifest, vaultId:`0x${'e'.repeat(64)}`, claimsId:`0x${'f'.repeat(64)}`, feastId:`0x${'1'.repeat(64)}`, upgradeCapId:`0x${'2'.repeat(64)}`};
  fixtures.set(path.resolve('src/launch.json'),rpcManifest);
  const rpcRead = load('src/chainState.ts').readChainState;
  const ClockBcs = load('src/chainSchemas.ts').ClockBcs;
  const content = (schema,value) => schema.serialize(value).toBytes();
  const rows = new Map([
    [rpcManifest.currencyId,{objectId:id,type:`0x2::coin_registry::Currency<${coin}>`,owner:{$kind:'Shared'},content:content(CurrencyBcs,{id,decimals:6,name:'Viper Coin',symbol:'V1PR',description:'',icon_url:'',supply:{BurnOnly:'999999999999999'},regulated:{Unregulated:true},treasury_cap_id:id,metadata_cap_id:{Deleted:true},extra_fields:[]})}],
    [rpcManifest.vaultId,{objectId:rpcManifest.vaultId,type:`${id}::lock_vault::Vault`,owner:{$kind:'Shared'},content:content(VaultBcs,{...vault,id:rpcManifest.vaultId})}],
    [rpcManifest.claimsId,{objectId:rpcManifest.claimsId,type:`${id}::free_claims::Pool`,owner:{$kind:'Shared'},content:content(ClaimsBcs,{...pool,id:rpcManifest.claimsId})}],
    [rpcManifest.feastId,{objectId:rpcManifest.feastId,type:`${id}::feast::Pool`,owner:{$kind:'Shared'},content:content(FeastBcs,{...feast,id:rpcManifest.feastId,reservation_vault:rpcManifest.vaultId})}],
    ['0x6',{objectId:'0x6',type:'0x2::clock::Clock',owner:{$kind:'Shared'},content:content(ClockBcs,{id:'0x6',timestamp_ms:'1000'})}],
  ]);
  const mock = {core:{getObject:async ({objectId})=>{
    if (objectId===rpcManifest.upgradeCapId) throw new ObjectError('deleted','deleted',{reason:'deleted',objectId});
    return {object:rows.get(objectId)};
  }}};
  assert.equal((await rpcRead(mock)).f.claimed,feast.claimed);
  const original = rows.get(rpcManifest.feastId);
  for (const patch of [{type:`${other}::feast::Pool`},{owner:{$kind:'AddressOwner',AddressOwner:id}}]) {
    rows.set(rpcManifest.feastId,{...original,...patch}); await assert.rejects(rpcRead(mock),/type or shared/);
  }
  rows.set(rpcManifest.feastId,original);
  await assert.rejects(rpcRead({core:{getObject:async()=>{throw new Error('RPC disconnected');}}}));
  console.log('RPC verification passed: shared Feast type, immutable capability and complete snapshot failure handling.');
  console.log('Feast checks passed: BCS accounting, exact vesting, safe Treasury links, consent gating and explicit upgrade absence versus RPC failure.');
})().catch(error=>{console.error(error);process.exitCode=1;});
