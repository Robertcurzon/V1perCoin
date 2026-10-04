# V1PER Coin (V1PER)

Release specification · 4 October 2026

Feed the Viper. Cute memes in. More venom out.

V1PER Coin (V1PER) is the apex predator in the Sui meme jungle. “Venom” means participation, creativity and community momentum. Nothing on the site promises gains.

V1PER Coin (V1PER) combines Deflationary supply: minted once, burn-only, free community claims and fully funded lock rewards on Sui. No mainnet coin or funded exchange pool is live. Verify the complete Sui coin type and publication records before using the token.

## 1. Deflationary supply: minted once, burn-only

| Property | Release rule |
|---|---|
| Name / ticker | V1PER Coin / V1PER |
| Chain / decimals | Sui / 6 |
| Supply model | Deflationary supply: minted once, burn-only |
| Initial supply | 1,000,000,000 V1PER |
| Subsequent minting | None |
| Supply reductions | Onchain Currency burns |
| Ordinary transfer or DEX swap tax | None |

The full initial supply is minted once into a sealed LaunchCap. Allocation consumes that capability; Currency remains burn-only, with no public mint function. Claims and rewards distribute existing tokens. Actual burns reduce total supply; tokens awaiting a burn remain included until destroyed. [Sui Currency Standard](https://docs.sui.io/onchain-finance/fungible-tokens/create-a-fungible-token), [Coin Registry](https://docs.sui.io/references/framework/sui_sui/coin_registry).

## 2. Allocation and V1PER Foundation

| Bucket | Supply | V1PER | Control |
|---|---:|---:|---|
| Free claims | 10% | 100,000,000 | Shared claim pool |
| Feast claims | 10% | 100,000,000 | Shared Feast pool |
| Initial exchange liquidity | 20% | 200,000,000 | Published liquidity custodian |
| Later liquidity reserve | 15% | 150,000,000 | Published reserve custodian |
| Community programs | 20% | 200,000,000 | Separate Community wallet |
| Lock rewards | 15% | 150,000,000 | Shared reward vault |
| Ecosystem Operations | 10% | 100,000,000 | V1PER Foundation |
| Total | 100% | 1,000,000,000 | |

V1PER Foundation is the project's operating name for its founder-controlled funds and receiving wallets. It does not imply independent governance or a separate legal entity. Operations funds development, hosting, design, administration and collaborators at its controller's discretion, without contractual vesting. `launch::allocate` requires four nonzero, pairwise-distinct Sui custody addresses.

Token reserves alone do not create exchange liquidity. The 200-million initial liquidity bucket is a reserve, not a requirement to deposit it all at opening. Deposit sizing, Cetus price/range simulation, unused inventory custody, paired funding, opening price and LP-lock publication are operating trust assumptions in section 11.

## 3. The Feast: Feed the Viper

The 21-day Feast allocates up to 100 million V1PER. The curated menu is SHIB, PEPE, SPX and FLOKI on Ethereum; PUMP, PENGU, BONK and WIF on Solana; native DOGE on Dogecoin; and native M on MemeCore mainnet (chain ID 4352, 18 decimals). DOGE uses eight decimals. Wrapped substitutes are not accepted. Exact contracts, native networks and Pyth feed IDs are frozen in the published configuration. [Dogecoin](https://dogecoin.com/), [MemeCore M](https://docs.memecore.com/memecore/token/usdm), [MemeCore network](https://docs.memecore.com/memecore/connect-to-memecore).

Participants sign a binding with their source wallet; only the destination Sui wallet can authorize a liquid, 12-month or 24-month choice through a separate Sui personal-message signature. Bindings include network, destination, campaign opening and a cutoff 48 hours after contributions close. The intake operator records submission time. Missing, invalid or source-only lock choices become liquid; conflicting valid Sui choices deterministically become liquid and are reported. Ethereum/MemeCore support EOA personal-sign, Solana Ed25519, and DOGE imported compact P2PKH signatures. Contract-wallet signatures and mixed-source DOGE inputs are unsupported. Bindings publicly link wallets. Submit and confirm acceptance before transferring; the website does not automatically submit receipts or transfer source assets.

Every asset/wallet must reconcile against an independent provider's finalized balance snapshots and itemized outflows. The start snapshot strictly precedes opening; the distinct end snapshot covers closing. Inbound equals ending minus starting balance plus itemized outflows. Receiving-wallet sources cannot qualify, and funds returned to a source during the window reduce that source's credit for the same asset, never below zero. Canonical transaction hashes and transfer indices prevent duplicate credit. Operator provenance and finality fields do not cryptographically prove complete canonical history.

Net contributions are valued at the lower of Pyth confirmation-time spot and the mean of 1,440 preceding one-minute observations. Integer prices/exponents retain precision, including prices below 1e-8; flooring occurs only after multiplying the amount. Samples must be non-future and at most 60 seconds old. The scorer verifies exact raw-response hashes and feed/time correspondence for every used price. Missing, altered or unreconciled evidence stops scoring.

First calculate a base quantity at 10,000 V1PER per eligible USD, then apply bonuses. Days 1–5 receive 1.50×, declining in daily steps to 1.00× on day 19 through day 21. Liquid/12/24-month choices multiply by 1.00/1.10/1.25. If summed bonus-weighted quantities exceed 100 million, scale allocations proportionally; otherwise retain their quantities. No wallet cap applies. Rounding and unused inventory are burned at finalization. Locked dust with zero Move reward becomes liquid and is reported. Clearing price is total eligible USD divided by allocated V1PER.

Publish the CSV, exact file hash, scoring inputs/commit and a separate allocation commitment. Move calculates a chained SHA-256 over each positive row's BCS address, amount and term, beginning with 32 zero bytes. Upload rows in sorted address order across batches. Edits restart review and require re-uploading the complete resulting table; zero amounts remove entries and their reward obligations. Finalization checks the calculated commitment, positive row count and table size, then waits seven days after the last batch. Use 250-row batches; the contract caps batches at 500. A 1,000-address argument exceeds Sui's size limit.

Finalization reserves all locked rewards atomically or aborts. Liquid claims release 50% immediately and 50% over 60 days. Reserved locked claims bypass pauses and the ordinary opening date; their terms begin at claim. Claims expire after 90 days, releasing unused reward reservations before principal burns. A pool not finalized within 120 days of allocation can be burned permissionlessly and cannot later finalize. No administrator sweep or refund exists.

Feast proceeds are sent to the V1PER Foundation. Contributed coins are not burned, held in trust or governed by participants. Its founder controls the wallets and may hold, sell, reinvest or spend proceeds. Participants receive V1PER only, with no claim on Foundation assets or future income. Publication of receiving addresses and transfers is a trust assumption in section 11. There is no contribution refund path, including expired claims or delayed finalization.

Exchange funding, the stated opening-price floor and the 25% proceeds commitment are explicit trust assumptions in section 11; no Sui function enforces cross-chain spending.

## 4. Free claims

The 100-million-token pool admits at most 10,000 distinct approved Sui addresses, each entitled to one 10,000 V1PER claim (0.001% of initial supply). Claimants pay network gas only. The free-claim window precedes the planned exchange opening; receiving tokens is not a promise of immediate trading liquidity. Applications run for the seven days before day 0; claims run for 14 days from day 0. There is no open-ended mint, extension or recurring free allocation.

Applicants submit a wallet-signed application and one original meme, useful guide or valid testnet issue report through the published channel. Review checks authorship and duplicate work. Accepted applications are ordered by channel receipt time, with address and entry-link ordering breaking ties. The preparation tool verifies Sui signatures, rejects missing reviews and deduplicates wallet addresses, entry links and archived content hashes. The tool produces a reviewed manifest, reasons, exclusions and input hash; publication and approval receipts are trust assumptions in section 11. Submissions do not guarantee approval; the channel, receipt timestamp and original-work review remain operator responsibilities.

`free_claims::approve` cannot overwrite/revoke an eligible address, include zero or exceed 10,000 recipients; it freezes approvals at opening. `schedule` permits one opening with at least seven days of notice, scheduled and starting within 60 days of allocation. If unscheduled at that deadline, anyone can burn its inventory; the pool cannot reopen. `claim` rejects before opening and at/after the 14-day deadline. Permissionless `burn_unclaimed` destroys remaining inventory after expiry; no administrator withdrawal function exists. One wallet or reviewed entry is not proof of one human: review reduces obvious farming but cannot eliminate multiple identities. No promotional purchase, paid referral or legal-name upload is required; submitted entries and wallet proofs are public.

## 5. Lock rewards

The 150-million V1PER reward pool accepts locks first come, first served by successful transaction order. Each accepted position immediately escrows its complete term reward. If capacity is insufficient, the contract rejects the deposit. Accepted obligations remain funded.

`launch::allocate` fixes the vault's immutable opening timestamp. `lock_vault::open` and `deposit` reject ordinary deposits before that date; the emergency pause also rejects new deposits, while reserved Feast claims and exits remain available. Choose 1–24 whole program months; each month is 30 days. Principal, term, owner and reward are set at opening. Positions cannot be transferred, extended or topped up; those actions require a new lock. No deposit fee or automatic compounding applies.

`annual rate = 1% × 10^((months − 1) / 23)`

Annual rates round down to integer parts per million. For principal in base units, term reward is `floor(principal × annual_rate_ppm(months) × months / 12,000,000)`.

| Term | Days | Annual token rate | Total term reward on 1,000,000 V1PER |
|---|---:|---:|---:|
| 1 month | 30 | 1.0000% | 833.333333 V1PER |
| 6 months | 180 | 1.6496% | 8,248 V1PER |
| 12 months | 360 | 3.0078% | 30,078 V1PER |
| 18 months | 540 | 5.4844% | 82,266 V1PER |
| 24 months | 720 | 10.0000% | 200,000 V1PER |

A 24-month lock earns 20% of initial principal: 10,000 V1PER becomes 12,000 V1PER before gas. Deposits earning zero base units are rejected. Shorter terms compounded over 24 months earn less, assuming continued admission and capacity.

These locks distribute existing V1PER; they do not validate Sui or earn native validator rewards. Token rewards do not guarantee purchasing power or dollar returns. [Sui tokenomics](https://docs.sui.io/paper/tokenomics.pdf).

## 6. Exits, burns and reward capacity

Owners may exit at any time. Mature exits have no project fee. Early exits earn the reward for whole completed program months at that completed length's rate, capped by the original escrow. Before one complete month, earned reward is zero. Unused escrow returns to the vault.

`fee = floor(principal × 5% × max(remaining time, 0) / agreed duration)`

The early-exit fee starts at 5%, falls to 2.5% halfway through the term and reaches zero at maturity. Its split is 50% pending burn, 40% Community and 10% V1PER Foundation. Burn and Foundation shares round down; Community receives rounding dust. Early exits can return less than deposited.

Exit burns accumulate separately in the vault. Anyone may call `flush_burns` to destroy that balance through Currency; closing a position does not require mutating Currency. Free-claim expiry, Feast finalization and Feast expiry also support actual supply-reducing burns. Ordinary transfers and swaps are untaxed.

When available rewards run out, new reward-bearing locks stop. Existing principal and rewards remain escrowed. Early exits release unused reservations, and anyone may replenish capacity with existing V1PER; there is no inflation or promise of perpetual yield.

`available reward inventory + outstanding reserved rewards + rewards paid = rewards funded`

Principal is separate. The administrator may pause new deposits but cannot withdraw escrow, change rates or recipients, or block exits through the pause flag.

## 7. Community programs

The 20% Community allocation budgets 6% of supply for creator grants, 5% for Hunt Board challenges, 3% for onboarding and education, 1% for events and moderation, and 5% as reserve. Community's share of early-exit fees supplements these funds.

These subbudgets and publication of each award's recipient, purpose, amount and transaction digest are operating trust assumptions in section 11. The release has no token-holder governance mechanism.

## 8. Privacy

Participation can be pseudonymous. The site does not require a legal name, email, social login or identity upload to read the paper or connect a wallet. Community members choose what identity information to disclose.

The native ledger remains public: addresses, transfers, balances, claims, positions and fees are inspectable. Feast bindings publicly link source wallets to Sui destinations. Aliases and fresh wallets do not guarantee unlinkability. V1PER has no shielded balances or confidential transfers.

Sui's privacy tools can support separate applications: Seal for controlled access to encrypted data and Nautilus for confidential computation. zkLogin concerns authentication, not hidden balances. None is integrated into V1PER. Any external privacy service must support the exact coin type and disclose its custody, security and entry/exit visibility. [Sui privacy overview](https://www.sui.io/privacy).

Wallet software, hosting and RPC providers may receive connection metadata. Browser-local charts store aggregate observations; deleting them does not erase blockchain records or provider logs.

## 9. Verification and monitor

Authentic deployment/custody publication, multisigs, independent review, rehearsal and source-data readiness are trust assumptions in section 11. Metadata deletion uses `coin_registry::delete_metadata_cap`; immutability uses `package::make_immutable`. The contribution campaign remains disabled until verified deployment records, receiving addresses, dates and a binding-submission channel are configured.

The monitor verifies Currency metadata and burn-only state, object types and ownership, fee destinations and pool accounting. It requires explicit deleted/missing status for the published UpgradeCap ID; network errors are not evidence of immutability. Match that ID independently to the publication receipt. Wallet actions repeat state and eligibility checks before signatures.

The website reader checks published source and PDF hashes before displaying the paper or offering its download.

Live metrics show actual supply and burns, pending burns, reward capacity and obligations, locked principal, successful lock opens/closes, claims and fee receipts. The custody directory and scoped activity feed link balances, object versions and transaction receipts to Suiscan. Charts refresh every 30 seconds and retain up to 720 local observations, not a full historical index. Stale or unavailable data is labeled; total supply is not circulating supply. DEX Screener volume covers only the verified configured pair. [DEX Screener API](https://docs.dexscreener.com/api/reference).

Feast claimed, burned and inventory totals come from onchain state. Scheduled vesting requires a complete reconciled allocation-table read; it includes already claimed amounts and fully eligible locked allocations, rather than currently claimable inventory. Foundation receipts and clearing price come from a dated, hash-verified contribution report, not live source-chain balances.

Explorer links expose token movements, custody and receipts. Public records and checks support accountability; they do not establish an audit or prove source-bytecode correspondence. Discretionary allocations, Foundation-controlled assets, contract failure and illiquid markets remain project risks. [Suiscan routes](https://docs.blockberry.one/docs/suiscan-routes), [Sui SDK queries](https://sdk.mystenlabs.com/sui/clients/querying).


## 10. Launch windows

Day 0 (T) is the published UTC opening shared by free claims and the Feast. The operating timetable in section 11 schedules T only after review, rehearsal, historical-price coverage and custody checks. Finalization day (F) follows at least seven days of complete allocation review after the T+23-day binding cutoff. The contract enforces seven days after the latest allocation edit, rather than the external contribution cutoff; free claims cannot be extended.

| Window | Phase | Available to whom |
|---|---|---|
| Before scheduling | Preparation | Everyone: read, inspect and follow; no contributions or free claims |
| T − 7 days to T | Applications | Community applicants: signed wallet proof and original entry for review |
| T to T + 14 days | Opening | Approved addresses: one free claim; bound contributors: Feast; V1PER holders: funded locks when unpaused |
| T + 14 to T + 21 days | Feast only | Free claims closed; contributors may still contribute; anyone may burn unused free inventory |
| T + 21 to T + 23 days | Binding cutoff | Contributors: complete signed intake; source transfers are closed |
| T + 23 to at least T + 30 days | Scoring and review | Everyone: inspect complete receipt, price and allocation archives; no Feast claims |
| F to F + 90 days | Claims and pool opening | Contributors: frozen claims; trading only once paired funding, custody and LP lock are verified |
| F + 90 days onward | Ongoing | Unclaimed Feast inventory may burn; existing locks retain exits; new locks require capacity |

Window ends are exclusive. Send contributions early enough for confirmation before T + 21 days. `feast::finalize` enforces seven days after the latest hash/allocation edit. Setting the correct post-campaign allocations and funding/opening an exchange are trust assumptions (section 11). Free-claim scheduling and its 14-day deadline are enforced onchain; the Feast's 90-day claim deadline starts at actual finalization.

Liquid Feast allocations are 50% vested at F and fully vested at F + 60 days, with another 30 days to complete claims. Locked terms start at claim time and consume rewards already reserved at finalization. Expired claims have no refund path. At reward exhaustion, new locks stop; accepted escrow and owner exit rights continue. Community grants open through separately announced rounds.


## 11. Trust assumptions

- Foundation-controlled proceeds, Operations and reserve-wallet spending remain discretionary. Community subbudgets, award review, spending receipts, receiving-address/transfer publication, launch/review/intake schedules and reporting commitments are not enforced by the token contract.
- Operators must commit the correct complete CSV after the contribution cutoff, allow post-cutoff review, publish all inputs/price/receipt archives and scoring commit, and map its entries to the onchain table. The contract calculates the allocation commitment and checks complete row coverage; it does not prove the CSV's relation to source-chain receipts. The Feast AdminCap may edit or delay within the 120-day finalization deadline, after which permissionless burning ends the pool. Adequate reward capacity is required to finalize; participant contributions have no refund path.
- Operators must establish canonical finalized source-chain receipts, complete exports reconciled to a second independent provider, raw-to-normalized correspondence, balance boundaries and authenticated historical prices. Provider labels, finality flags and hashes identify supplied evidence; they cannot prove honesty or actual independence. The 21-day source-chain window and allocation fairness rely on those data and the published scorer, not a cross-chain proof verified by Move.
- The plan commits 25% of all accepted Feast proceeds to paired liquidity and an opening DEX price no lower than the Feast clearing price. Conversions, losses, costs, actual paired funding, exchange range, LP custody and enforceable LP locking require operator execution and published receipts; neither commitment is enforced by this Sui package.
- Multisig signers, accurate custody/deployment records, metadata deletion, package immutability, independent review and public reporting must be independently verified. The site traces the configured UpgradeCap to a single-package publication and a successful make_immutable deletion of its untouched reference. It still relies on honest RPC history and cannot prove bytecode matches reviewed source.
- Free-entry authorship, receipt timestamps, original-work review, eligibility fairness and intake availability rely on operators. Wallet and content deduplication cannot prove unique humans.
