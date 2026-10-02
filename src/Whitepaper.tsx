import { siteUrl } from './site';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import paper from '../docs/WHITEPAPER.md?raw';
const headings = [...paper.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
function sectionId(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''); }
export default function Whitepaper() {
  return <div className="site whitepaper-page"><header className="header"><a className="brand" href={siteUrl('')}><img src={siteUrl('viper-logo.webp')} alt=""/><span>VIPER<span className="accent">.</span></span></a><nav><a href={siteUrl('')}>Home</a><a href={siteUrl('monitor/')}>Onchain monitor</a><a href={siteUrl('whitepaper.pdf')} target="_blank" rel="noreferrer">Journal PDF ↗</a><a href={siteUrl('Viper_Coin_Whitepaper.tex')} download>LaTeX source ↗</a></nav></header><main className="section paper-layout"><aside><div className="kicker">V1PR / WHITE PAPER</div><nav aria-label="White paper contents">{headings.map((h) => <a key={h} href={`#${sectionId(h)}`}>{h}</a>)}</nav><p className="fine-print">The rules here match the local Move implementation. Deployment and independent review are still required.</p></aside><article className="paper-content"><Markdown remarkPlugins={[remarkGfm]} skipHtml components={{ h2: ({ children }) => <h2 id={sectionId(String(children))}>{children}</h2>, a: ({ href, children }) => <a href={href} target={href?.startsWith('https://') ? '_blank' : undefined} rel="noreferrer">{children}</a>, table: ({ children }) => <div className="paper-table"><table>{children}</table></div> }}>{paper}</Markdown></article></main></div>;
}
