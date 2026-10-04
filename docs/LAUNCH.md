# V1PER Coin (V1PER) launch runbook

Economics are fixed in [the white paper](WHITEPAPER.md); release code is implemented locally. No token has been deployed. Use testnet first.

## Trust assumptions: public configuration and release procedures

Supply four nonzero, full-length Sui destination addresses: founder/Operations, Community, initial liquidity custodian, later liquidity custodian. Community must differ from founder. Publish who controls each wallet, the claim selection policy, and the admin capability owner. Publish all receiving addresses, including Dogecoin and MemeCore, and supply real paired-asset funds and select an exchange/LP custody policy before trading is enabled. The repository does not contain private keys and does not invent these addresses or funds.

## Verification

```sh
npm ci
npm run test:economics
npm run test:monitor
npm run test:whitepaper
npm run typecheck
npm run lint
npm run build
sui move test --path viper
```

`python3 scripts/generate_reward_schedule.py` regenerates the immutable 24-entry exponential schedule. Any change requires repeating checks and reviewing both outputs. Independent review must assess owned Position escrow, shared object contention, real Currency burns, recipient binding, fee precision, upgrade policy, claim discretion and wallet flows.

## Testnet rehearsal

1. Select a funded testnet signer. Confirm `sui client active-env` and its public address before any transaction. Publish `viper`; save the full JSON transaction result, package ID, LaunchCap, MetadataCap, UpgradeCap and Currency object sent to registry.
2. Call `0x2::coin_registry::finalize_registration` with the V1PER type argument, registry 0xc and the received Currency object. Record the resulting **shared** Currency ID. Verify symbol V1PER, name V1PER Coin, six decimals, initial one-billion supply and burn-only state.
3. Set a publicly hosted icon URL using the MetadataCap, then permanently fix metadata by deleting the metadata cap through Currency. Record the transaction. Before participant use, consume UpgradeCap with `0x2::package::make_immutable`; record the immutability digest. This prevents upgrades from adding mint/sweep paths or changing accepted lock terms.
4. Call `launch::allocate` with LaunchCap, founder, Community, initial liquidity custodian, later liquidity custodian, opens_at_ms equal to the published ordinary opening, and Clock 0x6. Record vault/free-claim/Feast pool IDs, all three AdminCaps and allocation digest. The free-claim pool starts unscheduled; allocation does not start its deadline. Each lock later reserves its full term reward from the 150-million pool. Reconcile all seven buckets to the initial mint.
5. Approve test addresses with `free_claims::approve`; schedule a start at least seven days ahead using `free_claims::schedule(pool, cap, start_ms, clock)`. Rehearse before-start rejection, the frozen allowlist, no rescheduling and the 14-day exclusive deadline. After opening, claim from an approved wallet; verify 10,000 V1PER arrives, a repeated claim fails, and an unapproved claim fails. Approval is administrative; publish the eligibility policy before opening real claims.
6. Update `src/launch.json` with exact testnet IDs, coin type, all four custody destinations, all three admin capability IDs, publish/allocation/immutability/metadata-deletion digests and `status: "verified"`. Connect a test wallet to the site. Claim, deposit 1- and 24-month positions, inspect transaction targets and payout preview, early-exit, and verify Community/founder receipts plus pending burn, then permissionless flushing and actual supply decrease. Confirm wrong-network signing is rejected by the wallet. Pausing must stop deposits and leave exits available. Long-term maturity/time boundaries, including the zero-fee mature exit, are tested locally with Sui's test Clock.
7. Reconcile available rewards + committed + paid = funded; locked principal is separate. Keep the site unpublished if any object or recipient verification fails. Record testnet results and independent review before mainnet publication.

## Trust assumptions: future mainnet publication

Repeat the reviewed flow against mainnet with mainnet funding and verified wallets. Do not reuse testnet object IDs or claim that testnet review is a mainnet audit. Before accepting participant funds, fix metadata and make the package immutable. Publish transaction records, coin type and all authorities. Configure `src/launch.json` for mainnet only after verification; the UI also checks object types and fee recipients before enabling transactions.

Size and fund a real V1PER trading pool using its reserved inventory plus verified paired assets. Reconcile the 25% commitment against all accepted Feast proceeds, including unbound-source receipts, rather than assuming the scorer's eligible USD total equals all proceeds. Publish receipt valuations, conversions, costs and actual paired funding. Reduce the opening token deposit or add paired capital if needed to preserve the clearing-price floor; do not automatically deposit 50M or the entire 200M reserve. In a constant-product pool, paired USD value / V1PER deposit is the initial unit price. For Cetus, rehearse the initialized price, ticks and both token requirements; this balance-ratio formula is not generally applicable to a concentrated position. Publish opening balances, price implied by those balances, LP custodian and withdrawal policy; then add an explorer/trading link verified against the authentic coin type. Until then there is no buy link or liquidity claim. Operations/reserve allocations remain wallet custody without vesting.

## After opening

Monitor available capacity, outstanding reservations, funded/paid rewards, lock principal, fee receipts and burns. New reward-bearing locks stop when capacity is insufficient. Existing obligations remain funded; early exits release unused reservations. `lock_vault::fund` accepts existing V1PER without inflation. At 14 days after the scheduled opening anyone may invoke `free_claims::burn_unclaimed`; expiry alone does not execute a burn automatically. Publish Community awards and Operations spending with transaction digests.

This runbook names actual remaining deployment inputs. Local compilation is complete only when checks pass; it does not imply independent review, testnet publication, mainnet readiness, or funded exchange liquidity.

Visit `/monitor` after configuration. Confirm Currency supply and vault accounting match explorer data, and counters increase after successful claims/opens/closes. Configure the real mainnet pool object ID as `dexPairId` only after creating/funding it; the DEX Screener adapter verifies chain, pair and V1PER coin type. Observed rolling 24-hour USD volume covers that pair only. Monitor history is browser-local, not a full historical index.


### Website release checks

- Open `/whitepaper`; verify all sections, economics tables, source links and the downloadable copy.
- Populate `feastId`, `feastAdminCapId`, `upgradeCapId`, `initialLiquidity`, `laterLiquidity`, `vaultAdminCapId`, `claimsAdminCapId`, and `metadataDigest` from the actual allocation and metadata-deletion receipts. The manifest refuses incomplete custody/authority records. A funded exchange pair is configured separately.
- Compare every custody address and initial allocation against the allocation transaction; public labels do not prove that a wallet's current balance equals its original budget.
- Compare Currency, vault and claim pool IDs, versions and last-change receipts against Suiscan on the same network. Test that retaining metadata authority causes the website to reject the currency.
- Confirm claim, open, close, top-up and pause/resume events appear with the correct vault/pool scope and receipt. The recent feed is bounded and may not contain all prior events. Check the explorer for complete receipts.
- Disconnect the RPC connection and return to the page: saved readings must show stale; they must not turn into zero balances or simulated activity.
- Verify package immutability and source independently. The site rejects an extant upgrade capability. Verify the original capability ID against publication receipts; unknown or transport errors must fail closed. Website checks do not prove source-bytecode correspondence.

Custody addresses must be nonzero and pairwise distinct. Named allocation constants sum to the complete initial supply. Approval and expiry boundaries, multi-user funding/exits and permissionless burn flushing are covered by unit tests.

Rehearse Feast allocation, finalization, 0/30/60-day vesting and locked claims before mainnet. Record finalized allocations and supply burns. The 90-day Feast window starts at finalization, separately from free claims.


## Trust assumptions: Feast opening requirements

- Use Sui multisig addresses for all four custody wallets and custody of all three AdminCaps. Use chain-appropriate multisigs for the Ethereum, Solana, native Dogecoin and MemeCore V1PER Foundation receiving wallets (founder-controlled); Sui addresses cannot receive those chain assets. Publish signer thresholds and custody policy.
- Make the package immutable before opening locks or the Feast. Publish the original UpgradeCap ID and the immutability transaction; delete metadata authority and publish that receipt.
- Publish the free-claim approval list with every approve transaction digest.
- Freeze the accepted contracts and native networks, 21-day dates, Foundation receiving addresses and submission channel. Verify authenticated Pyth historical coverage and finalized transfer indexing before accepting funds. Test both source-wallet binding signatures and each locked-claim path on testnet.
- Keep feastOpen false until all opening requirements pass. Set real feastStartMs and HTTPS feastSubmissionUrl; never invent addresses or IDs. Participants download signed binding JSON and submit via the published channel. Confirm verified receipt acceptance before they transfer; source assets are not automatically transferred by the website.
- Publish all Foundation receipt exports, signed bindings with consent to public linkage, Pyth archives, scorer input, Feast CSV, its exact-byte SHA-256 hash and the scoring script commit. Reproduce results independently, publish set_allocations digests and finalize once.
- Publish results.json as public/feast-results.json without changing bytes and set feastResultsSha256. Match its windowStart to feastStartMs. The monitor distinguishes dated exports from live onchain counters.
- The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are founder-controlled and discretionary. Record asset conversions and funding digests; liquidity is an operational commitment, not an automatic cross-chain restriction.
- Lock the LP position and publish the lock transaction digest, custody and unlocking terms before announcing trading.
- Rehearse authentic publish/create and make_immutable/delete receipts, random capability IDs, unrelated packages and RPC outages; both website and wallet actions must reject unresolved verification.

**Feast proceeds.** Coins sacrificed during the Feast are transferred to wallets controlled by the V1PER founder (the "V1PER Foundation"). They are not burned, held in trust, or governed by participants. The founder may hold, sell, reinvest or spend them at the founder's sole discretion. Participants receive V1PER only, with no claim on Foundation assets or future income. Publication of Foundation receiving addresses and all received transfers is a trust assumption; verify actual archived evidence.


## Phases and cutoff checklist

Use the shared day-0 opening T from the white paper's launch table. Pass the published T as opens_at_ms to launch::allocate; lock_vault::open enforces that date. Pause is emergency deposit control only; it never blocks reserved Feast claims or exits. Run seven-day free applications in [T-7 days,T), publish reviewed manifest and onchain approvals, and schedule the 14-day pool once. Populate freeClaimsStartMs and the HTTPS freeClaimsApplicationUrl. The four-chain Feast uses the same T as feastStartMs; keep feastOpen false until native DOGE/M receipt indexing, signatures and Pyth history have been rehearsed. Mainnet source-asset contributions must never open against a Sui testnet release.

Free claims end at T+14 days. Feast contributions end at T+21 days; signed bindings close T+23 days (feastBindingDeadlineMs). Publish review inputs after intake closes; earliest planned F is T+30. Scheduling and starting free claims must occur within 60 days of allocation; Feast finalization must occur within 120 days. Missed deadlines allow permissionless inventory burning. Publish scoring archives and allow at least seven days for public review before finalization F, resolving errors or postponing F as necessary. feast::set_allocations calculates the row commitment and stores its expected count and last-change clock; feast::finalize requires the calculated hash/count, complete table coverage and seven full days since the latest edit, then reserves all locked rewards. Do not advertise pool trading until actual paired funding, custody and LP-lock receipts pass verification. Liquid vesting finishes at F+60 days; all Feast claims expire at F+90 days. Existing lock exits remain available during deposit pauses and after all launch windows close.

Native DOGE: accept P2PKH source addresses and native outputs only; require all spent input addresses to match the signed source, at least 60 confirmations, and archived canonical transaction/block evidence. Multi-source transactions, exchange withdrawals without source-wallet proof and unsupported signatures are rejected. Receiving custody may use a valid Dogecoin P2SH multisig. Native M: verify MemeCore chain ID 4352, successful direct native-value transfer, canonical block/receipt and chain finality; do not credit ERC-20 logs or a wrapped asset. Record finality provenance and confirmation-time pricing independently: the scorer checks export fields but does not establish canonical chain finality.


## Trust assumptions

Cross-chain finality, complete exports and historical-price provenance; correct CSV publication and AdminCap allocation entries; original-work eligibility review and intake timestamps; receipt publication and multisig custody; 25% proceeds conversion/funding, exchange opening-price floor and LP locking; discretionary Foundation/Community budgets; and deployment/source correspondence are operator responsibilities, not restrictions imposed by Move. See the white paper section 11 for the full list. Contract rules are enforced by feast::set_allocations/finalize/claim_locked/burn_unclaimed (calculated commitment/count, review, reservations and expiry), lock_vault::open/deposit (opening and emergency pause), free_claims::schedule/approve/claim (one-time claim dates/caps) and launch::allocate (custody and once-only allocation).

## Local end-to-end gate

Run `SUI_BIN=/path/to/pinned/sui npm run test:rehearsal` before approving a release. The script runs a fresh local network, memory-only generated signing keys, isolated `SUI_CONFIG_DIR` and `TMPDIR`, real gas and transaction effects. It never reads a production keystore and never writes deployment IDs into the production manifest. Its public-only receipts are saved to ignored `tmp/localnet-rehearsal.json`; temporary chain data are removed on exit. The pinned CLI forbids `--force-regenesis` with `--network.config`; environment isolation prevents its automatic client-config update from reaching a personal config.

The gate publishes, registers Currency, sets a test icon, deletes metadata authority, allocates to distinct generated custody addresses, deletes UpgradeCap, approves and schedules free claims, uploads a Feast row commitment, checks early free-claim/finalization aborts, deposits, withdraws, burns and calls the actual website `readChainState`. Successful free claims, post-review Feast claims, mature exits and expiries require clock advances and are exercised by named Move unit tests. No production time gate is shortened for this rehearsal.

CI makes `website` depend on `localnet`, preventing artifacts/deployment if rehearsal fails. GitHub main branch protection was configured on 3 October 2026: contracts, localnet, whitepaper and website are strict required checks, including admins. Trust assumption: repository administrators retain authority to alter that policy; workflow dependencies alone cannot enforce merge controls.

## Historical-price readiness gate

Before scheduling any contribution opening, run `npm run check:pyth` with env-only authenticated access. Commit the real 30-point output `tests/fixtures/pyth-historical.json` and repeat all checks. The checker fails on a missing feed/point, HTTP/auth error, stale/future price or invalid raw-response identity. `test:pyth` uses explicitly synthetic responses for negative cases and cannot substitute for this gate. Current readiness: **blocked by absent PYTH_BENCHMARKS_API_KEY**; no real historical fixture has been claimed or invented. The later campaign price acquisition still requires every minute sample and raw archive.

Use SUI_BIN or sui on PATH. Allocation uploads require a complete sorted table after restart, allow amount-zero removals, and cap batches at 500; prefer 250. Gas records and browser screenshots are CI artifacts, never repository attachments. See scripts/feast/README.md for the exact personal-message and raw-archive schemas.
