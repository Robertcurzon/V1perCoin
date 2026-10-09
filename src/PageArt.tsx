import { siteUrl } from './site';

export type ArtScene = 'home' | 'free-tokens' | 'feast' | 'lock' | 'community' | 'supply' | 'verify' | 'rules' | 'monitor';

/** Decorative scenes never substitute for terms, asset lists or live data. */
export default function PageArt({ scene, preview = false }: { scene: ArtScene; preview?: boolean }) {
  const path = scene === 'feast' ? 'feast-menu.webp' : `art/${scene}.webp`;
  return <figure className={`page-art${preview ? ' art-preview' : ''}`} aria-hidden="true">
    <img src={siteUrl(path)} alt="" width="1536" height="864" loading={preview ? 'lazy' : 'eager'} decoding="async" />
  </figure>;
}
