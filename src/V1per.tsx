/** Accessible text: the colored digit remains part of the same readable word. */
export function V1per() {
  return <span className="v1per">V<span className="one">1</span>PER</span>;
}
export function BrandText({ text }: { text: string | number | null | undefined | false }) {
  if (typeof text !== 'string') return <>{text}</>;
  return <>{text.split('V1PER').map((part, index) => <span key={index}>{index > 0 && <V1per />}{part}</span>)}</>;
}
