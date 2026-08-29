/**
 * The Cartableo mark.
 *
 * The family's marks are filled discs, not outlines: Leofresh's kiwi is a green
 * disc with a cream core, Decathleo's plate is banded colour around a hole that
 * takes the surface. One disc, one contrasting core — that is the whole recipe.
 *
 * Cartableo's core is a prompt chevron: the terminal, which is where the cyber
 * and the dev both happen, and what you sit in front of to learn this trade.
 * A single groove near the rim gives the disc the family's banded read.
 *
 * Family rules: never rotated, never cropped, clear space half a diameter,
 * minimum 20px, and below 28px the groove stops resolving so it is dropped.
 */
export function CartableoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const simplified = size < 28;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="Cartableo"
    >
      <circle cx="16" cy="16" r="15" fill="var(--cb-or)" />
      {!simplified && (
        <circle
          cx="16"
          cy="16"
          r="12.6"
          stroke="var(--cb-bg)"
          strokeWidth="1.1"
          opacity="0.28"
        />
      )}
      <path
        d="M12 9.5L20.5 16L12 22.5"
        stroke="var(--cb-bg)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
