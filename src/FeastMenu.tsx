import { useState } from 'react';
import { siteUrl } from './site';
import accepted from '../scripts/feast/config.json';
import { networks } from '../scripts/feast/networks.mjs';

const tickers = Object.keys(networks).flatMap(chain => accepted.coins.filter(coin => coin.chain === chain).map(coin => coin.symbol));
const description = `Feast menu: ${tickers.join(', ')}. Decorative silver snake Feast scene; the accepted tickers are listed below.`;
/** The coin list stays readable whether the decorative image loads or fails. */
export default function FeastMenu({ compact = false }: { compact?: boolean }) {
  const [ready, setReady] = useState(false);
  return <figure className={`feast-art${compact ? ' compact' : ''}`} data-menu-state={ready ? 'art' : 'board'}>
    <img src={siteUrl('feast-menu.webp')} width="1600" height="900" alt={description} hidden={!ready} onLoad={() => setReady(true)} onError={() => setReady(false)} />
    {ready && <figcaption><p>Accepted Feast coins · check the exact networks below.</p><ul aria-label="Accepted Feast coins">{tickers.map(ticker => <li key={ticker}>{ticker}</li>)}</ul></figcaption>}
    {!ready && <div className="text-menu-board"><div className="kicker">THE VIPER'S MENU</div><ul aria-label="Accepted Feast coins">{tickers.map(ticker => <li key={ticker}>{ticker}</li>)}</ul><p>Ten tickers. One appetite.</p></div>}
  </figure>;
}
