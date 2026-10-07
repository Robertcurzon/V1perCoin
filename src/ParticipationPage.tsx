import SiteHeader, { BackHomeLink, SiteFooter } from './SiteHeader';
import { AllocationSection, FreeClaimsSection, CommunitySection } from './ProjectSections';
import FeastPanel from './FeastPanel';
import LockPanel from './LockPanel';
import { CommunityLinks } from './CommunityLinks';
export type ParticipationRoute = 'free-tokens' | 'feast' | 'lock' | 'community' | 'tokenomics';
export default function ParticipationPage({ page }: { page: ParticipationRoute }) {
  return <div className="site home-page participation-page with-site-header"><a className="skip-link" href="#page-content">Skip to content</a><SiteHeader/><main id="page-content"><div className="section"><BackHomeLink/></div>
    {page === 'free-tokens' && <FreeClaimsSection/>}
    {page === 'feast' && <FeastPanel/>}
    {page === 'lock' && <LockPanel/>}
    {page === 'tokenomics' && <AllocationSection/>}
    {page === 'community' && <><section id="den" className="closing"><div className="section closing-grid"><div><h2>JOIN THE<br/><em>COMMUNITY.</em></h2><p>Follow launch updates, share memes and meet the community.</p></div><CommunityLinks dark/></div></section><CommunitySection/></>}
  </main><SiteFooter/></div>;
}
