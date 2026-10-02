# V1PR technical release scope

Implemented on Sui with the Currency Standard: one-time creation, burn-only supply, sealed atomic allocation, approved free claims, prefunded lock positions, exponential fixed integer rates, tapered early-exit fees, real Currency burns, deposit pause and voluntary reward replenishment. The React site uses the official current `@mysten/dapp-kit-react` and `@mysten/sui` packages with gRPC rather than deprecated JSON-RPC-only dApp Kit. Object content is parsed as BCS to avoid transport-dependent JSON layouts. [Official integration guide](https://sdk.mystenlabs.com/dapp-kit/getting-started/react).

## Onchain primitives

- Clock at 0x6 is the only time authority. Clients cannot supply timestamps. [Clock documentation](https://docs.sui.io/sui-stack/on-chain-primitives/access-time).
- Currency is registered using Coin Registry at 0xc. Finalizing registration changes the Currency object ID; record the resulting shared ID. BurnOnly locks minting and permits genuine supply reductions. [Currency Standard](https://docs.sui.io/onchain-finance/fungible-tokens/create-a-fungible-token), [framework reference](https://docs.sui.io/references/framework/sui_sui/coin_registry).
- Position has no `store` and records its owner and vault. Principal and reserved rewards are separate balances. Full reservation avoids a global emissions accumulator, time-sliced dilution, and unfunded claims.
- Fixed integer reward rates are generated using high-precision Decimal, rounded down to ppm, and checked into both Move and the site. Runtime math uses u128 onchain and BigInt in the UI.
- Published source and package immutability are required to make the authority statements meaningful; retaining upgrade control could change module behavior.

## Removed from the launch scope

Cross-chain contributions require chain watchers, finality/reconciliation, custody and refund systems. Confidential transfers require a separate compatible, reviewed protocol and cannot be advertised merely by linking a privacy page. Product taxes require an actual defined product. Referral commissions require campaign and fraud rules. None is part of the deployed release specification or presented as live functionality.

Base coin transfers, claim approvals, positions and recipients remain public. Pseudonyms are welcome but do not create cryptographic transaction privacy. Sui's privacy ecosystem does not make an arbitrary Coin<T> private by default. [Sui privacy overview](https://www.sui.io/privacy).

The local tests validate accounting and permissions; they are not an audit. Remaining deployment work is listed in [LAUNCH.md](LAUNCH.md).
