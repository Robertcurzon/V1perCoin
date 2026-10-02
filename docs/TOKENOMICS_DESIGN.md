# V1PR tokenomics

The authoritative economics are in [WHITEPAPER.md](WHITEPAPER.md). Implemented release parameters:

- One billion V1PR, six decimals, minted once into sealed LaunchCap; burn-only thereafter.
- Allocation: 10% free claims, 10% public distribution reserve, 20% initial liquidity, 15% later liquidity, 20% Community, 15% lock rewards, 10% founder-controlled Ecosystem Operations. Total 100%.
- Free claims: approved addresses, exactly 10,000 V1PR each, at most 10,000 addresses, 90-day window. Unclaimed inventory may be publicly burned at expiry.
- Lock rewards: first come, first served against 150 million V1PR, full reward escrowed at acceptance. Exponential net total term rewards from 0.5% of initial principal for 1 month to 5% for 24 months. Each month is 30 days. The reward pool also escrows a 0.3% mature-fee offset, so completed locks earn positive net V1PR before gas.
- Exit: 0.3% of initial principal plus 1.7% multiplied by the fraction of the term remaining. Total maximum 2%; mature exit 0.3%. Fee split 70% Community, 20% actual burn, 10% founder. Deposits are free. Earned rewards are paid; unearned escrow returns to capacity.
- No ordinary transfer or swap tax, inflation, automated buyback, specialty-action tax, affiliate commissions or paid cross-chain contribution campaign in this release.

Liquidity allocations are inventory held by disclosed custodians, not automatically created pools. The public distribution reserve is discretionary custody and does not accept contributions. Operations is founder-controlled without vesting; Community has a distinct wallet. Community subbudgets: 6% creator grants, 5% Hunt Board challenges, 3% education, 1% events/moderation, 5% reserve. These operating budgets total 20% and are not separately contract-enforced.

Burns reduce supply without assuring price appreciation. Rewards redistribute existing inventory. At capacity exhaustion new locks stop; existing commitments remain backed. Voluntary replenishment with existing V1PR can restore capacity. No claim of perpetual yield is made.
