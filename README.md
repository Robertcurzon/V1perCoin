# Viper Coin (V1PR)

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

The 150 million V1PR reward pool is first come, first served. Each accepted lock escrows its full reward. Annual simple token rates grow exponentially from 1% for one month to 10% for 24 months. Term reward = annual rate × months / 12, reaching 20% at 24 months. A month is 30 days. Early exits earn the completed-month reward and pay 5% × remaining fraction, split 50% pending burn / 40% Community / 10% founder. Mature exits have no fee. Permissionless flushing burns the pending balance. Ordinary transfers and swaps are untaxed. No inflation, confidential transfers, cross-chain paid campaign or specialty-action tax is included.

The wallet interface uses official Sui dApp Kit with gRPC and remains disabled until `src/launch.json` contains verified deployment records. Wallet destinations, independent review, testnet rehearsal, hosted metadata, package immutability and funded exchange liquidity remain launch work. No private keys belong in this repository.

Regenerate the shared fixed-rate schedule with `python3 scripts/generate_reward_schedule.py`. The Move package is in `viper/`; selected brand assets are in `public/`.

The `/monitor` page charts onchain supply, funded/available/reserved/paid rewards, locked principal and cumulative lock/claim interactions. Browser observations refresh every 30 seconds. Configure a real `dexPairId` after mainnet pool creation to enable verified-pair rolling 24-hour USD volume from DEX Screener. No fabricated deployment or market data is shown.


### Website verification and monitoring

`/whitepaper` embeds the journal PDF with black side margins. Production builds automatically synchronize the downloadable Markdown copy. `/monitor` polls onchain state every 30 seconds, shows freshness and object versions, links to Suiscan, and reads scoped contract events and public custody wallet balances. Charts are browser observations, not a full index. Wallet actions re-read validated currency/vault/claim state before signature; claim eligibility is checked onchain.

Before enabling the website, fill all manifest deployment records and custody fields in `src/launch.json`: `publicReserve`, `initialLiquidity`, `laterLiquidity`, `vaultAdminCapId`, `claimsAdminCapId`, and `metadataDigest` supplement the existing coin, shared objects, founder/Community and transaction fields. Record the actual allocation recipients and admin capability IDs, then independently verify current capability owners in Suiscan. All custody and admin IDs and the metadata-deletion digest are required before the manifest enables transactions. Exchange pair configuration remains optional until a funded pair exists. Status `verified` is an operator assertion; it does not independently verify package immutability or source bytecode. Delete metadata authority and make the package immutable before participant use. The shared currency check fails closed if metadata remains mutable.

The Move events now include the vault/pool ID for scoping. Lock and claim events include chain-clock timestamps; funding and pause events use their ledger checkpoint. Keep the frontend and deployed contract event schemas together. No deployment identifiers or funded liquidity have been fabricated.


### Publication

See [website deployment](docs/WEBSITE_DEPLOYMENT.md). Main-branch publication automatically typesets the journal-style white paper, runs website checks and deploys GitHub Pages. All routes and assets support the project subdirectory. The downloadable PDF and standalone LaTeX source are linked from the reader. The Markdown document remains the canonical text; `npm run whitepaper:source` regenerates LaTeX without changing the economic rules.

Custody addresses must be nonzero and pairwise distinct. Named allocation constants sum to the complete initial supply. Approval and expiry boundaries, multi-user funding/exits and permissionless burn flushing are covered by unit tests.
