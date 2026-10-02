# Viper Coin (V1PR) launch runbook

Economics are fixed in [the white paper](WHITEPAPER.md); release code is implemented locally. No token has been deployed. Use testnet first.

## Required public configuration

Supply five nonzero, full-length Sui destination addresses: founder/Operations, Community, public distribution reserve, initial liquidity custodian, later liquidity custodian. Community must differ from founder. Publish who controls each wallet, the claim selection policy, and the admin capability owner. Supply real paired-asset funds and select an exchange/LP custody policy before trading is enabled. The repository does not contain private keys and does not invent these addresses or funds.

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
2. Call `0x2::coin_registry::finalize_registration` with the V1PR type argument, registry 0xc and the received Currency object. Record the resulting **shared** Currency ID. Verify symbol V1PR, name Viper Coin, six decimals, initial one-billion supply and burn-only state.
3. Set a publicly hosted icon URL using the MetadataCap, then permanently fix metadata by deleting the metadata cap through Currency. Record the transaction. Before participant use, consume UpgradeCap with `0x2::package::make_immutable`; record the immutability digest. This prevents upgrades from adding mint/sweep paths or changing accepted lock terms.
4. Call `launch::allocate` with LaunchCap, founder, Community, public reserve, initial liquidity custodian, later liquidity custodian, and Clock 0x6. Record vault/claim pool IDs, both AdminCaps and allocation digest. The 90-day claim window starts here. Each lock later reserves its net reward plus the mature-fee offset from the 150-million pool. Reconcile all seven buckets to the initial mint.
5. Approve test addresses with `free_claims::approve`. Claim from an approved wallet; verify 10,000 V1PR arrives, a repeated claim fails, and an unapproved claim fails. Approval is administrative; publish the eligibility policy before opening real claims.
6. Update `src/launch.json` with exact testnet IDs, coin type, all five custody destinations, both admin capability IDs, publish/allocation/immutability/metadata-deletion digests and `status: "verified"`. Connect a test wallet to the site. Claim, deposit 1- and 24-month positions, inspect transaction targets and payout preview, early-exit, and verify Community/founder receipts plus actual supply decrease. Confirm wrong-network signing is rejected by the wallet. Pausing must stop deposits and leave exits available. Long-term maturity/time boundaries, including the 0.3% mature-exit fee, are tested locally with Sui's test Clock.
7. Reconcile available rewards + committed + paid = funded; locked principal is separate. Keep the site unpublished if any object or recipient verification fails. Record testnet results and independent review before mainnet publication.

## Mainnet publication

Repeat the reviewed flow against mainnet with mainnet funding and verified wallets. Do not reuse testnet object IDs or claim that testnet review is a mainnet audit. Before accepting participant funds, fix metadata and make the package immutable. Publish transaction records, coin type and all authorities. Configure `src/launch.json` for mainnet only after verification; the UI also checks object types and fee recipients before enabling transactions.

Fund a real V1PR trading pool using its reserved inventory plus paired assets. Publish opening balances, price implied by those balances, LP custodian and withdrawal policy; then add an explorer/trading link verified against the authentic coin type. Until then there is no buy link or liquidity claim. Operations/reserve allocations remain wallet custody without vesting.

## After opening

Monitor available capacity, outstanding reservations, funded/paid rewards, lock principal, fee receipts and burns. New reward-bearing locks stop when capacity is insufficient. Existing obligations remain funded; early exits release unused reservations. `lock_vault::fund` accepts existing V1PR without inflation. At day 90 anyone may invoke `free_claims::burn_unclaimed`; expiry alone does not execute a burn automatically. Publish Community awards and Operations spending with transaction digests.

This runbook names actual remaining deployment inputs. Local compilation is complete only when checks pass; it does not imply independent review, testnet publication, mainnet readiness, or funded exchange liquidity.

Visit `/monitor` after configuration. Confirm Currency supply and vault accounting match explorer data, and counters increase after successful claims/opens/closes. Configure the real mainnet pool object ID as `dexPairId` only after creating/funding it; the DEX Screener adapter verifies chain, pair and V1PR coin type. Observed rolling 24-hour USD volume covers that pair only. Monitor history is browser-local, not a full historical index.


### Website release checks

- Open `/whitepaper`; verify all nine sections, economics tables, source links and the downloadable copy.
- Populate `publicReserve`, `initialLiquidity`, `laterLiquidity`, `vaultAdminCapId`, `claimsAdminCapId`, and `metadataDigest` from the actual allocation and metadata-deletion receipts. The manifest refuses incomplete custody/authority records. A funded exchange pair is configured separately.
- Compare every custody address and initial allocation against the allocation transaction; public labels do not prove that a wallet's current balance equals its original budget.
- Compare Currency, vault and claim pool IDs, versions and last-change receipts against Suiscan on the same network. Test that retaining metadata authority causes the website to reject the currency.
- Confirm claim, open, close, top-up and pause/resume events appear with the correct vault/pool scope and receipt. The recent feed is bounded and may not contain all prior events. Check the explorer for complete receipts.
- Disconnect the RPC connection and return to the page: saved readings must show stale; they must not turn into zero balances or simulated activity.
- Verify package immutability and source independently. Website metadata/type/accounting checks do not prove absence of upgrade authority.
