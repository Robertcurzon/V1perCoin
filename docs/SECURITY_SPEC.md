# V1PR security specification

Review target: tag `v1pr-v2-auditor-review-20261003` on `codex/v2-economics-feast`. This is a package for an independent auditor, not an assertion that an independent audit has occurred. No mainnet/testnet release is deployed. Localnet uses ephemeral generated custody and no production keys. Authenticated Pyth readiness is blocked by missing environment access; no real historical fixture is present.

## State and trust boundaries

The initial mint is 1,000,000,000 V1PR, six decimals, then burn-only. Launch allocation is 100M free claims, 100M Feast, 200M initial liquidity, 150M later liquidity, 200M Community, 150M funded rewards and 100M Operations. Four external custody destinations are nonzero and distinct, but different addresses do not prove independent control. Shared Vault, free Pool, Feast Pool and Currency contain funded inventory; owned Positions contain principal and complete reward escrow. Claim tables are dynamic fields. No contract takes ownership of contributed source-chain assets or creates a refund entitlement.

Annual reward rates are immutable 1–10% ppm over 1–24 30-day months, producing 20% total at 24 months. Early reward uses completed-month rate, capped by escrow. Early exit charges 5% × remaining fraction; burn receives floor(50%), Foundation floor(10%) and Community the remainder. Maturity has no fee. Pending burns remain in supply until permissionless flush. Ordinary transfers and DEX swaps have no contract tax.

## Complete production function surface

`public(package)` is restricted to code in this package; it is not an externally callable administration API. The reviewed package must be immutable before participant use.

| Module | Functions | Effect and authority |
|---|---|---|
| `allocation` | `initial_supply`, `free_claims`, `public_reserve`, `initial_liquidity`, `later_liquidity`, `community`, `lock_rewards`, `operations` | Read immutable bucket constants; no authority or mutation. |
| `reward_schedule` | `rate_ppm` | Read 24-entry immutable ppm table; rejects terms outside 1–24. |
| `v1pr` | publication-only `init` | One-time witness creates Currency/TreasuryCap, mints initial supply, seals it in LaunchCap, converts supply to burn-only, sends Currency for registry registration and MetadataCap to publisher. |
| `v1pr` | `burn` | Anyone supplying an owned V1PR coin and shared Currency can destroy that coin, reducing registered supply. |
| `v1pr` | package `consume_launch_cap` | Consumes/deletes LaunchCap and returns exactly initial inventory; called by allocate. No reusable mint authority. |
| `launch` | `allocate` | Owner consumes LaunchCap; validates nonzero distinct destinations and future-or-current `opens_at_ms`; creates all three funded shared objects and AdminCaps, sends external allocations and AdminCaps. Opening date cannot later be edited. |
| `lock_vault` | package `create`, `share` | Require exactly 150M funding and distinct Community/Foundation; construct/share Vault and bound AdminCap. |
| `lock_vault` | `rate_ppm`, `net_reward`, `full_reward`, `exit_fee`, `fee_split` | Pure integer economics helpers. Onchain Position duration is bounded to 24 months; arbitrary unsupported helper inputs may abort rather than return a value. |
| `lock_vault` | `open`, `deposit` | Anyone with owned principal may create a Position (or transfer it to sender) when unpaused and opened; require positive full reward and capacity. Move full reward from available to escrow and committed counters. |
| `lock_vault` | package `reserve_feast`, `deposit_reserved`, `release_feast` | Feast finalization reserves all promised rewards atomically; claims move reserved escrow to Position without new capacity admission; expiry returns unused reservations. Counters distinguish Feast escrow from Position escrow. |
| `lock_vault` | `set_paused` | Matching Vault AdminCap may pause/resume ordinary admissions only. Cannot change opening, rates, destinations, owned escrow or exits; reserved Feast claims bypass pause. |
| `lock_vault` | `preview`, `close`, `withdraw` | Preview reads principal/reward/fee splits. Close/withdraw require matching vault and recorded sender, consume Position, return unused escrow and pay principal minus fee plus earned rewards. Position has key, no store: no external transfer path. |
| `lock_vault` | `flush_burns` | Permissionless; drains pending burn through Currency and increments actual burned, without taking rewards. Exits do not require Currency. |
| `lock_vault` | `fund`, `funded`, `accounting` | Anyone may contribute an owned existing coin, increasing funded and available equally; reads return reward counters and locked principal. No mint or sweep. |
| `free_claims` | package `create`, `share`; `remaining` | Require exact 100M funding; construct/share Pool/AdminCap; read inventory. |
| `free_claims` | `approve`, `schedule` | Matching Pool AdminCap approves distinct nonzero addresses, <=10,000 before opening; schedules once with >=7-day notice and exactly 14-day window. No revoke/overwrite/reschedule. |
| `free_claims` | `claim`, `burn_unclaimed` | Approved sender claims 10,000 once during [start,end); anyone burns remaining inventory at/after end through Currency. No administrator withdrawal. |
| `feast` | package `create`, `share`; `accounting` | Require exact 100M inventory; construct/share Pool/AdminCap; read inventory/allocated/claimed/burned. |
| `feast` | `set_allocations` | Matching Pool AdminCap edits before finalization; accepts nonzero amounts/addresses, unique batch, aggregate <=100M, terms 0/12/24, positive locked rewards, exactly 32-byte CSV hash. Maintains full-reward sum, emits hash and resets last-change Clock. |
| `feast` | `finalize` | Matching AdminCap once, matching committed hash, >=7 days after last edit. Atomically reserves every locked reward from supplied vault or aborts; records vault, freezes entries, burns unallocated inventory, starts 90-day window. |
| `feast` | `vested_amount`, `claim` | Liquid allocation releases floor(50%) immediately, remainder linearly through day 60, no overclaim; registered sender only, term must be 0, window [F,F+90days). |
| `feast` | `claim_locked` | Registered sender claims full allocation once into recorded 12/24-month lock; requires finalized linked vault. Consumes pre-reserved reward; bypasses ordinary pause, opening and capacity. Term begins at claim. |
| `feast` | `burn_unclaimed` | Permissionless at F+90days; verifies linked vault, returns entire unclaimed reward reserve before destroying leftover principal. No sweep or refund. |

`economics_golden` and `invariant_sequence` modules, and all `#[test_only]` helpers (`test_currency`, `test_launch_cap`, `position_details`, `sequence_state`, `sequence_time`, setup/ready/hash and assertion helpers), are excluded from production builds. Fixture minting and Clock warps cannot be called onchain.

External framework lifecycle calls are `coin_registry::finalize_registration`, `set_icon_url`, `delete_metadata_cap` and `package::make_immutable`. MetadataCap can alter metadata until deletion; UpgradeCap can upgrade code until deletion. The registry's burn-only state retains no mint authority. Review the pinned framework dependency and compiled bytecode independently.

## Invariants and executable evidence

Tests are regression evidence for the listed properties, not mathematical proof of all execution traces. Move names below are module-qualified by the table's context; npm checks execute actual exported functions rather than mirroring source text.

| Invariant | Test evidence |
|---|---|
| Initial bucket sum and one-use sealed supply | `allocation::buckets_sum_to_supply`, `v1pr::initial_supply_is_sealed_in_launch_cap`, `launch::allocation_matches_entire_initial_supply`; localnet actual publication/allocation. |
| Correct distinct nonzero custody | `launch::allocate_zero_custody_fails`, `allocate_duplicate_custody_fails`. |
| Reward available + committed + paid = funded; principal separate | `lock_vault::funded_exit_and_pause_preserve_principal`, `replenishment_preserves_existing_commitments`, `multi_user_sequence_reconciles_every_step`, `invariant_sequence::fixed_seed_600_operations_five_users` after each operation. |
| Actual Currency supply = initial − Feast burns − flushed exit burns | Same 600-operation test, `free_claims::unclaimed_tokens_are_actually_burned`, `feast::expiry_releases_unclaimed_reward_reservations`, `v1pr::voluntary_burn_reduces_total_supply`, localnet supply assertion. Pending burns are deliberately excluded until flush. |
| Pending exit burns + actually flushed exit burns = sum of exit burn shares | 600-operation sequence with separate accumulated shares; actual localnet withdraw/flush. Feast/direct burns are separate categories. |
| User lock payout <= principal + completed-month reward; reward <= escrow; zero extra maturity accrual | `lock_vault::completed_months_never_exceed_finished_shorter_lock`, `all_terms_mature_with_exact_fee_and_no_extra_accrual`; all 852 shared JSON vectors through actual Move open/preview/close and TypeScript; cumulative per-user bound in 600-operation sequence. |
| Exact integer rates/fees/splits, 1–24 terms, nonzero funded reward | `exponential_curve_and_fee_boundaries`, `invalid_term`, `dust_lock_cannot_open_with_zero_net_reward`, `reward_capacity_cannot_be_overcommitted`, shared golden vectors and `scripts/test_economics.cjs`. |
| No opening before fixed date; pause only ordinary deposits | `ordinary_lock_before_opening_fails`, `paused_deposits_fail`, `funded_exit_and_pause_preserve_principal`. |
| Matching owner/vault/AdminCap | `recorded_owner_is_enforced`, `wrong_vault_cannot_close_position`, `another_vault_admin_cannot_pause`; free `wrong_admin_cannot_approve`; Feast `wrong_admin_fails`, `wrong_admin_cannot_finalize`, `wrong_vault_cannot_consume_feast_reservation`. |
| Hash width/matching and review edit reset | Feast `invalid_commitment_width_fails`, `early_finalize_fails`, `wrong_hash_finalize_fails`, `edit_restarts_review_period`; localnet rejected early finalize. |
| Frozen bounded allocation state and allowed lock terms | Feast `oversubscribed_fails`, `duplicate_batch_fails`, `zero_address_fails`, `unsupported_locked_allocation_term_fails`, `no_edits_after_finalize`. |
| Fully reserved locked rewards even during pause/date/capacity changes | Feast `finalize_requires_full_reward_capacity`, `reserved_claim_bypasses_pause_and_opening_date`, `reserved_claim_survives_capacity_exhaustion`, `locked_claim_opens_correct_position`, `twelve_month_claim_opens_correct_position`. |
| Reward reservations return at expiry before remaining principal burns | `expiry_releases_unclaimed_reward_reservations`; 600-operation sequence's final expiry conservation. |
| Liquid/locked claims do not repeat or overclaim; 60/90-day boundaries | Feast `vesting_rounds_and_boundaries`, `liquid_claims_and_expiry_reconcile`, `repeated_liquid_claim_without_new_vesting_fails`, `repeated_locked_claim_fails`, `unallocated_claim_fails`, `claim_at_expiry_fails`, `premature_burn_fails`. |
| Free: <=10,000 distinct wallets, one exact claim; immutable 14-day window with seven-day notice | Free `approved_claim_receives_exact_amount`, `repeated_claim_fails`, `duplicate_approval_fails`, `over_capacity_approval_fails`, `zero_approval_fails`, `unapproved_claim_fails`, `insufficient_public_notice_fails`, `schedule_cannot_be_extended`, `approvals_freeze_at_start`, `claim_before_scheduled_start_fails`, `claim_window_expiry_is_enforced`, `claim_last_millisecond_then_burn`, `premature_burn_fails`, `approval_after_window_fails`; localnet premature claim rejection. |
| Scorer <=100M, USD/earlier/longer monotonicity for one participant with others held fixed; bonus-adjusted price floor; input-order invariance | Six fast-check properties ×100 fixed-seed cases in `scripts/feast/properties.mjs`; `test.mjs` cap/rounding/CSV/zero-inclusive receipt maps. |
| Source/term signatures cannot be substituted or replayed across network/campaign | `scripts/feast/test.mjs`: EVM/Solana/DOGE signatures, independent DOGE vector, network/campaign substitution, term substitution, forged Ed25519 identity and mixed-DOGE-source rejection. |
| Unfinalized/failing receipts rejected; complete per-wallet/per-asset independent balance equation | `test.mjs` integrity block: finality rule, unsuccessful/out-of-anchor receipts, missing/duplicate reconciliation, same provider/evidence, unbound receipt omission, compensating asset discrepancies, native DOGE/M accounting and CLI refusal before output creation. |
| Exact hashes for every supplied normalized/raw input and clean scorer commit | `test.mjs` bundle/hash assertions; CLI clean-scoring-release check. Raw-to-normalized truth remains external. |
| All 10 Pyth feeds ×3 points, response identity/hash/time validity; no key in archives | Seven cases in `test_pyth.mjs`, including mock rejection as live evidence. **Real authenticated fixture unavailable; coverage is not proved.** |
| Website verifies typed shared state, escrow accounting and explicit absence/deletion of UpgradeCap; RPC errors fail closed | `scripts/test_monitor.cjs` actual module tests and localnet `readChainState` after make_immutable; PDF fingerprint tests in `test_whitepaper.mjs`; Pages route/base checks in `test_deployment.mjs`. |

## Powers and trust assumptions

- **Vault AdminCap:** pause/resume ordinary deposits only. No withdrawal, rate, date or recipient change; no pause on owned exits or reserved Feast claims. Admin loss can strand the admission setting, while existing exits continue.
- **Free Pool AdminCap:** choose eligible wallets and schedule once with mandatory notice. Cannot revoke, exceed cap, reschedule, claim as another wallet or sweep. Loss can prevent new approvals/scheduling. Sybil fairness, reviewed work, submission timestamps and intake availability remain external.
- **Feast AdminCap:** edit any allocation/hash before finalization and choose when to finalize; every edit resets review. Can repeatedly stall, misallocate or never finalize. Cannot edit once finalized, extract pool tokens, skip reward funding or bypass review. Hash commitment does not prove table equals CSV, CSV equals receipts, or source window has closed. No refund mechanism exists for contributed assets.
- **LaunchCap / MetadataCap / UpgradeCap:** initial owner controls destination selection and opening date, metadata before cap deletion, and upgrades before immutability respectively. Loss before lifecycle completion can prevent release verification. Real IDs must be traced to authentic publication, not inferred from a missing arbitrary object. These are one-time lifecycle authorities, separate from three AdminCaps.
- **Foundation / Community / liquidity custody:** founder-controlled proceeds and Operations spending are discretionary. Separate addresses do not force separate signers. Community subbudgets, grants, receipts, multisig thresholds, conversions and reserve deployment are policies, not enforced vesting/governance.
- **Liquidity:** 25% of all accepted Feast proceeds, including unbound sources, is an operator funding commitment. Clearing-price floor, conversions/losses/costs, LP range, actual paired capital, LP lock and trading availability need independent receipts; this package enforces none of them. Token reserves alone create no paired assets or market price.
- **Cross-chain data:** independent finalized exports, canonical timestamps, correctly bounded balances/outflows, raw-to-normalized correspondence, real provider independence and authenticated price archives require trusted acquisition and review. Finality fields and hashes prove internal consistency/byte identity, not canonical history. The scorer is not an indexer/light client. Every unsupported provider/network must fail closed until adapters are rehearsed.
- **Publication/review:** operators must publish the complete CSV, inputs, deployment/approval/lock receipts and custody signers, and perform independent bytecode review. Website ID/type/counter checks and 30-second observations cannot establish source-bytecode correspondence, comprehensive history or honest host/RPC behavior.
- **Repository controls:** main's strict required checks are contracts/localnet/whitepaper/website, including admins, configured 3 October 2026. Repository administrators can subsequently change that external policy. Review-branch pushes do not deploy Pages; main does. Passing tests is not authorization to deploy or to open contributions.

All remaining operating instructions in docs are explicit trust assumptions or review/runbook procedures. Contract claims cite the functions above; procedures do not claim that custody, funding, listings or authenticated history already exist.

## Threat model

| Threat | Mitigation and residual risk |
|---|---|
| Admin key misuse/loss | Object-bound caps and immutable code bound powers; use real multisig custody. Feast can still stall/misallocate; unscheduled free funds and interrupted lifecycle can remain stuck. No recovery/backdoor is claimed. |
| Upgrade/metadata changes | Delete both authorities before participant use and verify original IDs/digests. Before deletion an upgrade can bypass source restrictions; missing-ID checks alone cannot authenticate original authority. |
| Shared-object congestion | Exits touch Vault, not Currency; permissionless flush later. Shared Vault/Pool/Currency are still serialized bottlenecks; timely exits/claims and fees are not guaranteed. No load benchmark establishes launch-scale throughput. |
| Oracle/data errors | Strict integer pricing, conservative spot/minute average, 60-second freshness, complete-source reconciliation, raw archives and live gate. Compromised providers/oracle, wrong normalization or coincident omissions can misallocate. Price files are not cryptographically verified Pyth update proofs. |
| Wallet binding replay/substitution | Exact network/start/destination/term signatures, unique source map and one term per Sui wallet. Signatures publicly link chains, do not prove human uniqueness, and require safe verified intake. No contract-wallet or mixed-input DOGE support. |
| Rounding/overflow | u128 intermediate arithmetic within actual Position bounds; floors, deterministic bonus denominator and dust-to-Community; 852 shared boundary cases. Dust locks are rejected. Extreme arbitrary helper inputs outside actual lock bounds may abort. |
| Expired claims/finite rewards | Immutable deadlines, full escrow for accepted locks, permissionless expiry/burn/fund. New admissions stop when capacity drains. Users must claim and pay gas before deadlines; no refunds, perpetual yield or price guarantees. |
| Malicious host/RPC/report | Repeat typed/accounting checks, scoped events, explicit unavailable/stale labels and report/PDF hashes. Host may alter code/config; authentic publication and source review remain independent duties. Browser observations are not a full index. |

## Known limitations and release gates

No testnet/mainnet IDs, production keys, funded DEX pool, LP-lock receipts, actual multisig custody, public intake service or complete production source-chain exports are created by this iteration. The script verifies an ephemeral localnet only. Clock-warped success paths stay in Move tests; production time controls are unchanged. The native LaTeX compiler checks the open source but does not export the website PDF; CI typesets and fingerprints it. A stale local PDF is hidden.

No confidential token transfers, inflation, transfer tax, paid referral, token-holder governance, legal Foundation entity or cross-chain refund contract is present. Positions are non-transferable. Free entries cannot prove unique humans. Fee receivers are fixed. Before finalization Feast rows can be overwritten but cannot be removed or set to zero; review the complete table carefully. The 32-byte hash records operator commitment, not reconstruction of CSV content by Move.

Do not open contributions until `npm run check:pyth` succeeds and its **real** 30-point archive is committed/reviewed, all minute-price acquisition and four-network finalized export/reconciliation adapters are rehearsed, authentic deployment/custody is reviewed, and funded liquidity/custody/LP policy has receipts. Current Pyth gate fails because PYTH_BENCHMARKS_API_KEY is absent. Synthetic tests cannot satisfy it. This document intentionally records that unresolved item.
