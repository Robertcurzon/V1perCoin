import launch from './launch.json';
import { treasuryAddressValid } from './feastData';
export { launch };
const address = /^0x[0-9a-fA-F]{64}$/;
const zero = `0x${'0'.repeat(64)}`;
export function isManifestConfigured(manifest: typeof launch): boolean {
  const custody = [manifest.founder, manifest.community, manifest.initialLiquidity, manifest.laterLiquidity];
  return manifest.status === 'verified'
  && ['testnet', 'mainnet'].includes(manifest.network)
  && [manifest.packageId, manifest.currencyId, manifest.vaultId, manifest.claimsId, manifest.feastId, manifest.upgradeCapId, ...custody, manifest.vaultAdminCapId, manifest.claimsAdminCapId, manifest.feastAdminCapId].every((id) => address.test(id) && id !== zero)
  && new Set(custody.map(a => a.toLowerCase())).size === custody.length
  && manifest.coinType === `${manifest.packageId}::v1pr::V1PR`
  && [manifest.publishDigest, manifest.allocationDigest, manifest.immutableDigest, manifest.metadataDigest].every((digest) => /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(digest))
  && Number.isSafeInteger(manifest.freeClaimsStartMs) && manifest.freeClaimsStartMs >= 0
  && (manifest.freeClaimsStartMs === 0 || /^https:\/\//.test(manifest.freeClaimsApplicationUrl))
  && typeof manifest.feastOpen === 'boolean'
  && (!manifest.feastOpen || (manifest.network === 'mainnet' && Number.isSafeInteger(manifest.feastStartMs) && manifest.feastStartMs > 0 && manifest.feastStartMs % 1000 === 0 && /^https:\/\//.test(manifest.feastSubmissionUrl) && manifest.freeClaimsStartMs === manifest.feastStartMs && Object.entries(manifest.feastTreasury).length === 4 && ['ethereum', 'solana', 'dogecoin', 'memecore'].every(chain => treasuryAddressValid(chain, manifest.feastTreasury[chain as keyof typeof manifest.feastTreasury]))));
}
export const isLaunchConfigured = isManifestConfigured(launch);
