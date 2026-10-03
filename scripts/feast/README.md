# V1PR Feast scoring

The fixed accepted list is SHIB, PUMP, PEPE, TRUMP, PENGU, SPX, BONK, FLOKI, WIF and FARTCOIN on the exact Ethereum or Solana contracts in config.json. Selection uses the dated 2026-10-03 CoinGecko meme-category snapshot and published Pyth feeds archived in snapshots/. No campaign is open: windowStart and chain Treasury addresses must be supplied from real launch records.

The V1PR Treasury (founder-controlled) receives the contributed coins. Publish its Ethereum and Solana addresses before signing or transfers. Use chain-appropriate multisigs. Never substitute a Sui address for a source-chain destination.

## Reproduce

1. Copy config.json into an input JSON object as `config`; set the real Unix-second windowStart and published Treasury addresses. Freeze and publish this configuration before opening the 21-day campaign.
2. Add `bindings`, `transfers`, and `prices` arrays/object. Bindings contain chain, source, sui, lockMonths (0, 12, 24), message, signature and lockSignature. Sign exactly `Bind <source address> to Sui <sui address> for the V1PR Feast`; then also sign that message followed by a newline and `Lock choice: <months> months`. The second signature prevents substitution of the chosen term. Ethereum EOA personal-sign and Solana Ed25519 signatures are supported. Contract-wallet signatures are not supported.
3. Export every finalized transfer from bound sources to the Treasury. Each record contains chain, contract, from, to, amountBaseUnits (integer string), confirmedAt (Unix seconds), txHash and index (unique event/instruction index). Independently verify canonical receipts, finality and export completeness; this scorer does not run an indexer or establish chain finality. Archive and publish receipt provenance and all Treasury transfers, including excluded ones.
4. With authenticated historical access available, run `node scripts/feast/fetch_prices.mjs INPUT.json PRICES.json`. Set PYTH_BENCHMARKS_API_KEY only in the operator environment. Merge the output's prices into INPUT.json and archive rawArchive. The authenticated endpoint remains a launch rehearsal requirement: unauthenticated testing returned HTTP 401. Never open contributions until historical coverage is verified. Missing, stale or future data is a hard error.
5. Run `node scripts/feast/score.mjs INPUT.json OUTPUT_DIRECTORY`; run `npm run test:feast`. Publish the exact input, price archive, results.json, allocations.csv, allocations.sha256 and the scoring script Git commit. Protect signatures against reuse by freezing this campaign's bindings. Bindings publicly link source wallets to Sui destinations.
6. Compare totals independently, pass CSV amounts (six-decimal V1PR base units) and lock_months to feast::set_allocations, publish its digests, then finalize once. Onchain finalization burns the unallocated remainder.

## Deterministic rules

Window is [start, start + 21 days). Days 1–5 multiply by 1.50; each subsequent day's step falls linearly from day 5 to day 19, where it reaches 1.00; days 19–21 remain 1.00. Liquid, 12-month and 24-month choices multiply by 1.00, 1.10 and 1.25 respectively. Every source bound to one Sui destination must choose the same term.

Price is the lesser of confirmation-time spot and the arithmetic average of 1,440 preceding one-minute as-of Pyth observations. Each must be no more than 60 seconds old at its sampling time. This sampled average is not a continuous time-weighted average. USD prices/values use eight decimals, amounts use native token decimals. Integer arithmetic rounds down; points use a common denominator of 280 so the declared multipliers are exact.

Each wallet receives the lesser of its proportional 100M-pool allocation and 10,000 V1PR per USD before multipliers. No per-wallet cap applies. Rounding and the price floor can leave inventory, burned at finalization. CSV is sorted by normalized Sui address with LF newlines; SHA-256 hashes its exact bytes. Clearing price is total eligible USD divided by total allocated V1PR, published as an exact rational. Received totals in results.json are scored eligible receipts, not current Treasury balances or a live all-transfer index.

The DEX pool opens at no less than the Feast clearing price, paired with 25% of Feast proceeds. Remaining proceeds are founder-controlled and discretionary. This is an operating commitment requiring funding, exchange transactions and receipts, not an automatic cross-chain contract restriction.
