# Viper Coin (V1PR)

**Release specification · 2 October 2026**

Meme with a bite! No more cuddly baby-animal meme coins. Viper eats them for lunch.

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
| Public distribution reserve | 10% | 100,000,000 | Published reserve custodian; no paid campaign open |
| Initial exchange liquidity | 20% | 200,000,000 | Published liquidity custodian |
| Later liquidity reserve | 15% | 150,000,000 | Published reserve custodian |
| Community programs | 20% | 200,000,000 | Separate published Community wallet |
| Lock rewards | 15% | 150,000,000 | Shared vault; rewards escrowed per position |
| Ecosystem Operations | 10% | 100,000,000 | Founder-controlled Operations wallet |
| **Total** | **100%** | **1,000,000,000** | |

Operations pays for development, hosting, design, administration and collaborators at the founder's discretion. There is no separate Team allocation, promised vesting, or automated spending restriction on Operations. Community and Operations must have distinct addresses. Liquidity reserves require a paired asset and an actual pool-creation transaction; allocating V1PR alone does not create market liquidity, establish a price, or lock LP ownership. Pool, pair, paired-asset funding, LP custodian and withdrawal policy must be published before a buy link appears.

The public distribution reserve accepts no ZEC, BTC, ETH or SUI payments in this release. It is retained as a disclosed reserve, not advertised as an active sale. Its custodian can move these tokens; no contract vesting is implied. The 0.5% specialty-action tax, affiliate commissions, games, private-transfer integration, and cross-chain campaign are outside this release.

## 3. Free claims

The shared claim pool holds 100 million V1PR. Up to 10,000 approved Sui addresses may each claim exactly 10,000 V1PR once. The window is 90 × 24 hours from allocation, measured with the Sui Clock. Claimants pay only network gas, not a project claim fee. No referral purchase or promotional service is required.

The claim administrator registers eligible addresses before the window closes. Registration cannot overwrite an address, approve a zero address, exceed 10,000 addresses, or revoke an approved claim. Eligibility is discretionary, not a trustless proof of personhood: one wallet does not establish one human. Claim approvals and payouts are onchain. There is no affiliate payment per free claim and no automatic personal-data collection by the site. At expiry, anyone can invoke the burn of unclaimed inventory; that action permanently reduces supply. No administrator can sweep the claim pool into a wallet.

## 4. Lock rewards: first come, first served

**The 150 million V1PR reward pool funds accepted locks on a first-come, first-served basis until available reward capacity is exhausted. Each accepted lock immediately reserves its entire full-term V1PR reward.** Admission follows successful onchain transaction order, not website visits, wallet connections, or an offchain waiting list. The contract rejects a lock whose full reward cannot be funded; there is no partial reservation or dilution of existing locks. There is no annual emissions cap or time-limited enrollment season.

Users choose any whole number of program months from 1 through 24. One month is exactly 30 days. The principal, term, owner and reward are fixed at opening. A position is individually owned and cannot be transferred. A top-up or extension requires a new lock. There is no deposit fee. Each position holds its own principal and full reward in separate balances; payout does not depend on later participants depositing.

The net total term token reward rate after the mature-exit fee grows exponentially:

`total term reward rate = 0.5% × 10^((months − 1) / 23)`

The contract uses a fixed 24-entry table rounded down to integer parts per million. There is no floating-point computation onchain. The site uses the same generated table.

| Term | Days | Total term V1PR reward | Full-term net reward on 1,000,000 V1PR |
|---|---:|---:|---:|
| 1 month | 30 | 0.5000% | 5,000 V1PR |
| 6 months | 180 | 0.8248% | 8,248 V1PR |
| 12 months | 360 | 1.5039% | 15,039 V1PR |
| 18 months | 540 | 2.7422% | 27,422 V1PR |
| 24 months | 720 | 5.0000% | 50,000 V1PR |

Rewards are simple, not compounded. **The pool reserves a mature-fee offset plus the exponential reward. Every accepted lock held to maturity earns a positive net V1PR reward before network gas.** For 1,000,000 V1PR locked for one month, the pool reserves 8,000 V1PR: a 3,000 V1PR fee offset plus 5,000 V1PR net reward. The exit still charges 3,000 V1PR and splits it 70/20/10; the final payout is 1,005,000 V1PR. The fee offset is funded from the same finite reward pool and consumes capacity; it is not minted or charged to later users.

The 5% figure is the **total net reward on initial principal for the entire 24-month lock**, before gas. A completed 10,000 V1PR 24-month lock pays 10,500 V1PR: the pool reserves 530 V1PR, the exit fee is 30 V1PR, and net reward is 500 V1PR. A completed one-month lock of the same principal pays 10,050 V1PR. Rates are neither annualized nor compounded. Net reward is `floor(initial principal × rate_ppm(months) / 1,000,000)` in base units; add the mature-exit fee rounded down in base units to obtain gross escrowed reward. The table shows net reward after that fee, before gas. Deposits producing less than one base unit of net reward are rejected. At maturity the owner receives principal less the 0.3% exit fee plus the reserved reward; accrual stops at maturity even if withdrawal occurs later.

“Staking” is shorthand for this lock-reward vault. V1PR locks do not validate Sui or earn native SUI validator rewards. Rewards distribute existing V1PR and do not guarantee purchasing power, liquidity, growth, or a dollar return. [Sui tokenomics](https://docs.sui.io/paper/tokenomics.pdf).

## 5. Exit fees and burn

The owner may close a position at any time. Every exit has a 0.3% fee on initial principal. Early exit adds a time-tapered component, keeping the total at a maximum of 2%:

`fee = floor(principal × (0.3% + 1.7% × remaining time / agreed duration))`

At opening the fee is 2%; after 10% of the term, 1.83%; after 90%, 0.47%; at and after maturity, 0.3%. The component above 0.3% reaches zero at maturity. The total cannot be avoided by exiting a moment before maturity. No blanket reward forfeiture applies: earned rewards are the reserved full reward multiplied by the fraction of the term elapsed, rounded down. The unearned remainder returns to available reward capacity.

The fee goes **70% to Community programs, 20% to a real V1PR burn, and 10% to the founder wallet**. The burn and founder portions round down; remaining base-unit dust goes to Community. For a 1,000,000 V1PR lock exited after 10% of its term, the fee is 18,300 V1PR: 12,810 Community, 3,660 burned, 1,830 founder. The owner's payout is 981,700 V1PR plus earned rewards. At maturity, the same principal incurs a 3,000 V1PR fee: 2,100 Community, 600 burned, and 300 founder. Ordinary transfers and exchange trades are untaxed.

Burning uses the shared Currency's supply-decrease operation; sending to a dead address is not counted as a burn. Burns reduce token supply but do not mathematically guarantee price appreciation. [Sui Coin Registry burn operations](https://docs.sui.io/references/framework/sui_sui/coin_registry).

## 6. Exhaustion and replenishment

“Available rewards” excludes rewards already escrowed for accepted positions. Zero available capacity stops new reward-bearing locks; it does not erase accepted rewards or lock principal. Early exits release unused reservations. Anyone may fund the vault with existing V1PR, reopening capacity without minting. Replenishment is voluntary and cannot be promised as perpetual yield. Actual operating receipts can support later funding only after those receipts exist; no automatic LP revenue strategy, external lending, or founder subsidy is assumed.

The contract accounting invariant is:

`available reward inventory + outstanding reserved rewards + rewards paid = rewards funded`

User principal is accounted for separately. The administrator can pause or resume new deposits, but cannot withdraw principal or reward inventory, change fee recipients, change rates, or block exits through the pause flag. Exits still require a functioning Sui network, access to the user's wallet, and the shared vault and Currency objects.

## 7. Community programs and accountability

The initial Community allocation funds creator grants (6% of total supply), Hunt Board challenges (5%), onboarding and education (3%), community events and moderation (1%), and a Community reserve (5%). These total 20%. Exit-fee receipts supplement this budget. Subbudgets are operating policy, not contract escrow restrictions. Publish recipients, purpose, amount and transaction digest for each award. There is no token-holder governance mechanism in this release.

Pseudonymous participation is welcome. Personal identity need not be published to read, hold, or lock V1PR. Base transfers, claims, balances, positions and fee recipients remain public; pseudonymity is not confidential settlement. There is no private-transfer feature in this release. Public wallet labels and program ledgers provide accountability without asserting anyone's legal identity.

Before mainnet, publish the authentic coin type, package, Currency, vault and claim pool IDs; allocation and publication digests; custodians; claim eligibility policy; metadata authority; and admin capability owners. Make the package immutable before accepting participant funds so upgrade authority cannot replace the stated rules. Independent review and a testnet wallet rehearsal remain deployment requirements, not claims of completed audits. Founder-controlled balances, discretionary eligibility, smart-contract failure and illiquid trading are material limitations.

## 8. Monitor

The `/monitor` page reads the registered Currency, reward vault, claim pool and Sui Clock. It displays total minted supply less actual burns, available/committed/paid rewards, locked principal, cumulative successful lock opens/closes and claims, and Community/founder fee receipts. It checks burn-only state, symbol/decimals, deleted metadata authority, unregulated currency status, exact object IDs and types, shared ownership, recipients, counter bounds and the reward accounting invariant before accepting a snapshot. The wallet uses the same checks and refreshes them before requesting a transaction signature. Free claims additionally require a fresh onchain eligibility check. These checks supplement independent review; they do not prove that package bytecode matches this document.

Charts refresh every 30 seconds and store up to 720 aggregate observations in the local browser. History starts when that browser observes the deployed project; it is not a complete historical index or a count of unique people. Total supply includes reserves and locked coins; it is not circulating supply. API failures preserve saved observations and mark them stale. Browser-cached observations are marked stale until a fresh RPC read succeeds; data older than 90 seconds is also marked stale. Object versions and last-change transaction links let readers inspect the provenance of each current read. The page refreshes on window focus and prevents overlapping refreshes. Reads are separate RPC observations rather than a single checkpoint snapshot.

Trading volume uses DEX Screener only after a real mainnet pair is configured. The adapter checks chain, pair and the verified V1PR coin type. It charts the provider's rolling 24-hour USD volume for that single pair, not lifetime or all-exchange volume. Missing deployment/pair data is shown as unavailable; no activity is fabricated. [DEX Screener API](https://docs.dexscreener.com/api/reference).


The custody directory publishes the founder/Operations, Community, public distribution, initial liquidity and later liquidity addresses, with their current V1PR wallet balances. A wallet balance is not proof of a remaining budget or active DEX liquidity. Roles can share an address; their displayed balances must not be added together. Principal and reserved rewards are held in user position objects and tracked by the vault, outside these wallet holdings.

The recent activity feed decodes Move events for lock opens/closes, reward funding, deposit pause/resume, free claims and unclaimed-inventory burns. Each event is filtered to the configured vault or claim pool and links to its transaction and public participant address. The feed queries the latest 20 events per module and displays up to 20 matching entries; this is a bounded view, not a complete historical index. Equal-checkpoint entries do not imply a cross-transaction execution order. Ordinary transfers, holders and exchange transactions can be inspected through the coin explorer. Funding and pause events show a checkpoint instead of inventing a timestamp.

The monitor links the exact coin type, Move package, Currency, vault, claim pool, admin capability objects, exchange pair and publication/allocation/immutability transactions on the appropriate Suiscan network. All five custody addresses, both admin capability IDs, and publication/allocation/immutability/metadata-deletion digests are required before website transactions are enabled. Exchange pair configuration remains optional until a funded pair exists. Unknown identifiers remain unavailable. Deployment transaction records are supplied by the operator and must be independently checked; a configuration flag is not an audit or proof that upgrade authority has been removed. [Suiscan route documentation](https://docs.blockberry.one/docs/suiscan-routes), [Sui SDK object and event queries](https://sdk.mystenlabs.com/sui/clients/querying).
