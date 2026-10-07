import { site, configuredSocials, type Socials } from './site';

export function CommunityLinks({ socials = site.socials, dark = false }: { socials?: Socials; dark?: boolean }) {
  const channels = configuredSocials(socials);
  return <div className="community-links">{['X', 'Telegram', 'Discord'].map(name => {
    const channel = channels.find(item => item.name === name);
    return channel ? <a key={name} className={`button ${dark ? 'dark' : 'lime'}`} href={channel.url} target="_blank" rel="noreferrer">{name} ↗</a> : <div className="social-coming" key={name}><span>{name}</span><span>Coming soon</span></div>;
  })}<a className={`button ${dark ? 'dark' : 'lime'}`} href={site.repository} target="_blank" rel="noreferrer">PROJECT ON GITHUB ↗</a></div>;
}
