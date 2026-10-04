# V1PER distribution implementation

`v1per::init` creates a one-use LaunchCap holding 1,000,000,000 V1PER, and locks the mint capability into burn-only supply mode. `launch::allocate` consumes LaunchCap and atomically creates/funds the 100-million-token claim pool and 150-million-token reward vault plus the 100-million-token shared Feast pool, then transfers 200M initial liquidity, 150M later liquidity, 200M Community and 100M Operations to the supplied addresses. All four custody destinations must be nonzero and pairwise distinct. The publisher cannot extract initial tokens through any other release API. Framework `package::make_immutable` deletes upgrade authority; authentic execution and publication of its receipt are trust assumptions.

## Free pool

`free_claims::approve(pool, cap, addresses, clock)` approves at most 10,000 distinct, nonzero addresses before the scheduled opening. A fixed 10,000 V1PER goes to each approved transaction sender once through `claim`. This enforces a wallet cap; it does not prove that wallets belong to different people. The approval authority is disclosed and discretionary. No automated identity provider, referral farm, paid task, revocation or admin inventory sweep exists. `burn_unclaimed` is callable by anyone at expiry and reduces actual supply. Schedule the opening once at least seven days ahead with free_claims::schedule. Claims run for 14 days; approvals freeze at opening. Trust assumption: operators publish eligibility rules, reviewed entry hashes, wallet proofs and transaction receipts. See scripts/claims/README.md for seven-day applications and duplicate-entry review.

## Reserves and exchange liquidity

The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are founder-controlled and discretionary. The initial V1PER inventory is 200M and later liquidity reserve 150M. Publish source conversions, paired funding, LP custody and position lock digest. Token reserves alone do not establish liquid trading.


## Program funds

Community receives 20% and 40% of early-exit fees. Operations receives 10% and the founder fee destination receives 10% of exit fees. They must be separate addresses. Reserve and operating wallet funds remain discretionary; no vesting or trustless spending policy is claimed. The 15% lock-reward balance has no admin withdrawal path. See [the vault specification](STAKING_DESIGN.md).

Feast claims use the shared 100-million pool. Only its AdminCap can set allocations before finalization; no edits afterward. Finalization burns unallocated tokens. Liquid claims vest 50% immediately and 50% over 60 days; finalization reserves all 12/24-month rewards or aborts, and locked claims consume those reservations despite pauses, the ordinary opening date or later capacity exhaustion. Anyone may burn unclaimed tokens after 90 days. No minting or administrator sweep exists.


**Feast proceeds.** Coins sacrificed during the Feast are transferred to wallets controlled by the V1PER founder (the "V1PER Foundation"). They are not burned, held in trust, or governed by participants. The founder may hold, sell, reinvest or spend them at the founder's sole discretion. Participants receive V1PER only, with no claim on Foundation assets or future income. Foundation receiving addresses and all received transfers are published for verification.


## Trust assumptions

Cross-chain finality, complete exports and historical-price provenance; correct CSV publication and AdminCap allocation entries; original-work eligibility review and intake timestamps; receipt publication and multisig custody; 25% proceeds conversion/funding, exchange opening-price floor and LP locking; discretionary Foundation/Community budgets; and deployment/source correspondence are operator responsibilities, not restrictions imposed by Move. See the white paper section 11 for the full list. Contract rules are enforced by feast::set_allocations/finalize/claim_locked/burn_unclaimed (hash, review, reservations and expiry), lock_vault::open/deposit (opening and emergency pause), free_claims::schedule/approve/claim (one-time claim dates/caps) and launch::allocate (custody and once-only allocation).
