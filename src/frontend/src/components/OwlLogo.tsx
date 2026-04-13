/**
 * OwlLogo — A cute boho owl reading a book, rendered as inline SVG.
 * Uses the app's terracotta / sage / cream palette.
 */
export function OwlLogo({
  size = 36,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="BAM Book Builder owl logo"
    >
      {/* Body — rounded warm shape */}
      <ellipse cx="32" cy="38" rx="18" ry="20" fill="#e8d5c4" />

      {/* Belly patch */}
      <ellipse cx="32" cy="42" rx="11" ry="12" fill="#faf6f1" />

      {/* Left wing */}
      <path
        d="M14 34c-3 4-4 12-1 16 2-3 5-8 7-10z"
        fill="#bf6a3a"
        opacity="0.7"
      />
      {/* Right wing */}
      <path
        d="M50 34c3 4 4 12 1 16-2-3-5-8-7-10z"
        fill="#bf6a3a"
        opacity="0.7"
      />

      {/* Ear tufts */}
      <path d="M20 20l-4-8c2 1 6 4 7 7z" fill="#bf6a3a" opacity="0.8" />
      <path d="M44 20l4-8c-2 1-6 4-7 7z" fill="#bf6a3a" opacity="0.8" />

      {/* Head */}
      <circle cx="32" cy="24" r="14" fill="#d4b896" />

      {/* Face disc */}
      <ellipse cx="25" cy="24" rx="7" ry="7.5" fill="#faf6f1" />
      <ellipse cx="39" cy="24" rx="7" ry="7.5" fill="#faf6f1" />

      {/* Eyes */}
      <circle cx="25" cy="24" r="5" fill="#3d2e1f" />
      <circle cx="39" cy="24" r="5" fill="#3d2e1f" />

      {/* Eye shine */}
      <circle cx="27" cy="22.5" r="1.8" fill="white" />
      <circle cx="41" cy="22.5" r="1.8" fill="white" />
      <circle cx="24" cy="25.5" r="0.8" fill="white" />
      <circle cx="38" cy="25.5" r="0.8" fill="white" />

      {/* Beak */}
      <path d="M30 28l2 3.5 2-3.5z" fill="#bf6a3a" />

      {/* Blush cheeks */}
      <circle cx="20" cy="28" r="2.5" fill="#c97a63" opacity="0.35" />
      <circle cx="44" cy="28" r="2.5" fill="#c97a63" opacity="0.35" />

      {/* Feet */}
      <ellipse cx="27" cy="57" rx="4" ry="1.5" fill="#bf6a3a" opacity="0.7" />
      <ellipse cx="37" cy="57" rx="4" ry="1.5" fill="#bf6a3a" opacity="0.7" />

      {/* Book — left page */}
      <path
        d="M20 46c0-1 1-2 3-2h9v10h-9c-2 0-3-1-3-2z"
        fill="#a8c5a0"
        opacity="0.85"
      />
      {/* Book — right page */}
      <path
        d="M44 46c0-1-1-2-3-2h-9v10h9c2 0 3-1 3-2z"
        fill="#5a9a60"
        opacity="0.75"
      />
      {/* Book spine */}
      <line
        x1="32"
        y1="44"
        x2="32"
        y2="54"
        stroke="#3d2e1f"
        strokeWidth="0.8"
      />

      {/* Page lines */}
      <line
        x1="24"
        y1="48"
        x2="30"
        y2="48"
        stroke="#3d2e1f"
        strokeWidth="0.4"
        opacity="0.3"
      />
      <line
        x1="24"
        y1="50"
        x2="29"
        y2="50"
        stroke="#3d2e1f"
        strokeWidth="0.4"
        opacity="0.3"
      />
      <line
        x1="34"
        y1="48"
        x2="40"
        y2="48"
        stroke="#3d2e1f"
        strokeWidth="0.4"
        opacity="0.3"
      />
      <line
        x1="34"
        y1="50"
        x2="39"
        y2="50"
        stroke="#3d2e1f"
        strokeWidth="0.4"
        opacity="0.3"
      />

      {/* Heart above book */}
      <path
        d="M32 42c-.6-1.2-2.2-1.5-3-.5-.8 1 0 2.2 3 3.8 3-1.6 3.8-2.8 3-3.8-.8-1-2.4-.7-3 .5z"
        fill="#c97a63"
        opacity="0.6"
      />
    </svg>
  );
}
