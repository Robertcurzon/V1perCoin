// Vite supplies '/' locally and '/ViperCoin/' on GitHub Pages.
export function siteUrl(path = '') { return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`; }
export function currentPage() {
  const base = import.meta.env.BASE_URL;
  const path = window.location.pathname;
  return path.startsWith(base) ? path.slice(base.length).replace(/\/+$/, '') : '';
}

export type Socials = { x: string; telegram: string; discord: string };
export const site = {
  repository: 'https://github.com/Robertcurzon/ViperCoin',
  socials: {
    x: import.meta.env.VITE_SOCIAL_X || '',
    telegram: import.meta.env.VITE_SOCIAL_TELEGRAM || '',
    discord: import.meta.env.VITE_SOCIAL_DISCORD || '',
  } satisfies Socials,
};
const socialDomains = { x: ['x.com', 'twitter.com'], telegram: ['t.me', 'telegram.me'], discord: ['discord.gg', 'discord.com'] };
export function validateSocialUrl(channel: keyof Socials, value: string): string {
  if (!value.trim()) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !socialDomains[channel].includes(url.hostname)) throw Error(`Invalid ${channel} community URL: use HTTPS on the expected platform domain.`);
  return url.href;
}
export function configuredSocials(socials: Socials = site.socials) {
  const names = { x: 'X', telegram: 'Telegram', discord: 'Discord' };
  return (Object.keys(names) as (keyof Socials)[]).flatMap(channel => {
    const url = validateSocialUrl(channel, socials[channel]);
    return url ? [{ name: names[channel], url }] : [];
  });
}
// Validate configured links before rendering them. The release build validates them too.
configuredSocials();
