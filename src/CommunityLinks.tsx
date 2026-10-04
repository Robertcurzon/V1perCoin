import { V1per } from './V1per';
import { useRef } from 'react';
import { site, configuredSocials, type Socials } from './site';

export function CommunityLinks({ socials = site.socials, dark = false }: { socials?: Socials; dark?: boolean }) {
  const channels = configuredSocials(socials);
  return <div className="community-links">{channels.length ? channels.map(({ name, url }) => <a key={name} className={`button ${dark ? 'dark' : 'lime'}`} href={url} target="_blank" rel="noreferrer">{name} ↗</a>) : <><p>Channels opening soon.</p><a className={`button ${dark ? 'dark' : 'lime'}`} href={site.repository} target="_blank" rel="noreferrer">FOLLOW ON GITHUB ↗</a></>}</div>;
}

export function JoinDenButton({ className = 'button lime' }: { className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <><button type="button" className={className} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>JOIN THE DEN ↗</button><dialog className="den-dialog" ref={dialog} aria-label="Join the Viper community"><div className="dialog-top"><h2>JOIN THE DEN.</h2><button type="button" className="dialog-close" aria-label="Close community links" onClick={() => dialog.current?.close()}>×</button></div><p><V1per /> Coin (<V1per />). Good company. Sharp memes.</p><CommunityLinks /></dialog></>;
}
