# Website and white paper publication

Public site: https://robertcurzon.github.io/V1perCoin/

The website deploys from `main` through `.github/workflows/publish.yml`. Every publication builds the journal-style PDF from the standalone `docs/Viper_Coin_Whitepaper.tex`, checks the web code and economics, then deploys the static `dist` folder to GitHub Pages. The workflow performs no wallet transaction or Sui token deployment.

The PDF is available at `whitepaper.pdf`; the web reader is at `whitepaper/`, and the onchain dashboard is at `monitor/`. Physical entry files make these routes directly visitable on GitHub Pages. All project links and images respect Vite's base path.

## Change and publish

1. Edit the canonical `docs/WHITEPAPER.md` and generate its source with `npm run whitepaper:source`. Review the `.tex` document and rendered PDF. Preserve the public economics unless an intentional contract change is being reviewed.
2. Run the web checks and `sui move test --path viper` for changes to the Move contracts. The reward table is regenerated separately with `scripts/generate_reward_schedule.py`.
3. Push to a `codex/` branch to run PDF and website checks without publishing. A successful `main` run publishes the website automatically. The workflow uses pinned action commits, read-only build permissions and a separate Pages deployment job.
4. Confirm the public home page, deep routes, images, PDF, and exact network labels after deployment.

## Other static hosts

Build with `npm ci` and `npm run build`, then serve `dist`. The default base is `/`; set `VITE_BASE_PATH=/V1perCoin/` for this GitHub project site or the appropriate subdirectory for another host. A production publication must also compile the supplied standalone `.tex` source and copy the resulting PDF to `public/whitepaper.pdf` before building. CI performs this automatically. The built-in LaTeX editor can preview and check the source without installing a local TeX distribution.

## Token activation is separate

Website publication does not create a token or exchange pool. `src/launch.json` remains `unpublished` until actual Sui deployment and authority records have been independently verified. Follow `docs/LAUNCH.md` for funded testnet rehearsal, fixed metadata, immutable package, allocation, claim approvals and mainnet work. Do not invent identifiers or change the manifest merely to activate the buttons.

The PDF job publishes whitepaper.provenance.json with SHA-256 hashes of the compiled LaTeX source and PDF. The website reader verifies both against the served files before embedding or offering download. A stale local PDF without matching provenance stays hidden; the current LaTeX source remains downloadable. The release pipeline rebuilds and includes both artifacts.
