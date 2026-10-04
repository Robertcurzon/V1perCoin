# Combined change request audit

Reviewed 3 October 2026 against the pasted five-phase request, current Move package, scorer, website and release documents. Later direct instructions take precedence over the pasted request. This is an implementation review, not an independent security audit or deployment approval.

## Requirement coverage

| Request | Finding and evidence |
|---|---|
| 1. Annual exponential rewards | Implemented: generated 1–10% annual ppm rates, 20% at 24 months. Economics tests compare every shorter term's compounded return and increasing per-month rates. Strictly lower cannot apply to comparing a 24-month lock to itself; it applies to terms 1–23. |
| 2. Completed-month early rewards | Implemented in actual Move preview/close. Audit strengthened the Move test to exercise preview for every completed month of every term, rather than merely recomputing its expected arithmetic. |
| 3. Fees | Implemented: no maturity/deposit fee; 5% × remaining fraction; 50% pending burn, 40% Community, 10% Foundation. |
| 4. Deferred burns | close does not mutate Currency. Permissionless flush and separate pending/actual metrics preserve reward accounting. |
| 5. Allocation hardening | Nonzero, pairwise distinct custody; named bucket constants; supply-sum and invalid-allocation tests. |
| 6. Cleanup | MIT license, template cleanup and self-transfer annotation present. Unused Clock removed from vault creation; audit also removed one unused test Clock. |
| 7. Boundary/sequence tests | Invalid approvals, premature burns and multi-user opens/funding/exits/flushing are tested. Reward accounting checked after each sequence step. |
| 8. Feast contract | 100M funded pool, gated allocation edits, permanent finalization, surplus burn, 50% immediate/60-day vesting, 12/24-month locks, 90-day expiry and scoped timestamped events. Audit adds tests for both lock terms, wrong finalization AdminCap, paused deposits and unavailable escrow capacity. |
| 9. Deterministic scoring | Signed source/term bindings, Pyth spot/24-hour sample minimum, all time/lock multipliers, proportional allocation, bonus-adjusted floor, rounding, CSV hash and clearing price implemented. Audit adds locale-independent sorting, required 25% setting, distinct asset IDs and complete zero-inclusive report maps. |
| 10. Manifest and verification | publicReserve removed from manifest; Feast/authority IDs and receiving map added. UpgradeCap must explicitly be absent/deleted; transport/unknown errors fail closed. Shared types, recipients and accounting verified. |
| 11. Site | Consent-gated binding, explorer receipts, claimed/vested/burned metrics, current lock terms and missing-field versus network-error handling implemented. Audit makes incomplete receipt reports unavailable instead of interpreting absent assets as zero. |
| 12. Documents and launch rules | Multisigs, approval digests, CSV/hash/scoring commit, LP lock and immutability are required in the runbook. Audit corrects remaining naming and funding-dependent opening-inventory guidance. These are requirements, not evidence the wallets, pool or receipts already exist. |
| 13. Repo/CI hygiene | Generated public source copies untracked/ignored; whitepaper and website timeouts present. Five phase commits exist locally. Follow-up edits have not been published. |

## Intentional changes authorized afterward

- Use V1PER Foundation as the operating name; retain clear founder-control and no trust, asset rights, governance or refund promises. This replaces the pasted Treasury naming and exact disclosure wording.
- Liquidity commitment is 25%. The 200M initial liquidity bucket is a reserve; opening inventory follows actual paired capital, price and range. For a constant-product example, 25% of eligible proceeds at clearing price pairs with 25% of allocated Feast tokens, assuming no valuation/conversion difference. Cetus requires its own price/range/amount simulation, not that generic reserve ratio.
- Native DOGE and MemeCore M replace two assets. The dated market archive is provenance rather than an automatic ranking rule.
- Source signatures include the network and opening timestamp to prevent cross-network/campaign replay; term consent is separately signed.
- Free claims use seven-day applications and a one-time 14-day claim window, capped at 10,000 wallets × 10,000 V1PER. Eligibility freezes at opening. This is reviewed wallet/entry eligibility, not proof of unique humans.

## Actual unfinished launch work

1. Verify authenticated Pyth historical access and feed coverage with real archived examples before opening contributions. The acquisition tool exists; authenticated access has not been rehearsed.
2. Build or operate complete, finalized transfer exports on all four source networks, including all accepted receiving-wallet receipts and excluded/unbound sources. The scorer validates supplied fields/signatures/prices; it is not a chain indexer and does not prove finality or completeness.
3. Configure actual multisig custody and AdminCap owners, publish real testnet receipts and repeat the reviewed release on mainnet after independent security review. No deployment IDs or addresses are fabricated.
4. Reconcile all-proceeds valuation and the 25% paired-funding commitment, execute conversions, rehearse Cetus metadata/price/range/buy/sell behavior and publish enforceable LP-lock receipts. Token inventory alone supplies no paired capital.
5. Publish application/binding intake channels and run original-entry review. The site generates signed downloads; it does not submit applications, approve users or transfer contributions automatically.
6. Export/typeset the updated PDF with source/PDF provenance. Native editor compilation succeeded, but it does not export the website PDF. The release workflow does; the local reader hides its outdated PDF.

Iteration 2 closes the review/date/reservation gaps: feast::set_allocations commits the CSV hash and resets review; finalize enforces seven days and reserves all locked rewards atomically. launch::allocate fixes opens_at_ms; ordinary open/deposit enforce it. Reserved Feast claims bypass pause/date/capacity gates and expired reservations return before principal burns. Remaining trust assumptions are listed explicitly in white paper section 11.


## Verification

All requested check commands passed after corrections: 52 Move tests; economics, Feast, free-application, monitor and PDF-freshness tests; TypeScript; lint; production build. The edited LaTeX source compiled successfully in the existing native editor. No deployment, private-key addition or invented production ID was performed.

## Iteration 2 follow-up

See ITERATION_2_REPORT.md and SECURITY_SPEC.md for current coverage. Review/date/reservation gaps and scorer consistency gates now have contract/code enforcement, with 80 passing Move tests, 852 shared vectors, 600 mixed operations and a successful isolated localnet rehearsal. The authenticated Pyth fixture remains blocked by missing env access; production source-chain acquisition/custody/liquidity remain launch gates. The historical verification counts above describe the original audit, not this iteration.
