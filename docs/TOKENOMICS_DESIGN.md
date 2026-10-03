# V1PR tokenomics

The authoritative economics are in [WHITEPAPER.md](WHITEPAPER.md). Implemented release parameters:

- One billion V1PR, six decimals, minted once into sealed LaunchCap; burn-only thereafter.
- Allocation: 10% free claims, 10% Feast claim pool, 20% initial liquidity, 15% later liquidity, 20% Community, 15% lock rewards, 10% founder-controlled Ecosystem Operations. Total 100%.
- Free claims: approved addresses, exactly 10,000 V1PR each, at most 10,000 addresses, 14-day scheduled claim window after seven-day applications. Unclaimed inventory may be publicly burned at expiry.
- Locks: 1–24 thirty-day months, annual token rates 1%–10%; term reward = annual rate × months / 12, fully escrowed. Completed-month reward on early exit; no maturity fee. Early fee 5% × remaining fraction, split 50% pending burn / 40% Community / 10% founder. Anyone may flush pending burns; no inflation.
- No ordinary transfer or swap tax, inflation, automated buyback, specialty-action tax, affiliate commissions or paid cross-chain contribution campaign in this release.

Liquidity allocations are inventory held by disclosed custodians, not automatically created pools. The Feast claim pool is discretionary custody and does not accept contributions. Operations is founder-controlled without vesting; Community has a distinct wallet. Community subbudgets: 6% creator grants, 5% Hunt Board challenges, 3% education, 1% events/moderation, 5% reserve. These operating budgets total 20% and are not separately contract-enforced.

Burns reduce supply without assuring price appreciation. Rewards redistribute existing inventory. At capacity exhaustion new locks stop; existing commitments remain backed. Voluntary replenishment with existing V1PR can restore capacity. No claim of perpetual yield is made.

Custody addresses must be nonzero and pairwise distinct. Named allocation constants sum to the complete initial supply. Approval and expiry boundaries, multi-user funding/exits and permissionless burn flushing are covered by unit tests.

Feast claims use the shared 100-million pool. Only its AdminCap can set allocations before finalization; no edits afterward. Finalization burns unallocated tokens. Liquid claims vest 50% immediately and 50% over 60 days; finalization reserves all 12/24-month rewards or aborts, and locked claims consume those reservations despite pauses, the ordinary opening date or later capacity exhaustion. Anyone may burn unclaimed tokens after 90 days. No minting or administrator sweep exists.


## Trust assumptions

Cross-chain finality, complete exports and historical-price provenance; correct CSV publication and AdminCap allocation entries; original-work eligibility review and intake timestamps; receipt publication and multisig custody; 25% proceeds conversion/funding, exchange opening-price floor and LP locking; discretionary Foundation/Community budgets; and deployment/source correspondence are operator responsibilities, not restrictions imposed by Move. See the white paper section 11 for the full list. Contract rules are enforced by feast::set_allocations/finalize/claim_locked/burn_unclaimed (hash, review, reservations and expiry), lock_vault::open/deposit (opening and emergency pause), free_claims::schedule/approve/claim (one-time claim dates/caps) and launch::allocate (custody and once-only allocation).
