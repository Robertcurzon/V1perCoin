import launch from './launch.json';
export { launch };
const address = /^0x[0-9a-fA-F]{64}$/;
const zero = `0x${'0'.repeat(64)}`;
export function isManifestConfigured(manifest: typeof launch): boolean {
  return manifest.status === 'verified'
  && ['testnet', 'mainnet'].includes(manifest.network)
  && [manifest.packageId, manifest.currencyId, manifest.vaultId, manifest.claimsId, manifest.founder, manifest.community, manifest.publicReserve, manifest.initialLiquidity, manifest.laterLiquidity, manifest.vaultAdminCapId, manifest.claimsAdminCapId].every((id) => address.test(id) && id !== zero)
  && manifest.founder.toLowerCase() !== manifest.community.toLowerCase()
  && manifest.coinType === `${manifest.packageId}::v1pr::V1PR`
  && [manifest.publishDigest, manifest.allocationDigest, manifest.immutableDigest, manifest.metadataDigest].every((digest) => /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(digest));

}
export const isLaunchConfigured = isManifestConfigured(launch);
