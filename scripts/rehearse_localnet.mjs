import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createServer as netServer } from 'node:net';
import { resolve } from 'node:path';
import { allocationCommitment } from './feast/score.mjs';
import { once } from 'node:events';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import { createServer } from 'vite';

// Never reads a personal client config or keystore. Signing keys live only in memory.
const sui = process.env.SUI_BIN || 'sui';
try {execFileSync(sui,['--version'],{stdio:'pipe'});}catch {throw Error('Sui CLI unavailable. Install sui on PATH or set SUI_BIN to the pinned executable.');}
await mkdir('tmp',{recursive:true});
const directory = await mkdtemp(resolve('tmp/viper-localnet-'));
const delay = ms => new Promise(r => setTimeout(r, ms));
async function port() {
  const server = netServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const number = server.address().port; await new Promise(r => server.close(r)); return number;
}
const rpcPort = await port(), faucetPort = await port();
const url = `http://127.0.0.1:${rpcPort}`;
const client = new SuiJsonRpcClient({ url, network: 'localnet' });
const wallets = Array.from({length: 4}, () => Ed25519Keypair.generate());
const addresses = wallets.map(k => k.toSuiAddress()), signer = wallets[0];
let node, vite, nodeError;
const receipts = [];
async function execute(label, transaction, failure) {
  transaction.setGasBudget(2_000_000_000);
  const result = await client.signAndExecuteTransaction({ transaction, signer, options: { showEffects: true, showObjectChanges: true, showEvents: true } });
  await client.waitForTransaction({digest: result.digest});
  if (failure) {
    assert.equal(result.effects.status.status, 'failure', `${label} must fail`);
    assert.match(result.effects.status.error, failure, `${label} unexpected abort`);
  } else assert.equal(result.effects.status.status, 'success', `${label}: ${result.effects.status.error}`);
  receipts.push({label, digest: result.digest, status: result.effects.status.status,gasUsed:result.effects.gasUsed});
  console.log(`${label}: ${result.effects.status.status}`); return result;
}
function created(result, suffix) {
  const found = result.objectChanges.filter(o => o.type === 'created' && o.objectType.endsWith(suffix));
  assert.equal(found.length, 1, `Expected one ${suffix}`); return found[0].objectId;
}
async function time() {
  const {data} = await client.getObject({id: '0x6', options: {showContent: true}});
  return Number(data.content.fields.timestamp_ms);
}
const txCall = (target, args, types = []) => {
  const tx = new Transaction(); tx.moveCall({target, arguments: args(tx), typeArguments: types}); return tx;
};
try {
  node = spawn(sui, ['start', '--with-faucet=127.0.0.1:'+faucetPort, '--force-regenesis', '--fullnode-rpc-port', String(rpcPort), '--committee-size', '1'], {cwd:directory, env:{...process.env,SUI_CONFIG_DIR:directory,TMPDIR:directory}, stdio:['ignore','pipe','pipe']});
  node.on('error', error => {nodeError = error;});
  // Drain node logs without printing generated validator/faucet configuration.
  node.stdout.resume(); node.stderr.resume();
  let ready = false;
  for (let i=0;i<120;i++) {
    if (nodeError) throw nodeError;
    if (node.exitCode !== null || node.signalCode !== null) throw new Error(`Isolated node exited (${node.exitCode ?? node.signalCode})`);
    try { await time(); ready=true; break; } catch { await delay(500); }
  }
  assert(ready, 'Localnet startup timeout');
  let faucetReady=false;
  for(let i=0;i<120;i++) {try {await requestSuiFromFaucetV2({host:`http://127.0.0.1:${faucetPort}`,recipient:addresses[0]}); faucetReady=true; break;} catch {await delay(500);}}
  assert(faucetReady,'Local faucet timeout');
  const gasDeadline = Date.now()+30_000;
  while (!(await client.getCoins({owner:addresses[0]})).data.length) { assert(Date.now()<gasDeadline,'Faucet timeout'); await delay(250); }
  console.log('Isolated localnet ready; building pinned package.');
  const build = execFileSync(sui, ['move','build','--path',resolve('viper'),'--build-env','testnet','--dump-bytecode-as-base64','--no-tree-shaking'], {encoding:'utf8', maxBuffer:20*1024*1024});
  const {modules,dependencies} = JSON.parse(build.slice(build.indexOf('{')));
  const publish = new Transaction(); const [upgrade] = publish.publish({modules,dependencies}); publish.transferObjects([upgrade],publish.pure.address(addresses[0]));
  const published = await execute('Publish', publish);
  const packageId = published.objectChanges.find(o=>o.type==='published').packageId;
  const coinType = `${packageId}::v1per::V1PER`;
  const upgradeCapId=created(published,'::package::UpgradeCap'), launchCap=created(published,'::v1per::LaunchCap');
  const metadata=created(published,`::coin_registry::MetadataCap<${coinType}>`);
  const pendingCurrency=created(published,`::coin_registry::Currency<${coinType}>`);
  const {data: receiving} = await client.getObject({id:pendingCurrency});
  const registered = await execute('Register Currency',txCall('0x2::coin_registry::finalize_registration',tx=>[tx.object('0xc'),tx.receivingRef({objectId:pendingCurrency,version:receiving.version,digest:receiving.digest})],[coinType]));
  const currencyId=created(registered,`::coin_registry::Currency<${coinType}>`);
  const metadataTx=new Transaction();
  metadataTx.moveCall({target:'0x2::coin_registry::set_icon_url',typeArguments:[coinType],arguments:[metadataTx.object(currencyId),metadataTx.object(metadata),metadataTx.pure.string('https://example.invalid/localnet-v1per.png')]});
  metadataTx.moveCall({target:'0x2::coin_registry::delete_metadata_cap',typeArguments:[coinType],arguments:[metadataTx.object(currencyId),metadataTx.object(metadata)]});
  const metadataReceipt=await execute('Set test icon and delete metadata authority',metadataTx);
  const vaultOpensAtMs=(await time())+5000;
  const allocation=await execute('Allocate distinct ephemeral custody',txCall(`${packageId}::launch::allocate`,tx=>[tx.object(launchCap),...addresses.map(a=>tx.pure.address(a)),tx.pure.u64(vaultOpensAtMs),tx.object('0x6')]));
  const vaultId=created(allocation,'::lock_vault::Vault'), vaultAdminCapId=created(allocation,'::lock_vault::AdminCap');
  const claimsId=created(allocation,'::free_claims::Pool'), claimsAdminCapId=created(allocation,'::free_claims::AdminCap');
  const feastId=created(allocation,'::feast::Pool'), feastAdminCapId=created(allocation,'::feast::AdminCap');
  const immutable=await execute('Make package immutable',txCall('0x2::package::make_immutable',tx=>[tx.object(upgradeCapId)]));
  await execute('Approve free claimant',txCall(`${packageId}::free_claims::approve`,tx=>[tx.object(claimsId),tx.object(claimsAdminCapId),tx.pure.vector('address',[addresses[0]]),tx.object('0x6')]));
  const freeClaimsStartMs=(await time())+7*86400000+10_000;
  await execute('Schedule free window with seven-day notice',txCall(`${packageId}::free_claims::schedule`,tx=>[tx.object(claimsId),tx.object(claimsAdminCapId),tx.pure.u64(freeClaimsStartMs),tx.object('0x6')]));
  await execute('Reject premature free claim',txCall(`${packageId}::free_claims::claim`,tx=>[tx.object(claimsId),tx.object('0x6')]), /free_claims.*(?:, 1\)|code: 1)/);
  const commitment=[...Buffer.from(allocationCommitment([{sui:addresses[0],amountBaseUnits:'10000000000',lockMonths:12}]),'hex')];
  await execute('Commit Feast allocation CSV',txCall(`${packageId}::feast::set_allocations`,tx=>[tx.object(feastId),tx.object(feastAdminCapId),tx.pure.vector('address',[addresses[0]]),tx.pure.vector('u64',[10_000_000_000]),tx.pure.vector('u64',[12]),tx.pure.vector('u8',commitment),tx.pure.u64(1),tx.pure.bool(true),tx.object('0x6')]));
  await execute('Reject premature Feast finalization',txCall(`${packageId}::feast::finalize`,tx=>[tx.object(feastId),tx.object(feastAdminCapId),tx.object(vaultId),tx.object(currencyId),tx.pure.vector('u8',commitment),tx.object('0x6')]), /feast.*(?:, 5\)|code: 5)/);
  const batchGas=[];
  const emptyHash=[...Buffer.from(allocationCommitment([]),'hex')];
  await execute('Remove allocation and restart review',txCall(`${packageId}::feast::set_allocations`,tx=>[tx.object(feastId),tx.object(feastAdminCapId),tx.pure.vector('address',[addresses[0]]),tx.pure.vector('u64',[0]),tx.pure.vector('u64',[0]),tx.pure.vector('u8',emptyHash),tx.pure.u64(0),tx.pure.bool(true),tx.object('0x6')]));
  let previousRows=[];
  for(const size of [100,250,500,1000]) {
    if(previousRows.length) await execute(`Clear ${previousRows.length} benchmark rows`,txCall(`${packageId}::feast::set_allocations`,tx=>[tx.object(feastId),tx.object(feastAdminCapId),tx.pure.vector('address',previousRows.map(r=>r.sui)),tx.pure.vector('u64',previousRows.map(()=>0)),tx.pure.vector('u64',previousRows.map(()=>0)),tx.pure.vector('u8',emptyHash),tx.pure.u64(0),tx.pure.bool(true),tx.object('0x6')]));
    const rows=Array.from({length:size},(_,i)=>({sui:'0x'+(i+1).toString(16).padStart(64,'0'),amountBaseUnits:'1000000',lockMonths:0}));
    const hash=[...Buffer.from(allocationCommitment(rows),'hex')];
    const tx=txCall(`${packageId}::feast::set_allocations`,tx=>[tx.object(feastId),tx.object(feastAdminCapId),tx.pure.vector('address',rows.map(r=>r.sui)),tx.pure.vector('u64',rows.map(r=>r.amountBaseUnits)),tx.pure.vector('u64',rows.map(r=>r.lockMonths)),tx.pure.vector('u8',hash),tx.pure.u64(size),tx.pure.bool(true),tx.object('0x6')]);
    try {
      const result=await execute(`Allocation batch ${size}`,tx);
      const g=result.effects.gasUsed;
      previousRows=rows;
      batchGas.push({size,freshTable:true,status:'success',...g,netGasMist:String(BigInt(g.computationCost)+BigInt(g.storageCost)-BigInt(g.storageRebate))});
    } catch(error) {
      if(size!==1000)throw error;
      assert.match(String(error),/maximum pure argument size is 16384/);
      batchGas.push({size,status:'rejected',reason:String(error).slice(0,500)});
      console.log('Allocation batch 1000 rejected by transaction/contract limit.');
    }
  }
  while (await time()<vaultOpensAtMs) await delay(250);
  const inventory=(await client.getCoins({owner:addresses[0],coinType})).data[0]; assert(inventory);
  const deposit=new Transaction(); const [principal]=deposit.splitCoins(deposit.object(inventory.coinObjectId),[deposit.pure.u64(10_000_000_000)]);
  deposit.moveCall({target:`${packageId}::lock_vault::deposit`,arguments:[deposit.object(vaultId),principal,deposit.pure.u64(12),deposit.object('0x6')]});
  const opened=await execute('Deposit with faucet gas',deposit), position=created(opened,'::lock_vault::Position');
  const exited=await execute('Early withdraw',txCall(`${packageId}::lock_vault::withdraw`,tx=>[tx.object(vaultId),tx.object(position),tx.object('0x6')]));
  const burn=BigInt(exited.events.find(e=>e.type.endsWith('::lock_vault::Closed')).parsedJson.pending_burn);
  assert(burn>0n,'Early exit must generate burn inventory');
  await execute('Flush actual supply burn',txCall(`${packageId}::lock_vault::flush_burns`,tx=>[tx.object(vaultId),tx.object(currencyId)]));
  const localManifest={...JSON.parse(await (await import('node:fs/promises')).readFile('src/launch.json','utf8')),network:'localnet',status:'verified',packageId,coinType,currencyId,vaultId,claimsId,feastId,vaultAdminCapId,claimsAdminCapId,feastAdminCapId,upgradeCapId,founder:addresses[0],community:addresses[1],initialLiquidity:addresses[2],laterLiquidity:addresses[3],vaultOpensAtMs,freeClaimsStartMs,publishDigest:published.digest,metadataDigest:metadataReceipt.digest,allocationDigest:allocation.digest,immutableDigest:immutable.digest};
  vite=await createServer({server:{middlewareMode:true,ws:false},appType:'custom'});
  const {readChainState,verifyUpgradeCap}=await vite.ssrLoadModule('/src/chainState.ts');
  const state=await readChainState(client,AbortSignal.timeout(20_000),localManifest);
  await assert.rejects(verifyUpgradeCap(client,{...localManifest,upgradeCapId:addresses[3]},AbortSignal.timeout(20_000)));
  await assert.rejects(verifyUpgradeCap(client,{...localManifest,packageId:addresses[3]},AbortSignal.timeout(20_000)));
  assert(coinType.endsWith('::v1per::V1PER'));
  assert.equal(state.c.symbol,'V1PER');
  assert.equal(state.c.name,'V1PER Coin');
  assert.equal(BigInt(state.c.supply.BurnOnly),1_000_000_000_000_000n-burn);
  assert.equal(BigInt(state.v.pending_burn),0n); assert.equal(BigInt(state.v.reward_committed),0n);
  assert.equal(BigInt(state.f.reward_reserve),0n);
  const skippedClockWarps=['Successful free claim after seven-day notice; approved_claim_receives_exact_amount unit test','Feast finalize after review and locked/liquid claims; Feast unit tests','Mature exit, vesting and both expiry burns; Move clock-warp tests'];
  await mkdir('tmp',{recursive:true}); await writeFile('tmp/localnet-rehearsal.json',JSON.stringify({localManifest,batchGas,currencyIdentity:{coinType,symbol:state.c.symbol,name:state.c.name},receipts,burnBaseUnits:burn.toString(),readChainState:'passed: authenticated create/make_immutable/delete; random ID and other package rejected',skippedClockWarps},null,2)+'\n');
  console.log(JSON.stringify({result:'PASS',transactions:receipts.length,chainState:'verified',skippedClockWarps},null,2));
} finally {
  if(vite) await vite.close();
  if(node?.pid && node.exitCode===null && node.signalCode===null) {const stopped=once(node,'exit'); node.kill('SIGTERM'); await Promise.race([stopped,delay(3000)]); if(node.exitCode===null && node.signalCode===null) {node.kill('SIGKILL'); await stopped;}}
  await rm(directory,{recursive:true,force:true});
}
