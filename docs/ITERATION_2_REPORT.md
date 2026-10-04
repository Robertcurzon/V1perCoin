# Iteration 2 review report

Review branch: `codex/v2-economics-feast`. Auditor target: `865b782e0b537ee06df79155d602a35df6ca04c3`. The tag identifies the final Step 6 commit; resolve its full hash with `git show 865b782e0b537ee06df79155d602a35df6ca04c3`. Every step is a separate commit. Main was not pushed and no testnet/mainnet token was deployed. Only isolated localnet transactions were executed.

| Step | Change and evidence | Commit |
|---|---|---|
| 0 | Captured the reviewed assets, claim windows and audit corrections; pushed all local work to the new review branch. Baseline was 52 Move tests plus npm checks. | `3160e6b` |
| 1 | Hash-bound seven-day review with edit reset; immutable vault opening; all locked Feast rewards reserved at finalize; pause/date/capacity-independent reserved claims; expiry releases reservations. Named tests include early_finalize_fails, wrong_hash_finalize_fails, edit_restarts_review_period, ordinary_lock_before_opening_fails, finalize_requires_full_reward_capacity, reserved_claim_bypasses_pause_and_opening_date, reserved_claim_survives_capacity_exhaustion and expiry_releases_unclaimed_reward_reservations. Updated BCS, verifier, UI and explicit trust assumptions. | `6a9e0b6` |
| 2 | scripts/rehearse_localnet.mjs: 13 actual transactions, registry/metadata lifecycle, immutable package, generated test custody, approval, scheduled free window, allocation commitment, rejected early claim/finalize, actual deposit/exit/burn and website readChainState. CI localnet prerequisite; main protection now requires four checks. Success paths needing clock warps stay in Move tests. | `dcb0fff` |
| 3 | fixed_seed_600_operations_five_users; reward/supply/payout/burn assertions after each operation; 852 shared JSON cases checked by 18 generated shared_json_golden_vectors_* Move tests and TypeScript; six fast-check properties ×100 cases. Fixture regeneration parity required. | `020130d` |
| 4 | Explicit finality on all four source networks; exact second-provider balance/outflow reconciliation per receiving wallet and asset, including zero and unbound receipts; same-source/missing/mismatch rejection; all normalized/raw input hashes and clean scorer commit; CLI refusal before CSV write. Integrity test block and expanded property order test. | `287a005` |
| 5 | check_pyth.mjs: env-only authentication, all ten feeds at three fixed past timestamps, paced queries, strict feed/price/time/raw-hash checks; seven synthetic positive/negative cases. Live command attempted and correctly failed due to absent API key. No invented historical fixture. | `73471ad` |
| 6 | SECURITY_SPEC.md covers every production function, authority, invariant/test, threat and limitation. Added invalid_commitment_width_fails, unsupported_locked_allocation_term_fails, repeated_liquid_claim_without_new_vesting_fails, wrong_vault_cannot_consume_feast_reservation and voluntary_burn_reduces_total_supply. Tightened remaining operator language and compiled the same open LaTeX source. | Auditor tag |

## Final verification

80 Move tests pass. These include the 600-operation sequence and all 852 payout cases. Six fast-check properties each pass 100 generated cases. Seven synthetic Pyth cases pass. Localnet's 13 transactions pass their expected outcomes (11 successes, 2 intentional time-gate failures); actual website verification, deleted UpgradeCap and supply burn pass. Economics, Feast, claims, monitor, PDF-freshness, typecheck, lint, both root/Pages builds and deployment-route checks pass. The required full suite was run after each step; Step 5's separate live check is intentionally unsuccessful until credentials are available. The edited LaTeX source compiled successfully in the existing desktop editor.

This npm suite uses assertions rather than a uniform runner, so there is no misleading single aggregate npm test count. The counts above are the explicit generated-case and transaction counts. Vite reports a non-failing >500kB chunk warning.

## Updated trust assumptions

1. Foundation/Community/reserve spending, grants, reporting and intake remain discretionary operating responsibilities. Separate wallet addresses do not establish independent control or a legal Foundation entity.
2. Feast administrators can choose/edit incorrect entries, reset review or delay finalization. Full capacity is mandatory to finalize; the committed hash cannot prove the table equals the complete published CSV. Contributions have no refund path.
3. Source-chain canonical history, complete exports, finality evidence, boundary balances/outflows, provider independence, raw-to-normalized correspondence and authenticated oracle data require acquisition and independent review. Consistency checks and SHA-256 do not prove provider honesty.
4. Conversion/funding of 25% of all Feast proceeds, opening-price floor, paired capital, Cetus range, LP custody/lock and trading availability require real transactions and receipts; Move does not enforce cross-chain spending.
5. Authentic deployment/authority IDs, source-bytecode correspondence, real multisig signers and public record availability require independent verification. Missing arbitrary IDs and a passing website snapshot cannot authenticate a release.
6. Original-work review, receipt time, eligibility fairness and intake availability are external. Wallet/content deduplication does not prove unique humans.
7. GitHub main protection now strictly requires contracts/localnet/whitepaper/website, including admins. Repository administrators can alter those controls later.

## Uncompleted or intentionally excluded work

- **Step 5 remains incomplete:** PYTH_BENCHMARKS_API_KEY is unavailable in the tool environment. The authenticated checker could not retrieve/commit 30 real historical prices. Configure access securely and run npm run check:pyth, then commit/review its real archive. Synthetic prices are explicitly rejected as live evidence. [Pyth documents Bearer authentication for historical access](https://docs.pyth.network/price-feeds/core/use-historical-price-data).
- Successful localnet free claims, post-review Feast finalization/claims, maturity, vesting and expiry would require waiting days/months. Their clock-warped success paths are Move tests; production clocks were not weakened.
- Production four-network indexer/balance adapters, public intake, multisig custody, testnet/mainnet publication and funded exchange/LP locking were not performed. They remain launch gates; deployment was explicitly outside this iteration's authorization.
- Native compiler success does not export a PDF. CI typesets and fingerprints it; stale local website PDFs remain hidden.
- This is an internal implementation review package. An independent auditor has not reviewed it yet.
