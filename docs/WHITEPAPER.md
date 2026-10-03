# Viper Coin (V1PR)

Release specification · 3 October 2026

Feed the Viper. Cute memes in. More venom out.

Viper eats cuddly meme coins for lunch. Our baby Viper grows through participation, creativity and community momentum. “Venom” is the campaign metaphor; feeding and burning do not guarantee price gains.

Viper Coin (V1PR) combines Deflationary Supply, free community claims and fully funded lock rewards on Sui. No mainnet coin or funded exchange pool is live. Verify the complete Sui coin type and publication records before using the token.

## 1. Deflationary Supply

| Property | Release rule |
|---|---|
| Name / ticker | Viper Coin / V1PR |
| Chain / decimals | Sui / 6 |
| Supply model | Deflationary Supply |
| Initial supply | 1,000,000,000 V1PR |
| Subsequent minting | None |
| Supply reductions | Onchain Currency burns |
| Ordinary transfer or DEX swap tax | None |

The full initial supply is minted once into a sealed LaunchCap. Allocation consumes that capability; Currency remains burn-only, with no public mint function. Claims and rewards distribute existing tokens. Actual burns reduce total supply; tokens awaiting a burn remain included until destroyed. [Sui Currency Standard](https://docs.sui.io/onchain-finance/fungible-tokens/create-a-fungible-token), [Coin Registry](https://docs.sui.io/references/framework/sui_sui/coin_registry).

## 2. Allocation and V1PR Foundation

| Bucket | Supply | V1PR | Control |
|---|---:|---:|---|
| Free claims | 10% | 100,000,000 | Shared claim pool |
| Feast claims | 10% | 100,000,000 | Shared Feast pool |
| Initial exchange liquidity | 20% | 200,000,000 | Published liquidity custodian |
| Later liquidity reserve | 15% | 150,000,000 | Published reserve custodian |
| Community programs | 20% | 200,000,000 | Separate Community wallet |
| Lock rewards | 15% | 150,000,000 | Shared reward vault |
| Ecosystem Operations | 10% | 100,000,000 | V1PR Foundation |
| Total | 100% | 1,000,000,000 | |

V1PR Foundation is the project's operating name for its founder-controlled funds and receiving wallets. It does not imply independent governance or a separate legal entity. Operations funds development, hosting, design, administration and collaborators at its controller's discretion, without contractual vesting. The four Sui custody addresses must be nonzero and pairwise distinct.

Token reserves alone do not create exchange liquidity. The 200-million initial liquidity bucket is a reserve, not a requirement to deposit it all at opening. Size the deposit from verified paired funding and the promised opening price; leave unused inventory in custody. For Cetus, verify the initialized price, range and both token requirements together. Publish funding, pool balances, custody and LP-lock terms before announcing trading.

## 3. The Feast: Feed the Viper

The 21-day Feast allocates up to 100 million V1PR. The curated menu is SHIB, PEPE, SPX and FLOKI on Ethereum; PUMP, PENGU, BONK and WIF on Solana; native DOGE on Dogecoin; and native M on MemeCore mainnet (chain ID 4352, 18 decimals). DOGE uses eight decimals. Wrapped substitutes are not accepted. Exact contracts, native networks and Pyth feed IDs are frozen in the published configuration. [Dogecoin](https://dogecoin.com/), [MemeCore M](https://docs.memecore.com/memecore/token/usdm), [MemeCore network](https://docs.memecore.com/memecore/connect-to-memecore).

Participants bind their source wallet to a Sui destination and confirm a liquid, 12-month or 24-month allocation with a second signature. Both texts include the source network and campaign's Unix-second opening timestamp. Submit the signed receipt and confirm acceptance before transferring. Ethereum and MemeCore support EOA personal-sign; Solana uses Ed25519; DOGE supports manually imported Dogecoin compact signatures from P2PKH wallets. Contract-wallet signatures and mixed-source DOGE inputs are unsupported. Native DOGE receipts identify the transaction output, all input addresses and confirmation depth; all inputs must belong to the bound source. The website does not submit bindings or transfer source assets. All bound sources for one Sui destination must choose the same term. [Dogecoin signature verification](https://github.com/dogecoin/dogecoin/blob/master/src/rpc/misc.cpp).

Each finalized contribution is valued at the lesser of Pyth confirmation-time spot and the average of 1,440 preceding one-minute observations. Each observation must be no more than 60 seconds old at its sample time. Missing, stale or future prices stop scoring; receipt finality and export completeness require independent verification. Points equal eligible USD value multiplied by participation and lock bonuses. Days 1–5 receive 1.50×; the bonus declines in daily steps to 1.00× on day 19 and remains there through day 21. Liquid, 12-month and 24-month choices receive 1.00×, 1.10× and 1.25× respectively.

Allocations follow each wallet's share of total points, limited to 10,000 V1PR per USD before bonuses. No wallet cap applies. Rounding and the price floor can leave inventory, burned at finalization. Publish inputs, finalized receipts, price archives, allocation CSV, SHA-256 hash and scoring commit. Clearing price is total eligible USD divided by V1PR allocated.

The Feast administrator sets or edits allocations before one-time finalization, within the 100-million-token pool limit. Finalization freezes allocations. Liquid claims release 50% immediately and 50% linearly over 60 days. Locked claims open the recorded 12/24-month position, starting at claim time and reserving its full reward. A binding does not reserve vault capacity: insufficient rewards or paused deposits prevent the claim without consuming its allocation. Claims end 90 days after finalization; anyone may then burn remaining inventory. No administrator can sweep the pool.

Feast proceeds are sent to the V1PR Foundation. Contributed coins are not burned, held in trust or governed by participants. Its founder controls the wallets and may hold, sell, reinvest or spend proceeds. Participants receive V1PR only, with no claim on Foundation assets or future income. Receiving addresses and transfers are published. There is no contribution refund path, including if a locked allocation cannot be claimed before expiry.

The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are discretionary V1PR Foundation funds. This is an operating commitment requiring verified conversions and funding transactions; the Sui contract does not automatically enforce cross-chain spending.

## 4. Free claims

The 100-million-token pool admits at most 10,000 distinct approved Sui addresses, each entitled to one 10,000 V1PR claim (0.001% of initial supply). Claimants pay network gas only. The free-claim window precedes the planned exchange opening; receiving tokens is not a promise of immediate trading liquidity. Applications run for the seven days before day 0; claims run for 14 days from day 0. There is no open-ended mint, extension or recurring free allocation.

Applicants submit a wallet-signed application and one original meme, useful guide or valid testnet issue report through the published channel. Review checks authorship and duplicate work. Accepted applications are ordered by channel receipt time, with address and entry-link ordering breaking ties. The preparation tool verifies Sui signatures, rejects missing reviews and deduplicates wallet addresses, entry links and archived content hashes. Publish the reviewed manifest, reasons, exclusions, input hash and approval transaction receipts. Submissions do not guarantee approval; the channel, receipt timestamp and original-work review remain operator responsibilities.

Approval cannot overwrite or revoke an eligible address, include a zero address or exceed 10,000 recipients. The administrator schedules the opening once, at least seven days ahead. Approvals stop automatically at opening; claims are rejected before opening and at or after the 14-day deadline. Anyone may then burn unclaimed inventory; the administrator cannot withdraw it. One wallet or reviewed entry is not proof of one human: review reduces obvious farming but cannot eliminate multiple identities. No promotional purchase, paid referral or legal-name upload is required; submitted entries and wallet proofs are public.

## 5. Lock rewards

The 150-million V1PR reward pool accepts locks first come, first served by successful transaction order. Each accepted position immediately escrows its complete term reward. If capacity is insufficient, the contract rejects the deposit. Accepted obligations remain funded.

Choose 1–24 whole program months; each month is 30 days. Principal, term, owner and reward are set at opening. Positions cannot be transferred, extended or topped up; those actions require a new lock. No deposit fee or automatic compounding applies.

`annual rate = 1% × 10^((months − 1) / 23)`

Annual rates round down to integer parts per million. For principal in base units, term reward is `floor(principal × annual_rate_ppm(months) × months / 12,000,000)`.

| Term | Days | Annual token rate | Total term reward on 1,000,000 V1PR |
|---|---:|---:|---:|
| 1 month | 30 | 1.0000% | 833.333333 V1PR |
| 6 months | 180 | 1.6496% | 8,248 V1PR |
| 12 months | 360 | 3.0078% | 30,078 V1PR |
| 18 months | 540 | 5.4844% | 82,266 V1PR |
| 24 months | 720 | 10.0000% | 200,000 V1PR |

A 24-month lock earns 20% of initial principal: 10,000 V1PR becomes 12,000 V1PR before gas. Deposits earning zero base units are rejected. Shorter terms compounded over 24 months earn less, assuming continued admission and capacity.

These locks distribute existing V1PR; they do not validate Sui or earn native validator rewards. Token rewards do not guarantee purchasing power or dollar returns. [Sui tokenomics](https://docs.sui.io/paper/tokenomics.pdf).

## 6. Exits, burns and reward capacity

Owners may exit at any time. Mature exits have no project fee. Early exits earn the reward for whole completed program months at that completed length's rate, capped by the original escrow. Before one complete month, earned reward is zero. Unused escrow returns to the vault.

`fee = floor(principal × 5% × max(remaining time, 0) / agreed duration)`

The early-exit fee starts at 5%, falls to 2.5% halfway through the term and reaches zero at maturity. Its split is 50% pending burn, 40% Community and 10% V1PR Foundation. Burn and Foundation shares round down; Community receives rounding dust. Early exits can return less than deposited.

Exit burns accumulate separately in the vault. Anyone may call `flush_burns` to destroy that balance through Currency; closing a position does not require mutating Currency. Free-claim expiry, Feast finalization and Feast expiry also support actual supply-reducing burns. Ordinary transfers and swaps are untaxed.

When available rewards run out, new reward-bearing locks stop. Existing principal and rewards remain escrowed. Early exits release unused reservations, and anyone may replenish capacity with existing V1PR; there is no inflation or promise of perpetual yield.

`available reward inventory + outstanding reserved rewards + rewards paid = rewards funded`

Principal is separate. The administrator may pause new deposits but cannot withdraw escrow, change rates or recipients, or block exits through the pause flag.

## 7. Community programs

The 20% Community allocation budgets 6% of supply for creator grants, 5% for Hunt Board challenges, 3% for onboarding and education, 1% for events and moderation, and 5% as reserve. Community's share of early-exit fees supplements these funds.

These subbudgets are operating policy, not contract-enforced spending restrictions. Publish each award's recipient, purpose, amount and transaction digest. The release has no token-holder governance mechanism.

## 8. Privacy

Participation can be pseudonymous. The site does not require a legal name, email, social login or identity upload to read the paper or connect a wallet. Community members choose what identity information to disclose.

The native ledger remains public: addresses, transfers, balances, claims, positions and fees are inspectable. Feast bindings publicly link source wallets to Sui destinations. Aliases and fresh wallets do not guarantee unlinkability. V1PR has no shielded balances or confidential transfers.

Sui's privacy tools can support separate applications: Seal for controlled access to encrypted data and Nautilus for confidential computation. zkLogin concerns authentication, not hidden balances. None is integrated into V1PR. Any external privacy service must support the exact coin type and disclose its custody, security and entry/exit visibility. [Sui privacy overview](https://www.sui.io/privacy).

Wallet software, hosting and RPC providers may receive connection metadata. Browser-local charts store aggregate observations; deleting them does not erase blockchain records or provider logs.

## 9. Verification and monitor

Before participant use, publish the authentic coin type, package and shared-object IDs, custody addresses, AdminCaps and transaction receipts. Delete metadata authority and make the package immutable. Use Sui multisigs for custody and AdminCaps, and chain-appropriate multisigs for Foundation receiving wallets. Complete independent review, testnet rehearsal, historical-price coverage and receipt-indexing checks before opening the Feast. The contribution campaign remains disabled until verified deployment records, receiving addresses, dates and a binding-submission channel are configured.

The monitor verifies Currency metadata and burn-only state, object types and ownership, fee destinations and pool accounting. It requires explicit deleted/missing status for the published UpgradeCap ID; network errors are not evidence of immutability. Match that ID independently to the publication receipt. Wallet actions repeat state and eligibility checks before signatures.

The website reader checks published source and PDF hashes before displaying the paper or offering its download.

Live metrics show actual supply and burns, pending burns, reward capacity and obligations, locked principal, successful lock opens/closes, claims and fee receipts. The custody directory and scoped activity feed link balances, object versions and transaction receipts to Suiscan. Charts refresh every 30 seconds and retain up to 720 local observations, not a full historical index. Stale or unavailable data is labeled; total supply is not circulating supply. DEX Screener volume covers only the verified configured pair. [DEX Screener API](https://docs.dexscreener.com/api/reference).

Feast claimed, burned and inventory totals come from onchain state. Scheduled vesting requires a complete reconciled allocation-table read; it includes already claimed amounts and fully eligible locked allocations, rather than currently claimable inventory. Foundation receipts and clearing price come from a dated, hash-verified contribution report, not live source-chain balances.

Explorer links expose token movements, custody and receipts. Public records and checks support accountability; they do not establish an audit or prove source-bytecode correspondence. Discretionary allocations, Foundation-controlled assets, contract failure and illiquid markets remain project risks. [Suiscan routes](https://docs.blockberry.one/docs/suiscan-routes), [Sui SDK queries](https://sdk.mystenlabs.com/sui/clients/querying).


## 10. Launch windows

Day 0 (T) is the published UTC opening shared by free claims and the Feast. Schedule only after review, rehearsal, historical-price coverage and custody checks pass. F is actual Feast finalization, no earlier than seven days after contributions close. If scoring or security checks are delayed, announce a later F; never extend free claims.

| Window | Phase | Available to whom |
|---|---|---|
| Before scheduling | Preparation | Everyone: read, inspect and follow; no contributions or free claims |
| T − 7 days to T | Applications | Community applicants: signed wallet proof and original entry for review |
| T to T + 14 days | Opening | Approved addresses: one free claim; bound contributors: Feast; V1PR holders: funded locks when unpaused |
| T + 14 to T + 21 days | Feast only | Free claims closed; contributors may still contribute; anyone may burn unused free inventory |
| T + 21 to at least T + 28 days | Scoring and review | Everyone: inspect receipt, price and allocation archives; no Feast claims |
| F to F + 90 days | Claims and pool opening | Contributors: frozen claims; trading only once paired funding, custody and LP lock are verified |
| F + 90 days onward | Ongoing | Unclaimed Feast inventory may burn; existing locks retain exits; new locks require capacity |

Window ends are exclusive. Send contributions early enough for confirmation before T + 21 days. The seven-day Feast review and exchange opening are operating commitments, not cross-chain contract enforcement. Free-claim scheduling and its 14-day deadline are enforced onchain; the Feast's 90-day claim deadline starts at actual finalization.

Liquid Feast allocations are 50% vested at F and fully vested at F + 60 days, with another 30 days to complete claims. Locked terms start at claim time and need full reward capacity. Expired claims have no refund path. At reward exhaustion, new locks stop; accepted escrow and owner exit rights continue. Community grants open through separately announced rounds.
