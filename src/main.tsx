import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { dAppKit } from './dapp-kit';
import './index.css';
import { currentPage, legacyPage, siteUrl } from './site';
function redirectLegacySection() {
  const destination = currentPage() === '' && legacyPage(window.location.hash);
  if (destination) window.location.replace(siteUrl(destination));
}
redirectLegacySection();
window.addEventListener('hashchange', redirectLegacySection);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DAppKitProvider dAppKit={dAppKit}><App /></DAppKitProvider>
  </StrictMode>
);
