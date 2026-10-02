# V1PR lock-vault implementation

Release specification. Implemented in `viper/sources/lock_vault.move`, `reward_schedule.move`, and `src/LockPanel.tsx`. Not deployed.

## Admission and rewards

The allocation transaction funds 150,000,000 V1PR. Locks are **first come, first served until available reward capacity is exhausted**. The full reward moves from the vault into the owner's non-transferable Position when a deposit succeeds. No annual quota, enrollment end date, variable dilution, or future deposit dependency applies. Transactions exceeding capacity abort atomically; the caller retains their input coin apart from network gas. There is no per-wallet staking cap. Large holders can consume capacity, and transaction order is not a guarantee of equal access.

Whole terms: 1–24 months. Month = 30 days. Net total term reward rate after mature exit fee = `0.5% * 10^((M-1)/23)`, rounded down to integer ppm in the generated table. Rates at months 1/6/12/18/24 are 0.5000/0.8248/1.5039/2.7422/5.0000%. Each percentage is the total net V1PR reward on initial principal for completing that chosen term, before gas. It is not an annualized or recurring monthly rate, and not a USD return.

Net exponential reward in base units: `I = floor(P * rate_ppm(M) / 1_000_000)`. Gross reserve `Q = I + floor(P * 30 / 10000)` includes a funded 0.3% mature-fee offset. Reject zero principal or I = 0, so every completed accepted lock has a positive net token reward before gas. The gross reservation consumes finite capacity at acceptance. Escrow principal and Q separately in the Position. Position has `key` but no `store`, with no transfer function; only its recorded owner may close it. It is bound to the exact vault ID.

The UI parses integer amounts with at most six decimals. It fetches BCS objects rather than relying on transport-specific JSON shapes, validates vault/Currency types and fee destinations, displays inventory and per-position payout, and builds official Sui wallet transactions. It remains disabled while `src/launch.json` is unpublished. The snapshot preview uses the fetched Sui Clock; execution uses current onchain time. [Sui Clock](https://docs.sui.io/sui-stack/on-chain-primitives/access-time), [official dApp Kit](https://sdk.mystenlabs.com/dapp-kit/getting-started/react).

## Exit

Clamp elapsed E at D. `earned = floor(Q * E / D)`. `fee = floor(P * (30 * D + 170 * (D-E)) / (10000 * D))`. Use u128 intermediates. Founder = floor(fee/10); burn = floor(fee*20/100); Community = remainder. Currency performs the actual supply reduction. Pay principal minus fee plus earned; return Q minus earned to available rewards. Delete Position so it cannot be withdrawn again. At maturity fee is floor(P * 30 / 10000), earned is Q, and late exit adds no accrual. No deposit fee or specialty-action fee. Total exit fee starts at 2%, falls to 1.83% at 10% elapsed and 0.47% at 90%, and reaches 0.3% at maturity. All exits split 70% Community / 20% burn / 10% founder. The funded fee offset makes every completed term net positive in V1PR before gas; early exits can still return less principal; the UI displays gross rewards, fee and net payout.

## Capacity and control

`available + committed + paid = funded`. Principal is separate. `total_locked` tracks outstanding principal; public counters record funded rewards, paid rewards, fee destinations and burns. Opened/Closed events expose positions and outcomes.

AdminCap only pauses/resumes new deposits. It cannot take balances, block closing through a pause, change rates, rewrite positions, or replace Community/founder destinations. The package must be immutable before participant use, because a retained UpgradeCap could otherwise change these protections.

At zero capacity, no new reward-bearing position opens. Accepted positions remain fully funded. Early exits can restore capacity; anyone can deposit existing V1PR through `fund`, and accounting records the extra funding. There is no admin sweep, automatic reward inflation, or promise of recurring replenishment. Rewards are a finite distribution incentive, not Sui validator staking.

Tests cover all 24 rates/terms, exact mature and late payout, 10%/90% fee boundaries, dust and wide arithmetic, funded early exits during a pause, depleted-capacity rejection, invalid terms, vault/owner/cap binding, and replenishment accounting. Test results do not substitute for independent contract review or a testnet wallet rehearsal.
