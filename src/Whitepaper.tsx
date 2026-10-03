import { siteUrl } from './site';

export default function Whitepaper() {
  return <div className="site whitepaper-page">
    <header className="header">
      <a className="brand" href={siteUrl('')}><img src={siteUrl('viper-logo.webp')} alt=""/><span>VIPER<span className="accent">.</span></span></a>
      <nav aria-label="White paper navigation">
        <a href={siteUrl('')}>Home</a>
        <a href={siteUrl('monitor/')}>Onchain monitor</a>
        <a href={siteUrl('whitepaper.pdf')} target="_blank" rel="noreferrer">Open PDF ↗</a>
        <a href={siteUrl('whitepaper.pdf')} download>Download PDF ↓</a>
      </nav>
    </header>
    <main className="whitepaper-viewer">
      <iframe className="whitepaper-pdf" src={`${siteUrl('whitepaper.pdf')}#toolbar=0&navpanes=0&view=FitH`} title="Viper Coin (V1PR) white paper PDF" />
    </main>
  </div>;
}
