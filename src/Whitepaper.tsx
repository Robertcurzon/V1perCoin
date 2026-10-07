import SiteHeader, { BackHomeLink } from './SiteHeader';
import { V1per } from './V1per';
import { useEffect,useState } from 'react';
import { siteUrl } from './site';
import { validWhitepaperProof } from './whitepaperProof';
export default function Whitepaper() {
  const [verified,setVerified]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    void (async()=>{
      try {
        const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]);
        const responses=await Promise.all(['Viper_Coin_Whitepaper.tex','whitepaper.pdf','whitepaper.provenance.json'].map(file=>fetch(siteUrl(file),{signal,cache:'no-cache'})));
        if(responses.some(r=>!r.ok) || !responses[2].headers.get('content-type')?.includes('application/json'))throw Error('The updated PDF is awaiting export.');
        const [source,pdf,proof]=await Promise.all([responses[0].arrayBuffer(),responses[1].arrayBuffer(),responses[2].json()]);
        const hash=async(bytes:ArrayBuffer)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
        if(!validWhitepaperProof(proof,await hash(source),await hash(pdf)))throw Error('The PDF does not match the current LaTeX release.');
        if(!controller.signal.aborted)setVerified(true);
      }catch(e){if(!controller.signal.aborted)setError((e as Error).message);}
    })();return()=>controller.abort();
  },[]);
  return <div className="site whitepaper-page with-site-header">
    <SiteHeader/>
    <nav className="pdf-toolbar" aria-label="White paper downloads"><BackHomeLink/>{verified && <><a href={siteUrl('whitepaper.pdf')} target="_blank" rel="noreferrer">Open PDF ↗</a><a href={siteUrl('whitepaper.pdf')} download>Download PDF ↓</a></>}<a href={siteUrl('Viper_Coin_Whitepaper.tex')} download>LaTeX source ↓</a></nav>
    <main className="whitepaper-viewer">
      {verified ? <iframe className="whitepaper-pdf" src={`${siteUrl('whitepaper.pdf')}#toolbar=0&navpanes=0&view=FitH`} title="V1PER Coin (V1PER) white paper PDF" /> : <div className="pdf-status" role="status"><h1><V1per /> Coin (<V1per />)</h1><p>{error || 'Checking the current white paper PDF…'}</p><p>The release build typesets the current LaTeX source. An outdated PDF is not displayed.</p><a className="text-link" href={siteUrl('Viper_Coin_Whitepaper.tex')} download>DOWNLOAD CURRENT LATEX SOURCE ↓</a></div>}
    </main>
  </div>;
}
