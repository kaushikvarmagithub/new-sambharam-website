/**
 * Reusable inline SVG marigold for the floral event-themed decoration.
 * Pure CSS-coloured via currentColor; sizing via className.
 */
export default function MarigoldSVG({ className = "", style }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="petalGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <g transform="translate(60 60)">
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-28"
            rx="9"
            ry="22"
            fill="url(#petalGrad)"
            transform={`rotate(${(i * 360) / 12})`}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse
            key={`inner-${i}`}
            cx="0"
            cy="-16"
            rx="6"
            ry="14"
            fill="currentColor"
            opacity="0.85"
            transform={`rotate(${(i * 360) / 8 + 22.5})`}
          />
        ))}
        <circle cx="0" cy="0" r="6" fill="#7c2d12" />
        <circle cx="-2" cy="-2" r="1.6" fill="#fde68a" opacity="0.8" />
      </g>
    </svg>
  );
}

/**
 * Single five-petal blossom for floating background petals.
 */
export function PetalSVG({ className = "", style }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g transform="translate(30 30)">
        {Array.from({ length: 5 }).map((_, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-12"
            rx="6"
            ry="13"
            fill="currentColor"
            opacity="0.85"
            transform={`rotate(${(i * 360) / 5})`}
          />
        ))}
        <circle cx="0" cy="0" r="4" fill="#7c2d12" />
      </g>
    </svg>
  );
}
