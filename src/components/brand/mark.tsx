/**
 * The Cartableo mark.
 *
 * Built on the family's grammar (Leofresh §1, Decathleo §1): every mark is a
 * disc with one structural move and one contrasting core, and the core takes
 * the surface colour so a single drawing works on charcoal and on paper.
 *
 * Leofresh cuts through produce; Decathleo looks down a weight plate. Cartableo
 * reads as a disc of concentric layers around a terminal prompt:
 *
 *   - the segmented outer ring is the perimeter — the boundary you probe or
 *     defend, and the gaps are the way in (cyber);
 *   - the inner ring is depth — the app is literally six tiers deep, L0 to L5
 *     (learning);
 *   - the core is a prompt chevron in the surface colour (dev).
 *
 * Family rules that apply: the disc never rotates and is never cropped, clear
 * space is half a diameter, minimum size 20px, and below ~28px the fine detail
 * drops to a simplified disc + core.
 */
export function CartableoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Family rule: under ~28px the ring gaps and the inner ring stop resolving,
  // so ship the simplified variant rather than a muddy full one.
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
      {/* Perimeter — eight segments with gorges, the family's segmented move. */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="var(--cb-or)"
        strokeWidth="2.5"
        strokeLinecap="butt"
        {...(simplified ? {} : { strokeDasharray: "8.6 1.61" })}
      />

      {/* Depth — the inner layer. Dropped in the simplified variant. */}
      {!simplified && (
        <circle
          cx="16"
          cy="16"
          r="9"
          stroke="var(--cb-or)"
          strokeWidth="1.5"
          opacity="0.75"
        />
      )}

      {/* Core — takes the surface colour, like the family's hole and core. */}
      <circle cx="16" cy="16" r="5.75" fill="var(--cb-or)" />
      <path
        d="M13.35 13.4L15.95 16L13.35 18.6"
        stroke="var(--cb-bg)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="17.15"
        y1="18.6"
        x2="18.65"
        y2="18.6"
        stroke="var(--cb-bg)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
