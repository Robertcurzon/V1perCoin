// Vite supplies '/' locally and '/ViperCoin/' on GitHub Pages.
export function siteUrl(path = '') { return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`; }
export function currentPage() {
  const base = import.meta.env.BASE_URL;
  const path = window.location.pathname;
  return path.startsWith(base) ? path.slice(base.length).replace(/\/+$/, '') : '';
}
