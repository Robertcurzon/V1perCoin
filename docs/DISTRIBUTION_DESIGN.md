# V1PR distribution implementation

`v1pr::init` creates a one-use LaunchCap holding 1,000,000,000 V1PR, and locks the mint capability into burn-only supply mode. `launch::allocate` consumes LaunchCap and atomically creates/funds the 100-million-token claim pool and 150-million-token reward vault, then transfers 100M public reserve, 200M initial liquidity, 150M later liquidity, 200M Community and 100M Operations to the supplied addresses. All destinations must be nonzero; Community must differ from Operations. The publisher cannot extract initial tokens through any other release API. Upgrade authority must be disabled to preserve that rule.

## Free pool

`free_claims::approve(pool, cap, addresses, clock)` approves at most 10,000 distinct, nonzero addresses during the 90-day window. A fixed 10,000 V1PR goes to each approved transaction sender once through `claim`. This enforces a wallet cap; it does not prove that wallets belong to different people. The approval authority is disclosed and discretionary. No automated identity provider, referral farm, paid task, revocation or admin inventory sweep exists. `burn_unclaimed` is callable by anyone at expiry and reduces actual supply. Eligibility rules and approved-address selection must be published before opening the window.

## Reserves and exchange liquidity

The 10% public reserve is custodian-held. No paid campaign is launched, no receiving address solicits BTC/ETH/ZEC/SUI, and no conversion or cross-chain receipt mechanism is implemented. Initial liquidity has 20%; later liquidity has 15%. Each requires a disclosed custodian. Exchange pool creation is a separate transaction requiring real paired assets; token reserves alone are not executable liquidity. Publish the DEX, pool, pair, funding transaction, LP position ownership and withdrawal policy before linking trading.

## Program funds

Community receives 20% and 70% of exit fees. Operations receives 10% and the founder fee destination receives 10% of exit fees. They must be separate addresses. Reserve and operating wallet funds remain discretionary; no vesting or trustless spending policy is claimed. The 15% lock-reward balance has no admin withdrawal path. See [the vault specification](STAKING_DESIGN.md).
