/**
 * Marchio Lobby per il web: stesso anello oro della PWA, senza React Native.
 */
export function BrandMark({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const size = compact ? 28 : 64;
  const stroke = compact ? 4.5 : 9;

  return (
    <div className={compact ? 'brand-mark brand-mark-compact' : 'brand-mark'} aria-label="Lobby">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
        />
      </svg>
      <span className="brand-word">LOBBY</span>
    </div>
  );
}
