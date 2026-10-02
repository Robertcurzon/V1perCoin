import { explorerUrl } from './explorer';
import { launch } from './manifest';
export default function ExplorerLink({ kind, value, children }: { kind: 'coin' | 'object' | 'account' | 'tx'; value: string; children: React.ReactNode }) {
  const url = explorerUrl(launch.network, kind, value);
  return url ? <a href={url} target="_blank" rel="noreferrer">{children} ↗</a> : <span>{children} · not configured</span>;
}
