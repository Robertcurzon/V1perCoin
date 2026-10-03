# Viper Coin (V1PR): liquidity, discovery and community strategy

Research date: 2 October 2026. This is an operating plan and research record, not a change to the coin's allocation or contract. No pool, listing, social account, campaign or third-party partnership has been created by this research.

## Decision

Use a custom Sui coin and one primary V1PR/SUI pool. Cetus is the preferred venue to rehearse, conditional on actual coin-metadata compatibility, successful wallet buys/sells and review of the deployed exchange contracts. Preserve the existing fixed initial mint, burn-only supply, free claims and finite lock rewards. Build traction through a reusable character, community participation and accessible trading.

The working opening inventory is **50 million V1PR**, or 25% of the 200-million initial liquidity bucket. The other 150 million stays in that bucket for expansion; the separate 150-million later-liquidity bucket remains distinct. This starting inventory is a recommendation, not evidence that liquidity is funded. Actual paired SUI and a simulated opening price/range must be confirmed before execution.

## Cetus implementation

Cetus documents permissionless pool creation by coin type, with SUI as an accepted quote asset. Its guide lists 0.25% among its fee tiers and identifies it as common for non-stable pairs. The creator sets price and range, supplies the required token amounts and receives a position NFT. Start with 0.25% as the fee tier to test, checking current availability at execution. [Official pool guide](https://cetus-1.gitbook.io/cetus-docs/guides/how-to-create-a-new-pool)

Use broad coverage for the opening position rather than a narrow range optimized around an assumed stable price. Concentrated liquidity becomes inactive and single-sided outside its range; liquidity in one position is not interchangeable with equal-value liquidity in another range. The exact ticks need simulation. A blanket formula of paired SUI divided by deposited V1PR does not determine price for every concentrated-liquidity position. [Cetus CLMM mechanics](https://cetus-1.gitbook.io/cetus-docs/clmm/concepts-and-features)

Before mainnet funding:

1. Rehearse the coin's Currency-registry metadata with the selected current pool-creation path; do not assume a legacy metadata interface works automatically.
2. Test a real wallet buy and sell, the website claim and lock flows, and the exact coin type. Record receipts.
3. Quote both buy and sell sizes representative of the intended audience. Use an initial operating target of under 2% price impact for those sizes, separate from exchange fees and slippage tolerance. This target is our design choice, not a Cetus requirement. If unmet, increase paired capital or reduce launch scale; do not manufacture volume.
4. Publish initial price, deposited amounts, fee tier, range, position NFT, custody address, withdrawal authority and management policy. A multisig is preferable to one operational key, provided its signers and threshold are actually configured. Do not label liquidity locked unless a verified enforceable lock exists.
5. Fund and verify trading before opening claim approvals or promoting purchases. The allocation transaction starts the 90-day claim window, so prepare the pool and operational sequence beforehand.

Adding a single asset to an out-of-range CLMM position is not inherently an immediate market sale. Top-ups must be evaluated against the actual position range and token requirements. Do not use one-sided deposits as an undocumented price-management policy.

Cetus suffered a CLMM exploit in May 2025 and publishes subsequent audit links. This makes matching the current deployment to relevant reviewed code part of venue selection; the presence of audits alone is not a guarantee. [Cetus incident report](https://cetusprotocol.notion.site/Cetus-Incident-Report-May-22-2025-Attack-Disclosure-1ff1dbf3ac8680d7a98de6158597d416), [audit directory](https://cetus-1.gitbook.io/cetus-docs/security/audit)

Exchange swap fees are separate from V1PR's lock-exit fees. A Cetus pool does not automatically apply V1PR's 40% Community / 50% pending burn / 10% founder split to swaps. No exchange-fee buyback or burn mechanism is implemented in V1PR. Keep that distinction explicit.

## What established projects actually do

| Example | Evidence of its approach | Application to V1PR |
| --- | --- | --- |
| BONK, Solana | Its launch paper allocated 50% to ecosystem communities including creators, developers and NFT participants. Its current integration directory spans trading, rewards and other applications. | Select contributors with existing Sui audiences and useful work; make acquisition and participation easy. Do not copy its percentage or attempt to build its mature ecosystem at launch. |
| LOFI, Sui | Its ambassador program specifies campaigns, content, community support, calls and tiered participation. | Run a small contributor cohort with deliverables and a review process, rather than pay for raw follower counts. |
| BLUB, Sui | The project connects its fish character to Sui's water identity, offers profile pictures, source/assets and a wallet-to-swap walkthrough. | Give Viper recognizable expressions and reusable assets; put the authentic coin type and buying instructions next to them. |
| Pudgy Penguins | Its 2023 recap describes GIFs, stickers and memes reaching people outside Web3, reporting 3.1 billion GIF views at that time. | Make reactions people would share even without owning V1PR. Content can acquire an audience before a purchase pitch. Its mature brand resources are not a small project's starting budget. |

Sources: [BONK launch paper](https://bonkcoin.com/BONK-Paper.pdf), [BONK integrations](https://www.bonkcoin.com/integrations), [LOFI ambassadors](https://ambassadors.lofitheyeti.com/), [BLUB official site](https://blubsui.com/en), [Pudgy's one-year recap](https://media.pudgypenguins.com/post/one-year-recap).

These are observable practices, not proof of the cause of price appreciation. Project sites are first-party descriptions and can overstate adoption. Winner selection also creates survivorship bias; this is not a statistical study of all launched coins or their marketing spend.

CoinGecko's pages retrieved for this research showed BONK approximately 93.7%, LOFI 96.3% and BLUB 96.6% below their all-time highs. Those are changing snapshots, not price forecasts. Large historical peaks coexist with severe drawdowns, so a successful campaign should be judged by sustained participation and usable liquidity, not just peak valuation. [BONK market data](https://www.coingecko.com/en/coins/bonk), [LOFI market data](https://www.coingecko.com/en/coins/lofi-2), [BLUB market data](https://www.coingecko.com/en/coins/blub)

## Positioning and social plan

Lead with **“Meme with a bite!”** and Viper's playful predator identity. Use the eating-the-other-memes artwork as one recurring joke, supplemented by expressive standalone Viper reactions: hungry, patient, skeptical, victorious, sleepy and surprised. Give people a character they can adopt; every post need not mention competitors.

Follow the hook with a short factual description: Sui-native, once minted, burn-only, free approved claims and funded term-lock rewards. Present pseudonymous participation accurately; V1PR transfers are publicly visible and the token has no implemented confidential-transfer protocol. Do not market it as a private coin.

Start with X for public conversation and Telegram for community support. Keep one authoritative website linking the official accounts, verified coin type, pool, explorer and monitor. Add Discord only when contributors need structured work rooms. This channel selection is an operational recommendation, not measured proof that one platform produces better returns.

### Before opening trading

- Prepare 20 reusable meme templates, 12 reaction stickers/GIFs and three short character clips. Keep consistent colors, face and name. These are production targets, not existing assets.
- Prepare pinned posts explaining the project, buying safely, claim eligibility, lock terms and wallet controls. Clearly state rewards are simple annual token rates converted to term rewards, not guaranteed fiat yield or guaranteed fiat profit.
- Recruit a pilot cohort of five contributors for art, Sui education, moderation, translation and community events. Publish tasks, capped compensation and payment receipts. Fund approved work from Community programs; do not empty its 200-million allocation into marketing.
- Announce the claim policy and opening schedule before approvals. One wallet is not one person; the contract's wallet cap does not prevent Sybil farming. No new referral smart contract is needed for launch.

### First four weeks after opening

| Period | Work | Evidence to review |
| --- | --- | --- |
| Week 1 | Publish official receipts and pool links, an onboarding video, a launch Q&A and the first claim cohort. | Working buys/sells, failed transactions, support load, approved claims and realistic sell depth. |
| Week 2 | Run a judged meme contest and distribute reusable reactions. Hold one Sui-focused educational Space. | Original submissions, independent creators, repeat community activity and attributed site visits. |
| Week 3 | Release a second content set, translations and a contributor spotlight. Test a small creator collaboration where permitted. | Visitors who return or participate after the campaign, deliverable quality and compensation cost. |
| Week 4 | Publish Community spending, liquidity changes, burns and reward commitments. Renew only effective contributor work. | Retention, concentration, paid cost per retained participant and actual active liquidity. |

Working cadence: one or two original X posts daily, three short clips weekly and one community Q&A weekly. Adjust to observed quality and staff capacity. Relevant genuine replies help conversation; coordinated unsolicited shilling, purchased engagement and repetitive link raids are not the operating plan.

For affiliates, start with campaign links identifying the source of voluntary website visits and reviewed contributor deliverables. Avoid paying per new wallet, buy volume or unverified signup: these are easy to farm and do not establish durable participation. There is no on-chain affiliate enforcement in the current contract. Public reporting should be aggregate, with minimal data collection and no silent link between social identities and wallets.

Compensated promotion includes token payments and ambassador incentives. X requires paid-partnership disclosure and its current policy prohibits financial/crypto paid partnerships in the EU, UK and Australia. Do not assume adding an ad label makes a campaign permitted everywhere. Verify the actual campaign and audience before spending. [X paid-partnership policy](https://help.x.com/en/rules-and-policies/paid-partnerships-policy)

## Claims, liquidity and discovery

The free-claim allocation is 100 million tokens, twice the recommended 50-million opening token inventory. That does not mean the pool can absorb all claims being sold: its ability to pay sellers depends on active liquidity and actual paired assets. Start approvals in published cohorts within the existing cap and 90-day window, prioritize legitimate community participation, and measure sell impact before expanding. Do not change the published eligibility policy opportunistically or require a purchase to access a supposedly free claim.

DEX Screener documents automatic indexing after a token has liquidity and at least one transaction. Verify that the chosen pool is supported and indexed, then publish that exact pair; enhanced metadata is separate from ordinary listing. [DEX Screener listing guide](https://docs.dexscreener.com/token-listing)

Verify aggregator routes and wallet metadata before advertising them. Submit a normal CoinGecko application once V1PR is actively trading on an exchange it tracks; approval is not guaranteed and its guidance explicitly rejects community listing spam. [CoinGecko listing guidance](https://support.coingecko.com/hc/en-us/articles/4498866124057-Why-Are-Newer-Projects-Listed-Before-Mine)

Hop.fun and Turbos.fun token-creation workflows must not be used to create a second V1PR or silently replace the custom allocation and lock program. Their support for discovering or importing this existing coin requires separate verification. Do not call a platform a listing partner merely because it has a token-creation interface.

## Measures and readiness

Review active liquidity and executable buy/sell quotes, ownership concentration excluding labeled treasuries/pools/vaults, new and returning participating wallets, claim-to-lock participation, rewards committed/available, actual burns, recurring contributors and support failures. A wallet count is not a human count, volume is not necessarily organic, and total pool value is not the same as immediately available depth.

The current website monitor supplies object checks and a bounded activity feed, browser-local history and configured pair volume. It does not yet provide campaign attribution, comprehensive historical retention cohorts or independently measured organic trading. Record those limitations instead of displaying fabricated analytics.

The release still needs actual public destination wallets, paired SUI, the pool configuration and custody policy, a successful venue/wallet rehearsal and security review. The next implementation task is the Cetus compatibility and liquidity rehearsal. Marketing preparation can proceed alongside it; a purchase announcement follows verified trading readiness.
