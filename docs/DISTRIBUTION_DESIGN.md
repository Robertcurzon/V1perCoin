# V1PR distribution implementation

`v1pr::init` creates a one-use LaunchCap holding 1,000,000,000 V1PR, and locks the mint capability into burn-only supply mode. `launch::allocate` consumes LaunchCap and atomically creates/funds the 100-million-token claim pool and 150-million-token reward vault plus the 100-million-token shared Feast pool, then transfers 200M initial liquidity, 150M later liquidity, 200M Community and 100M Operations to the supplied addresses. All four custody destinations must be nonzero and pairwise distinct. The publisher cannot extract initial tokens through any other release API. Upgrade authority must be disabled to preserve that rule.

## Free pool

`free_claims::approve(pool, cap, addresses, clock)` approves at most 10,000 distinct, nonzero addresses before the scheduled opening. A fixed 10,000 V1PR goes to each approved transaction sender once through `claim`. This enforces a wallet cap; it does not prove that wallets belong to different people. The approval authority is disclosed and discretionary. No automated identity provider, referral farm, paid task, revocation or admin inventory sweep exists. `burn_unclaimed` is callable by anyone at expiry and reduces actual supply. Schedule the opening once at least seven days ahead with free_claims::schedule. Claims run for 14 days; approvals freeze at opening. Eligibility rules, reviewed entry hashes, wallet proofs and transaction receipts must be published. See scripts/claims/README.md for seven-day applications and duplicate-entry review.

## Reserves and exchange liquidity

The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are founder-controlled and discretionary. The initial V1PR inventory is 200M and later liquidity reserve 150M. Publish source conversions, paired funding, LP custody and position lock digest. Token reserves alone do not establish liquid trading.


## Program funds

Community receives 20% and 40% of early-exit fees. Operations receives 10% and the founder fee destination receives 10% of exit fees. They must be separate addresses. Reserve and operating wallet funds remain discretionary; no vesting or trustless spending policy is claimed. The 15% lock-reward balance has no admin withdrawal path. See [the vault specification](STAKING_DESIGN.md).

Feast claims use the shared 100-million pool. Only its AdminCap can set allocations before finalization; no edits afterward. Finalization burns unallocated tokens. Liquid claims vest 50% immediately and 50% over 60 days; locked claims create funded 12/24-month vault positions. Anyone may burn unclaimed tokens after 90 days. No minting or administrator sweep exists.


**Feast proceeds.** Coins sacrificed during the Feast are transferred to wallets controlled by the V1PR founder (the "V1PR Foundation"). They are not burned, held in trust, or governed by participants. The founder may hold, sell, reinvest or spend them at the founder's sole discretion. Participants receive V1PR only, with no claim on Foundation assets or future income. Foundation receiving addresses and all received transfers are published for verification.
