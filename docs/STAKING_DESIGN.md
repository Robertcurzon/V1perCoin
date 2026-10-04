# Funded lock specification

Terms are whole 1–24 program months, each 30 days. Annual token rate is 1% × 10^((M-1)/23), rounded down to integer ppm. Term reward Q = floor(P × annual_rate_ppm(M) × M / 12,000,000). It is 20% at 24 months. Full Q is escrowed on admission; reject zero rewards or insufficient capacity. No mature fee, fee offset or minting. Positions hold principal and reward separately, bound to the recorded owner and vault, without transfer or admin sweep.

Early reward is net_reward(P, whole elapsed months), zero before one month, capped at Q. Early fee = floor(P × 500 × remaining_ms / (10000 × duration_ms)), reaching zero at maturity. Split 50% pending burn / 40% Community / 10% founder; burn and founder floor, Community receives dust. Payout is P minus fee plus earned; unused Q returns to rewards. No extra accrual after maturity.

Close does not take Currency. Burn shares accumulate in pending_burn. Permissionless flush_burns consumes that balance through Currency and increments actually burned. Pending inventory is separate from reward capacity and remains total supply until flushed.

Accounting: rewards + reward_committed + reward_paid == reward_funded. `set_paused` stops ordinary deposits only; reserved Feast admissions and exits continue. `launch::allocate` fixes opens_at_ms, enforced by ordinary `open`/`deposit`. `feast::finalize` reserves all locked Feast rewards through `reserve_feast`; claims consume them via `deposit_reserved`, and expiry returns unused reservations via `release_feast`. Anyone may fund with existing V1PER. There is no admin withdrawal path. Shared-object schemas and scoped events match the frontend. Network gas is separate.

## Executable accounting evidence

`invariant_sequence::fixed_seed_600_operations_five_users` exercises five senders and 1/3/6/12/24-month terms with a fixed `0xC0FFEE` seed. After each of 600 operations it checks funded reward conservation, actual Currency supply against independent Feast/exit burn counters, cumulative payouts against completed-month rewards, and pending plus flushed burns against the sum of exit burn shares. Coverage assertions require opens, early exits, mature exits, funding, flushing, Feast claims and pause toggles. Test inventory is split from one initial balance and recycled; the sequence creates no additional tokens.

The 852 cases in `tests/fixtures/economics.json` cover small-unit rounding and all 24 terms at instant, partial, month-boundary, maturity and post-maturity times. `scripts/generate_economics_vectors.mjs` generates bounded Move tests from that same JSON shape; `--check` refuses stale artifacts. `test_economics.cjs` executes the TypeScript functions on every vector. Move tests exercise real `open`, `preview` and `close`. These are regression evidence, not a substitute for independent review.
