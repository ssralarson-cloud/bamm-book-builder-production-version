/**
 * OwlLogo — A classic, simple black-and-white owl reading a book.
 * Clean line-art style, slightly larger default size.
 */
export function OwlLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BAM Book Builder owl logo"
    >
      {/* Ear tufts */}
      <path d="M18 18l-5-10c3 2 7 5 8 9z" fill="#222" />
      <path d="M46 18l5-10c-3 2-7 5-8 9z" fill="#222" />

      {/* Head */}
      <circle cx="32" cy="22" r="16" fill="#222" />

      {/* Face discs — classic owl look */}
      <circle cx="24" cy="22" r="9" fill="white" />
      <circle cx="40" cy="22" r="9" fill="white" />

      {/* Eyes — large, simple, classic */}
      <circle cx="24" cy="22" r="6" fill="#222" />
      <circle cx="40" cy="22" r="6" fill="#222" />

      {/* Eye shine — single clean dot */}
      <circle cx="26.5" cy="20" r="2.2" fill="white" />
      <circle cx="42.5" cy="20" r="2.2" fill="white" />

      {/* Beak — small triangle */}
      <path d="M30 28l2 3 2-3z" fill="#555" />

      {/* Body */}
      <ellipse cx="32" cy="44" rx="16" ry="16" fill="#222" />

      {/* Belly — white chest patch */}
      <ellipse cx="32" cy="46" rx="10" ry="11" fill="white" />

      {/* Belly chevron lines — classic owl feather pattern */}
      <path d="M27 41l5 3 5-3" stroke="#ccc" strokeWidth="0.8" fill="none" />
      <path d="M26 44.5l6 3 6-3" stroke="#ccc" strokeWidth="0.8" fill="none" />
      <path d="M27 48l5 3 5-3" stroke="#ccc" strokeWidth="0.8" fill="none" />

      {/* Wings — tucked at sides */}
      <path d="M16 36c-2 5-2 14 1 17 1-4 3-10 4-12z" fill="#333" />
      <path d="M48 36c2 5 2 14-1 17-1-4-3-10-4-12z" fill="#333" />

      {/* Feet */}
      <ellipse cx="27" cy="59" rx="4" ry="1.5" fill="#555" />
      <ellipse cx="37" cy="59" rx="4" ry="1.5" fill="#555" />

      {/* ── Open book ── */}
      <path d="M19 50c0-1 1-2 3-2h10v9H22c-2 0-3-.8-3-2z" fill="white" stroke="#222" strokeWidth="0.8" />
      <path d="M45 50c0-1-1-2-3-2H32v9h10c2 0 3-.8 3-2z" fill="white" stroke="#222" strokeWidth="0.8" />
      <line x1="32" y1="48" x2="32" y2="57" stroke="#222" strokeWidth="1" />

      {/* Page lines */}
      <line x1="23" y1="52" x2="30" y2="52" stroke="#bbb" strokeWidth="0.5" />
      <line x1="23" y1="54" x2="28" y2="54" stroke="#bbb" strokeWidth="0.5" />
      <line x1="34" y1="52" x2="41" y2="52" stroke="#bbb" strokeWidth="0.5" />
      <line x1="34" y1="54" x2="39" y2="54" stroke="#bbb" strokeWidth="0.5" />
    </svg>
  );
}
