# V1PER security specification

Review branch: `codex/website-brand`; resolve the final immutable head through `v1per-auditor-review-20261004`. This package is for independent review, not a claim of an independent audit. No mainnet/testnet release is deployed. Localnet uses temporary in-memory custody. Authenticated historical-price readiness remains blocked until a real operator archive is acquired and reviewed.

## State and authority

One billion V1PER, six decimals, is minted once into a sealed LaunchCap, then made burn-only. Allocation consumes that cap: 10% free, 10% Feast, 20% initial liquidity, 15% later liquidity, 20% Community, 15% funded rewards and 10% Operations. Four distinct nonzero custody addresses do not prove different controllers. The Vault and claim pools hold existing inventory; owned non-transferable Positions hold principal and full reward escrow.

The immutable 1–24-month annual ppm schedule grows exponentially from 1% to 10%, producing a 20% total reward at 24 months. Months are 30 days. No minting, compounding, deposit fee or maturity fee. Early reward uses whole completed months; fee is 5% times remaining term. Of that fee, 50% is pending burn, 10% Foundation, remainder Community. Pending burns remain in supply until permissionless flush. Ordinary transfers/swaps are untaxed.

| Capability/function | Authority and limits |
|---|---|
| LaunchCap / launch::allocate | One use; fixes custody and ordinary lock opening. Creates funded Vault/free/Feast pools and three object-bound AdminCaps. |
| MetadataCap / UpgradeCap | Delete before participation. Website requires publication and destruction receipts, not an arbitrary missing ID. Reviewed source-to-bytecode correspondence still needs independent review. |
| lock_vault AdminCap / set_paused | Pause ordinary admissions only. Cannot change rates, opening, recipients, escrow, owned exits or reserved Feast claims. |
| lock_vault open/deposit/close/withdraw | Require matching owner/vault, eligible date, positive funded reward and capacity; escrow complete reward. Unused early-exit reward returns to capacity; exits remain available. |
| lock_vault reserve_feast/deposit_reserved/release_feast | Package-only atomic reservations; claims consume them regardless of ordinary admission pause/capacity. Expiry releases unused rewards. |
| lock_vault fund/flush_burns | Permissionless existing-token funding and actual Currency destruction. No administrator sweep or mint. |
| free_claims approve/schedule | Matching AdminCap; <=10,000 distinct nonzero recipients; cannot revoke/reschedule. Seven-day notice and 14-day claim window; schedule and opening strictly bounded by the stored 60-day deadline. |
| free_claims claim/burn_unclaimed | One exact 10,000-token approved claim during the window. Permissionless burn after expiry or, if never scheduled, at allocation+60 days. Abandoned inventory cannot reopen. |
| feast set_allocations | Matching AdminCap, before finalization and allocation+120 days. Sorted batches <=500; amount zero removes an existing entry. Each restart clears the upload accumulator; complete resulting table must be re-uploaded. No sweep. |
| feast finalize | Once, before stored deadline; calculated hash equals supplied/committed hash, positive uploaded count equals committed count and current table size, seven days after last batch. Atomically reserves all locked rewards and burns surplus. |
| feast claim/claim_locked/burn_unclaimed | Liquid vesting 50% at F, remainder over 60 days; 12/24-month reserved locks begin at claim. Claims close F+90 days. Expiry releases reservations and burns unclaimed inventory. Unfinalized inventory can burn at allocation+120 days; terminal abandoned state blocks late edits/finalization. |

Only `public(package)` callers can use construction, sharing and reservation helpers. Framework Currency burn-only state has no mint authority. Test-only minting, Clock warps, generated fixtures and invariant modules are excluded from production.

## Scoring and commitment invariants

Contributions qualify in `[T,T+21 days)`; signed bindings must be received by T+23 days. The archived intake timestamp is trusted operator evidence. Source signatures bind network, source, destination, T and deadline. Only the destination Sui wallet's personal-message signature authorizes a term. Source-only/invalid choices are ignored; differing valid Sui choices resolve to liquid and are reported, without aborting all allocations.

Every scoring call requires independent per-wallet/asset reconciliation. Itemized outflows have canonical unique hashes, amounts, destinations and in-window timestamps; aggregate input totals are forbidden. Distinct finalized snapshots bracket the full window. Each asset satisfies inbound = end − start + outflows, including unbound contributions and zero-receipt assets. Receiving-wallet sources are rejected. Returns reduce each source/asset's credited receipts, never below zero, in chronological canonical transaction/index order.

Price acquisition caches feed/time requests, serializes them and waits 150 ms between requests. Exact response bytes are archived and hashed. Scoring reparses each response, verifies its feed/request time and requires every normalized observation to match. Integer prices/exponents retain precision through the spot/minute-average comparison and amount multiplication; only final eight-decimal USD valuation floors. The minute average retains its rational denominator.

Base quantity is floor(eligible USD × 10,000 tokens) before timing/lock bonuses. Denominator 560 represents all multipliers exactly. Sum bonus quantities per destination and scale proportionally only when inventory is oversubscribed, flooring token base units. Zero-reward locked dust becomes liquid. Source returns are removed before valuation; gross received and net eligible totals are separate. Missing or inconsistent evidence stops output before any directory/CSV creation.

The CSV file hash identifies its LF text. A separate commitment starts with 32 zero bytes and chains SHA256(running || BCS(address) || BCS(u64 amount) || BCS(u64 term)) over positive rows in sorted address order. Zero removal commands are excluded from its hash/count. Strict increasing addresses prevent duplicates across all batches in a review generation. A count equal to table size proves every remaining entry was uploaded; no stale row can evade re-upload. This binds allocation contents, not their fairness or correspondence to source-chain history.

## Executable evidence

Tests provide regression evidence, not proof of all execution traces.

| Invariant | Tests |
|---|---|
| Initial bucket sum, one-use sealed inventory and correct custody | `allocation::buckets_sum_to_supply`, `v1per::initial_supply_is_sealed_in_launch_cap`, `launch::allocation_matches_entire_initial_supply`, zero/duplicate custody failures; localnet publication/allocation. |
| Escrow/principal conservation and actual supply | `invariant_sequence::fixed_seed_600_operations_five_users`; 852 shared TypeScript/Move economics vectors; free/Feast expiry and actual Currency burn tests; localnet withdraw/flush. |
| Rates, integer splits, owner/vault binding, pause and reward capacity | `lock_vault::exponential_curve_and_fee_boundaries`, `all_terms_mature_with_exact_fee_and_no_extra_accrual`, `reward_capacity_cannot_be_overcommitted`, `recorded_owner_is_enforced`, `wrong_vault_cannot_close_position`, admission/pause/dust tests. |
| Calculated commitment, complete upload, row removal and batch limit | `feast_golden::generated_dust_and_multibatch_hash_parity`, `changed_csv_row_cannot_finalize`; Feast `removal_updates_totals_and_complete_reupload`, `incomplete_reupload_cannot_finalize`, `batch_above_500_fails`, `duplicate_batch_fails`, `wrong_hash_finalize_fails`, `edit_restarts_review_period`. |
| No unstarted pool permanently stranded | Free `unscheduled_pool_burns_at_60_days`, `unscheduled_burn_before_deadline_fails`, `schedule_at_abandonment_deadline_fails`; Feast `unfinalized_pool_burns_at_120_days`, `unfinalized_burn_before_deadline_fails`, `finalize_at_abandonment_deadline_fails`. |
| Frozen claims, full reservation despite pause/capacity/date, expiry release | Feast `no_edits_after_finalize`, `finalize_requires_full_reward_capacity`, reserved-claim pause/opening/capacity tests, `expiry_releases_unclaimed_reward_reservations`, vesting/repeat/window tests. |
| Bounded free eligibility and once-only fixed window | Free approval/capacity/duplicate/zero-address tests, `schedule_cannot_be_extended`, `approvals_freeze_at_start`, repeated/premature/expired claim tests. |
| Round trips, itemized returns, snapshots and direct-call integrity | `scripts/feast/test.mjs`: “round trips net once at most”, receiving-wallet rejection, fake/inflated aggregate rejection, outflow uniqueness/boundaries, snapshot bracketing, independent per-asset discrepancies and CLI no-output failures. |
| Canonical transaction/index uniqueness | “case variants never double count; index retained”; strict EVM/DOGE/Solana format tests. |
| Destination-authorized terms and deterministic conflicts | Source-only griefing, conflicting valid choices, wrong Sui key, binding cutoff and locked-dust regressions; generated Move dust fixture. |
| Valid message signed by wrong identity rejected | Separate EVM, Solana and DOGE wrong-key tests; Sui wrong-key choice is ignored/reported. Independent bitcoinjs-message DOGE vector; campaign/network/destination/forged-identity tests. |
| Exact pricing and byte archive linkage | “price 98765e-10 exact single final floor and sub-1e-8”, edited price/raw hash/missing observation tests, serialized/cache throttle test. |
| Cap, quantity floor before bonuses, monotonicity and input order | Six fast-check properties ×100 fixed-seed cases; floor property compares an independent rational reference, without scorer audit/point helpers. |
| Website immutability proof fails closed | `scripts/test_monitor.cjs`: authentic single-package Publish creates exact UpgradeCap/package; successful make_immutable consumes its creation reference and deletes the same ID. Random ID, another package, wrong/deleted/missing history, still-existing cap and RPC errors fail. Actual localnet readChainState exercises the proof and both substitution failures. |
| Current PDF and visible wordmark on all routes | Native LaTeX compilation; `test:whitepaper`, CI PDF text/metadata/provenance; `test:contrast` at 1440/390 checks exact V1PER text, visible/differently colored digit, AA contrast, hover/dialog/navigation; captures are CI artifacts. |
| Rehearsal portability | SUI_BIN or sui on PATH, explicit missing-executable error; memory-only test wallets and isolated config. CI supplies checksum-verified pinned Sui. |

## Batch measurements and conservative defaults

Fresh-table measurements on pinned Sui 1.80.1 localnet, actual transaction effects (MIST):

| Rows | Computation | Storage | Rebate | Net charge |
|---:|---:|---:|---:|---:|
| 100 | 15,700,000 | 220,605,200 | 5,469,948 | 230,835,252 |
| 250 | 150,200,000 | 543,225,200 | 5,469,948 | 687,955,252 |
| 500 | 426,200,000 | 1,080,925,200 | 5,469,948 | 1,501,655,252 |
| 1000 | Rejected before execution | 32KB address argument exceeds 16,384-byte limit | — | No executed charge |

The contract caps rows at 500; use 250 routinely and allow 2 SUI budget for the measured 500-row transaction. Storage/computation and congestion can differ on mainnet; rerun against the launch release. The old quadratic duplicate loop is replaced by linear strict-address ordering. Timing gates are unchanged; localnet does not warp production Clock. Post-review success/expiry paths are tested with Move's test-only clock. Public receipts and measurements stay in CI artifacts, not committed screenshots/reports.

## Trust assumptions and remaining release gates

- Source adapters and intake operators must independently acquire complete canonical receipts, exact window-boundary balances, itemized outflows and timestamps. Provider labels, finality flags, evidence hashes and algebra cannot prove honesty, independence or raw-to-normalized completeness. Native outflow amounts include actual balance reductions/fees; unsupported export shapes fail closed until an adapter is reviewed. No light client or indexer is included.
- Authenticated acquisition identifies retrieved Pyth bytes, not cryptographically verified update proofs. PYTH_BENCHMARKS_API_KEY is absent locally; no real 30-point historical fixture exists. Seven synthetic tests do not satisfy the pre-opening gate. Run and independently review `npm run check:pyth`, then rehearse complete minute histories and all four networks before opening.
- Feast AdminCap can choose unfair rows or stall review until the absolute deadline. Calculated commitments prove table content, not allocation fairness. Source-chain cutoff, post-intake review publication and complete input/CSV availability are operator duties. No contributed-asset refund exists.
- V1PER Foundation is an operating name for founder-controlled custody, not independent governance or a legal-entity assertion. Operations and proceeds remain discretionary. Distinct wallets do not establish separate signers. Community award policies, multisigs and spending receipts are external.
- 25% of gross accepted Feast proceeds is committed to liquidity at an opening price no lower than clearing price. Actual conversion, paired capital, pool range, custody and LP locking need executed receipts; Move enforces none of these cross-chain commitments. Token reserves alone do not create a market.
- Website proof conservatively accepts one-Publish transactions and an untouched UpgradeCap creation reference consumed by make_immutable. Transferred/upgraded caps require a separately reviewed historical adapter; they fail closed. Single-Publish uniqueness plus framework creation rules associates the cap with the package. Honest successful transaction history/RPC responses are trusted; this is not a source-bytecode audit or an independent chain verifier.
- Free work review, channel uptime, trusted receipt timestamps, deduplication and genuine authorship remain operator duties. One address is not one human. Wallet signatures publicly link source chains; no shielded balances, confidential transfers, inflation, paid referral or token-holder governance are present.
- No production IDs/keys, public intake, fully rehearsed production exports, real multisig custody, exchange funding or LP-lock receipts are created here. Review-branch pushes do not deploy Pages; main remains untouched. Repository administrators can alter external branch protection. Passing tests does not open contributions or authorize deployment.
