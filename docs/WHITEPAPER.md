# Viper Coin (V1PR)

**Release specification · 3 October 2026**

Feed the Viper. Cute memes in. More venom out.

No more cuddly baby-animal meme coins. Viper eats them for lunch. Babies grow fastest when you feed them: our baby Viper turns the meme jungle into a Feast. “Venom” is the campaign metaphor for participation and community momentum. The ambition is a thriving community and potential market upside; feeding and burning do not guarantee price appreciation. Contributions transfer assets to the V1PR Treasury (founder-controlled), rather than feeding an autonomous growth or investment engine.

Viper Coin (V1PR) is a Sui meme coin with a once-minted supply, approved free community claims, a funded lock-reward program, and actual supply-reducing burns. Its identity is playful and predatory; its economics are explicit and inspectable. This document describes the implemented local release. No mainnet coin, exchange pool, or reward program is live yet. A ticker or logo cannot identify the authentic asset: use the verified Sui coin type and publication records displayed on the project site after deployment.

## 1. Coin and supply

| Property | Release rule |
|---|---|
| Name | Viper Coin |
| Ticker | V1PR |
| Chain | Sui |
| Decimals | 6 |
| Initial supply | 1,000,000,000 V1PR |
| Subsequent minting | None |
| Supply reductions | Currency burns |
| Ordinary transfer or DEX swap tax | None |

Publication mints the full initial supply into a sealed, one-use LaunchCap. The mint capability is locked into Sui Currency Standard burn-only mode. The allocation transaction consumes that object and distributes exactly the amounts below; there is no public mint function and no unrestricted initial coin handed to the publisher. Holders receive existing V1PR through claims, transfers, exchange trades, or rewards. [Sui Currency Standard](https://docs.sui.io/onchain-finance/fungible-tokens/create-a-fungible-token), [Coin Registry](https://docs.sui.io/references/framework/sui_sui/coin_registry).

## 2. Initial allocation

| Bucket | Supply | V1PR | Control |
|---|---:|---:|---|
| Free claims | 10% | 100,000,000 | Shared claim pool; approved addresses |
| Feast claims | 10% | 100,000,000 | Shared Feast pool; finalized allocations |
| Initial exchange liquidity | 20% | 200,000,000 | Published liquidity custodian |
| Later liquidity reserve | 15% | 150,000,000 | Published reserve custodian |
| Community programs | 20% | 200,000,000 | Separate published Community wallet |
| Lock rewards | 15% | 150,000,000 | Shared vault; rewards escrowed per position |
| Ecosystem Operations | 10% | 100,000,000 | Founder-controlled Operations wallet |
| **Total** | **100%** | **1,000,000,000** | |

Operations pays for development, hosting, design, administration and collaborators at the founder's discretion. There is no separate Team allocation, promised vesting, or automated spending restriction on Operations. Community and Operations must have distinct addresses. Liquidity reserves require a paired asset and an actual pool-creation transaction; allocating V1PR alone does not create market liquidity, establish a price, or lock LP ownership. Pool, pair, paired-asset funding, LP custodian and withdrawal policy must be published before a buy link appears.

The 100-million Feast pool holds existing tokens onchain, not in a reserve custodian wallet. AdminCap controls allocations before finalization; finalization permanently freezes the list and burns unallocated inventory. Liquid allocations release 50% immediately and the remainder linearly over 60 days. Locked allocations create 12- or 24-month positions owned by claimants, using the ordinary vault and funded rewards. Locked terms start when claimed; insufficient rewards or a deposit pause prevents the entire claim transaction without consuming the allocation. After 90 days from finalization, anyone can burn remaining inventory. Claims stop at that deadline. Locked Feast allocations compete for available vault capacity; a chosen binding term does not reserve rewards. If capacity stays unavailable through the claim deadline, the unclaimed allocation can be burned without refunding contributed coins. No administrator may sweep the pool. The deterministic contribution scorer is implemented in scripts/feast; authenticated historical price access, verified transfer exports and website campaign configuration must be rehearsed and published before opening the Feast.

The Feast runs for 21 days with a fixed ten-coin list from the 3 October 2026 CoinGecko meme-category snapshot: SHIB, PEPE, SPX and FLOKI on Ethereum; PUMP, TRUMP, PENGU, BONK, WIF and FARTCOIN on Solana. Only the exact contracts and decimals in the published scoring configuration are accepted; a matching name or ticker is insufficient. Source wallets sign a binding to their Sui destination and a separate signature authenticating the liquid, 12-month or 24-month choice. Eligible finalized transfers use the lesser of Pyth confirmation-time spot and the arithmetic average of 1,440 preceding one-minute as-of observations. Missing historical prices stop scoring. Early participation multiplies points by 1.50 on days 1–5, declining in daily steps to 1.00 on day 19; days 19–21 remain at 1.00. Lock choices multiply points by 1.00, 1.10 or 1.25.

The 100-million pool is distributed proportionally to weighted USD points, capped at 10,000 V1PR per USD before multipliers. There is no wallet cap. Integer rounding and the price floor leave inventory burned at finalization. Publish the CSV, exact-byte SHA-256 hash, eligible receipt totals, per-transfer prices and clearing price (total eligible USD divided by allocated V1PR), plus the scoring script commit and input archives. The scorer verifies signatures and arithmetic; independent receipt finality and export completeness checks remain necessary.

**Feast proceeds.** Coins sacrificed during the Feast are transferred to wallets controlled by the V1PR founder (the "V1PR Treasury"). They are not burned, held in trust, or governed by participants. The founder may hold, sell, reinvest or spend them at the founder's sole discretion. Participants receive V1PR only, with no claim on Treasury assets or future income. Treasury addresses and all received transfers are published for verification.

The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are founder-controlled and discretionary. This commitment requires source-chain asset conversion, paired-asset funding and verifiable pool transactions; it is not automatically enforced by the Sui Feast contract. Contributions have no refund path in this implementation. Do not open the campaign until the accepted contracts, Treasury addresses, dates, historical pricing access, binding submission channel and complete transfer-indexing process are published and rehearsed.

## 3. Free claims

The shared claim pool holds 100 million V1PR. Up to 10,000 approved Sui addresses may each claim exactly 10,000 V1PR once. The window is 90 × 24 hours from allocation, measured with the Sui Clock. Claimants pay only network gas, not a project claim fee. No referral purchase or promotional service is required.

The claim administrator registers eligible addresses before the window closes. Registration cannot overwrite an address, approve a zero address, exceed 10,000 addresses, or revoke an approved claim. Eligibility is discretionary, not a trustless proof of personhood: one wallet does not establish one human. Claim approvals and payouts are onchain. There is no affiliate payment per free claim and no automatic personal-data collection by the site. At expiry, anyone can invoke the burn of unclaimed inventory; that action permanently reduces supply. No administrator can sweep the claim pool into a wallet.

## 4. Lock rewards: first come, first served

**The 150 million V1PR reward pool funds accepted locks on a first-come, first-served basis until available reward capacity is exhausted. Each accepted lock immediately reserves its entire full-term V1PR reward.** Admission follows successful onchain transaction order, not website visits, wallet connections, or an offchain waiting list. The contract rejects a lock whose full reward cannot be funded; there is no partial reservation or dilution of existing locks. There is no annual emissions cap or time-limited enrollment season.

Users choose any whole number of program months from 1 through 24. One month is exactly 30 days. The principal, term, owner and reward are fixed at opening. A position is individually owned and cannot be transferred. A top-up or extension requires a new lock. There is no deposit fee. Each position holds its own principal and full reward in separate balances; payout does not depend on later participants depositing.

The annual simple token rate grows exponentially:

`annual rate = 1% × 10^((months − 1) / 23)`

The generated annual rate table is rounded down to integer parts per million. Term reward in base units is `floor(principal × annual_rate_ppm(months) × months / 12,000,000)`. A year is twelve 30-day program months. No automatic compounding occurs.

| Term | Days | Annual token rate | Total term reward on 1,000,000 V1PR |
|---|---:|---:|---:|
| 1 month | 30 | 1.0000% | 833.333333 V1PR |
| 6 months | 180 | 1.6496% | 8,248 V1PR |
| 12 months | 360 | 3.0078% | 30,078 V1PR |
| 18 months | 540 | 5.4844% | 82,266 V1PR |
| 24 months | 720 | 10.0000% | 200,000 V1PR |

The reward pool reserves exactly the entire term reward; there is no mature fee or fee offset. A 24-month lock earns 20% of its initial principal: 10,000 V1PR becomes 12,000 V1PR before network gas. Tiny deposits earning zero base units are rejected. Every shorter term compounded over 24 months earns less than one 24-month term. This comparison assumes repeated admission and sufficient future capacity, neither of which is promised.

“Staking” is shorthand for this lock-reward vault. V1PR locks do not validate Sui or earn native SUI validator rewards. Rewards distribute existing V1PR and do not guarantee purchasing power, liquidity, growth, or a dollar return. [Sui tokenomics](https://docs.sui.io/paper/tokenomics.pdf).

## 5. Exit fees and burn

The owner may close a position at any time. Finished locks have no project exit fee. Early-exit fees taper continuously from 5% to zero:

`fee = floor(principal × 5% × remaining time / agreed duration)`

At opening the fee is 5%; after 10% of the term, 4.5%; after 90%, 0.5%; at maturity, zero. Earned reward is recalculated using the annual rate for the whole completed program months, rather than the chosen longer term's rate. Before one complete month, earned reward is zero. Earned reward cannot exceed the original escrow. Unused escrow returns to available capacity.

Fees split 50% pending burn, 40% Community and 10% founder. Burn and founder round down; rounding dust goes to Community. A 1,000,000 V1PR lock exited after 10% of its term charges 45,000 V1PR: 22,500 pending burn, 18,000 Community and 4,500 founder. Ordinary transfers and DEX swaps remain untaxed.

Closing queues the burn share in the vault without touching the shared Currency. Anyone may call `flush_burns` to destroy this balance through Currency and emit a BurnsFlushed event. Pending tokens are not spendable rewards and are still part of total supply until flushed. The monitor distinguishes pending burns from actually destroyed supply. Burning does not guarantee price appreciation. [Sui Coin Registry burn operations](https://docs.sui.io/references/framework/sui_sui/coin_registry).

## 6. Exhaustion and replenishment

“Available rewards” excludes rewards already escrowed for accepted positions. Zero available capacity stops new reward-bearing locks; it does not erase accepted rewards or lock principal. Early exits release unused reservations. Anyone may fund the vault with existing V1PR, reopening capacity without minting. Replenishment is voluntary and cannot be promised as perpetual yield. Actual operating receipts can support later funding only after those receipts exist; no automatic LP revenue strategy, external lending, or founder subsidy is assumed.

The contract accounting invariant is:

`available reward inventory + outstanding reserved rewards + rewards paid = rewards funded`

User principal is accounted for separately. The administrator can pause or resume new deposits, but cannot withdraw principal or reward inventory, change fee recipients, change rates, or block exits through the pause flag. Exits still require a functioning Sui network, access to the user's wallet, and the shared vault object.

## 7. Community programs and accountability

The initial Community allocation funds creator grants (6% of total supply), Hunt Board challenges (5%), onboarding and education (3%), community events and moderation (1%), and a Community reserve (5%). These total 20%. Exit-fee receipts supplement this budget. Subbudgets are operating policy, not contract escrow restrictions. Publish recipients, purpose, amount and transaction digest for each award. There is no token-holder governance mechanism in this release.

Before mainnet, publish the authentic coin type, package, Currency, vault and claim pool IDs; allocation and publication digests; custodians; claim eligibility policy; metadata authority; and admin capability owners. Make the package immutable before accepting participant funds so upgrade authority cannot replace the stated rules. Independent review and a testnet wallet rehearsal remain deployment requirements, not claims of completed audits. Founder-controlled balances, discretionary eligibility, smart-contract failure and illiquid trading are material limitations.

## 8. Privacy and selective disclosure

**Public accountability does not require publishing a participant's legal name.** V1PR supports pseudonymous participation: the website does not require a real name, email address, social login, or identity-document upload to read the specification or connect a supported wallet. Community members can choose a public alias and decide whether to associate that alias with their wallet. The free-claim administrator still controls address eligibility; an approved address is not a proof of unique personhood or anonymity.

**The token ledger is public.** Standard V1PR transfers, balances, claim approvals, position owners, principal, reward amounts, lock timing and exit-fee recipients can be inspected onchain. Funding a new wallet from an identified address or publicly linking accounts can reveal relationships between them. A different alias, an encrypted chat or a private browser does not conceal blockchain records. V1PR is not a confidential-transfer coin, and the current Move contracts contain no shielded balances, hidden amounts or zero-knowledge transfer protocol.

Privacy has three distinct layers. Identity privacy limits what a participant voluntarily publishes about themselves. Data privacy protects offchain records such as a private community submission. Transaction privacy would conceal some payment information through a compatible cryptographic protocol. The implemented release supports participation without a mandatory identity form; it does not supply an encrypted submission portal or private settlement.

Sui's privacy stack provides building blocks rather than automatic privacy for every coin. Seal supports encrypted data with access policies; Nautilus supports confidential offchain computation with verifiable outcomes; zero-knowledge proofs can establish facts without revealing their underlying data. zkLogin and passkeys concern authentication, not hidden V1PR balances. These tools can inform optional services around V1PR, but none is integrated into its current wallet or token flow. [Sui privacy overview](https://www.sui.io/privacy).

An optional encrypted community application would need a defined access policy, key-management and recovery process, retention rules, and explicit participant consent. Only the information necessary to decide an award should be disclosed to reviewers. Public spending records can still show the grant amount, purpose and payment receipt without publishing the applicant's private supporting documents. The current launch has no such application service; this describes a privacy boundary for any later service, not a claim of completed functionality.

A private-transfer integration would require an external protocol that demonstrably supports the exact V1PR coin type, verified custody and withdrawal semantics, an independent security review, and clear disclosure of which amounts, addresses, timing and entry/exit links remain visible. Moving V1PR into a wrapper or third-party pool adds new contract and custody risks and may interrupt access to the native claim and lock functions. The authentic native coin type must remain distinguishable from every wrapper. No privacy protocol, bridge or external deposit address is endorsed by this release, and no participant must use one to hold or lock native V1PR.

The site's local chart history contains aggregate observations, not a personal profile. Connecting a wallet exposes its public address to the application and relevant RPC requests. GitHub Pages, RPC providers, external font hosting, wallet software and the optional trading-volume provider can receive connection metadata under their own policies. Deleting browser history does not erase onchain records or third-party logs. The project must not describe its public website as providing absolute anonymity.

Founder and Community custody remain publicly accountable through labeled addresses, explorer links and spending receipts. That accountability follows funds and authority, without requiring a claim about a custodian's legal identity. An optional privacy service must preserve verification of the initial supply, aggregate funded obligations and actual burns; privacy must not conceal an extra mint path or turn an unfunded reward promise into an apparent reserve.

## 9. Monitor

The `/monitor` page reads the registered Currency, reward vault, free claim pool, Feast pool and Sui Clock. It rejects an extant upgrade capability and accepts only an explicit deleted/missing lookup for the configured capability ID; timeouts, network errors and unknown errors never prove immutability. The configured ID must be independently matched to the actual publication receipt. It displays total minted supply less actual burns, available/committed/paid rewards, locked principal, cumulative successful lock opens/closes and claims, and Community/founder fee receipts. It checks burn-only state, symbol/decimals, deleted metadata authority, unregulated currency status, exact object IDs and types, shared ownership, recipients, counter bounds and the reward accounting invariant before accepting a snapshot. The wallet uses the same checks and refreshes them before requesting a transaction signature. Free claims additionally require a fresh onchain eligibility check. These checks supplement independent review; they do not prove that package bytecode matches this document.

Charts refresh every 30 seconds and store up to 720 aggregate observations in the local browser. History starts when that browser observes the deployed project; it is not a complete historical index or a count of unique people. Total supply includes reserves and locked coins; it is not circulating supply. API failures preserve saved observations and mark them stale. Browser-cached observations are marked stale until a fresh RPC read succeeds; data older than 90 seconds is also marked stale. Object versions and last-change transaction links let readers inspect the provenance of each current read. The page refreshes on window focus and prevents overlapping refreshes. Reads are separate RPC observations rather than a single checkpoint snapshot.

Trading volume uses DEX Screener only after a real mainnet pair is configured. The adapter checks chain, pair and the verified V1PR coin type. It charts the provider's rolling 24-hour USD volume for that single pair, not lifetime or all-exchange volume. Missing deployment/pair data is shown as unavailable; no activity is fabricated. [DEX Screener API](https://docs.dexscreener.com/api/reference).


The custody directory publishes the founder/Operations, Community, initial liquidity and later liquidity addresses, with their current V1PR wallet balances. A wallet balance is not proof of a remaining budget or active DEX liquidity. All four Sui custody addresses must be pairwise distinct. Principal and reserved rewards are held in user position objects and tracked by the vault, outside these wallet holdings.

The recent activity feed decodes Move events for lock opens/closes, reward funding, deposit pause/resume, free claims and unclaimed-inventory burns. Each event is filtered to the configured vault or claim pool and links to its transaction and public participant address. The feed queries the latest 20 events per module and displays up to 20 matching entries; this is a bounded view, not a complete historical index. Equal-checkpoint entries do not imply a cross-transaction execution order. Ordinary transfers, holders and exchange transactions can be inspected through the coin explorer. Funding and pause events show a checkpoint instead of inventing a timestamp.

The monitor links the exact coin type, Move package, Currency, vault, claim pool, admin capability objects, exchange pair and publication/allocation/immutability transactions on the appropriate Suiscan network. All four Sui custody addresses, three admin capability IDs, the original upgrade capability ID, and publication/allocation/immutability/metadata-deletion digests are required before website transactions are enabled. Exchange pair configuration remains optional until a funded pair exists. Unknown identifiers remain unavailable. Deployment transaction records are supplied by the operator and must be independently checked; a configuration flag is not an audit or a proof of source-bytecode correspondence. [Suiscan route documentation](https://docs.blockberry.one/docs/suiscan-routes), [Sui SDK object and event queries](https://sdk.mystenlabs.com/sui/clients/querying).

Custody addresses must be nonzero and pairwise distinct. Named allocation constants sum to the complete initial supply. Approval and expiry boundaries, multi-user funding/exits and permissionless burn flushing are covered by unit tests.

Feast claims use the shared 100-million pool. Only its AdminCap can set allocations before finalization; no edits afterward. Finalization burns unallocated tokens. Liquid claims vest 50% immediately and 50% over 60 days; locked claims create funded 12/24-month vault positions. Anyone may burn unclaimed tokens after 90 days. No minting or administrator sweep exists.


The Feast monitor displays onchain claimed, burned and remaining inventory. Its complete-vesting read paginates the finalized allocation table, validates types, reconciles count and allocated sum, then computes each liquid allocation's exact rounding at fresh chain time; locked allocations are eligible in full at finalization. The scheduled vested total includes already claimed tokens and is not currently claimable inventory. Treasury explorers and a hash-verified contribution report expose received amounts by accepted coin and clearing price. Contribution reports are dated finalized-transfer exports, not live wallet balances; missing reports show unavailable. The report publishes its CSV hash and scoring commit. Wallet binding is gated by the proceeds disclosure checkbox, campaign configuration and an immutable-contract check. Signed receipts must be submitted through the published channel and accepted before transfers; the website does not automatically submit bindings or transfer source-chain coins. Bindings publicly associate source wallets with Sui destinations, reducing unlinkability.
