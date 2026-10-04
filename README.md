# V1PER Coin (V1PER)

Deflationary supply: minted once, burn-only.

**[Public website](https://robertcurzon.github.io/ViperCoin/) · [Journal PDF](https://robertcurzon.github.io/ViperCoin/whitepaper.pdf) · [Onchain monitor](https://robertcurzon.github.io/ViperCoin/monitor/)**

Sui meme coin with a once-minted, burn-only supply, approved free claims and fully funded lock rewards. Website publication is separate from token deployment: no mainnet token or funded exchange pool is configured yet.


## Run and verify

```sh
npm ci
npm run dev
npm run test:economics
npm run test:monitor
npm run test:whitepaper
npm run typecheck
npm run lint
npm run build
sui move test --path viper
```

[White paper](docs/WHITEPAPER.md) · [Vault](docs/STAKING_DESIGN.md) · [Distribution](docs/DISTRIBUTION_DESIGN.md) · [Launch runbook](docs/LAUNCH.md)

The 150 million V1PER reward pool is first come, first served. Each accepted lock escrows its full reward. Annual simple token rates grow exponentially from 1% for one month to 10% for 24 months. Term reward = annual rate × months / 12, reaching 20% at 24 months. A month is 30 days. Early exits earn the completed-month reward and pay 5% × remaining fraction, split 50% pending burn / 40% Community / 10% founder. Mature exits have no fee. Permissionless flushing burns the pending balance. Ordinary transfers and swaps are untaxed. No inflation, confidential transfers or specialty-action tax is included. The Feast scorer and claim contracts are implemented; contributions stay closed until real launch inputs and historical pricing access are verified.

The wallet interface uses official Sui dApp Kit with gRPC and remains disabled until `src/launch.json` contains verified deployment records. Wallet destinations, independent review, testnet rehearsal, hosted metadata, package immutability and funded exchange liquidity remain launch work. No private keys belong in this repository.

Regenerate the shared fixed-rate schedule with `python3 scripts/generate_reward_schedule.py`. The Move package is in `viper/`; selected brand assets are in `public/`.

The `/monitor` page charts onchain supply, funded/available/reserved/paid rewards, locked principal and cumulative lock/claim interactions. Browser observations refresh every 30 seconds. Configure a real `dexPairId` after mainnet pool creation to enable verified-pair rolling 24-hour USD volume from DEX Screener. No fabricated deployment or market data is shown.


### Website verification and monitoring

`/whitepaper` embeds the journal PDF with black side margins. Production builds automatically synchronize the downloadable Markdown copy. `/monitor` polls onchain state every 30 seconds, shows freshness and object versions, links to Suiscan, and reads scoped contract events and public custody wallet balances. Charts are browser observations, not a full index. Wallet actions re-read validated currency/vault/claim state before signature; claim eligibility is checked onchain.

Before enabling the website, populate real coin/object IDs, four distinct Sui custody addresses, three AdminCap IDs, the original upgradeCapId and publication/allocation/immutability/metadata-deletion digests in src/launch.json. Include feastId and feastAdminCapId for the shared Feast pool. The client requires an explicit deleted/missing upgrade capability, immutable metadata and reconciled Feast/vault accounting. Transport errors fail closed. Independently match the upgrade ID to its original publication receipt; configured IDs and checks are not a bytecode audit. feastOpen defaults false. Opening requires valid chain Foundation destinations, feastStartMs and a published HTTPS binding-submission channel. Exchange-pair configuration remains separate.

The Move events now include the vault/pool ID for scoping. Lock and claim events include chain-clock timestamps; funding and pause events use their ledger checkpoint. Keep the frontend and deployed contract event schemas together. No deployment identifiers or funded liquidity have been fabricated.


### Publication

See [website deployment](docs/WEBSITE_DEPLOYMENT.md). Main-branch publication automatically typesets the journal-style white paper, runs website checks and deploys GitHub Pages. All routes and assets support the project subdirectory. The downloadable PDF and standalone LaTeX source are linked from the reader. The Markdown document remains the canonical text; `npm run whitepaper:source` regenerates LaTeX without changing the economic rules.

Custody addresses must be nonzero and pairwise distinct. Named allocation constants sum to the complete initial supply. Approval and expiry boundaries, multi-user funding/exits and permissionless burn flushing are covered by unit tests.

Feast claims use the shared 100-million pool. Only its AdminCap can set allocations before finalization; no edits afterward. Finalization burns unallocated tokens. Liquid claims vest 50% immediately and 50% over 60 days; finalization reserves all 12/24-month rewards or aborts, and locked claims consume those reservations despite pauses, the ordinary opening date or later capacity exhaustion. Anyone may burn unclaimed tokens after 90 days. No minting or administrator sweep exists.


## Feed the Viper

Memes with bite. Viper is the calm, confident apex predator in the Sui meme jungle. Venom means participation and community momentum; nothing promises gains. The 21-day Feast uses the fixed accepted list and reproducible scorer in [scripts/feast](scripts/feast/README.md). Signatures bind source wallets and selected terms to Sui destinations. Publish canonical receipts, price archives, CSV/hash and the scoring commit before finalization.

**Feast proceeds.** Coins sacrificed during the Feast are transferred to wallets controlled by the V1PER founder (the "V1PER Foundation"). They are not burned, held in trust, or governed by participants. The founder may hold, sell, reinvest or spend them at the founder's sole discretion. Participants receive V1PER only, with no claim on Foundation assets or future income. Foundation receiving addresses and all received transfers are published for verification.

The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are founder-controlled and discretionary.

The monitor publishes Foundation explorer links and hash-verified export totals/clearing price; onchain claims and burns refresh independently. For public/feast-results.json use the scorer's exact results.json bytes, set feastResultsSha256 to their SHA-256 hash, and match feastStartMs to the frozen scoring config. Scheduled vesting requires a complete, reconciled table read. Never label export totals as live Foundation balances.


Free claims are limited to 100M V1PER: at most 10,000 reviewed addresses, exactly 10,000 each, one claim per address. Seven-day signed applications precede day 0; the onchain window is scheduled once with at least seven days' notice, approvals freeze at opening and claims end 14 days later. No extension or administrator sweep. See scripts/claims/README.md and the white paper's phase table.

The Feast menu includes native DOGE and native MemeCore M; all four receiving networks must be configured and rehearsed. Network- and campaign-bound signatures, native receipt checks and pricing rules are in scripts/feast/. No contribution campaign is open.


## Trust assumptions

Cross-chain finality, complete exports and historical-price provenance; correct CSV publication and AdminCap allocation entries; original-work eligibility review and intake timestamps; receipt publication and multisig custody; 25% proceeds conversion/funding, exchange opening-price floor and LP locking; discretionary Foundation/Community budgets; and deployment/source correspondence are operator responsibilities, not restrictions imposed by Move. See the white paper section 11 for the full list. Contract rules are enforced by feast::set_allocations/finalize/claim_locked/burn_unclaimed (hash, review, reservations and expiry), lock_vault::open/deposit (opening and emergency pause), free_claims::schedule/approve/claim (one-time claim dates/caps) and launch::allocate (custody and once-only allocation).

## Website configuration

The homepage has seven sections, with the full participation and custody rules at `/rules/`.
Set `VITE_SOCIAL_X`, `VITE_SOCIAL_TELEGRAM` and `VITE_SOCIAL_DISCORD` to official HTTPS channel URLs. They default to empty strings; absent channels stay hidden and Join the Den shows GitHub with “Channels opening soon.” Both rendering and the release build reject unexpected platform domains or URLs containing credentials.

`VITE_PUBLIC_SITE_URL` sets the absolute HTTPS publication root for canonical and sharing URLs (default: `https://robertcurzon.github.io/ViperCoin/`). `VITE_BASE_PATH` still controls physical project-path deployment. Every route gets its own metadata from `site-pages.json` and the original `public/social-preview.png` card, whose editable source is `public/social-preview.svg`.
