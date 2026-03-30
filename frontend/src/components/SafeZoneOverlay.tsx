import React from 'react';

// Strict trim size union type matching backend specifications
export type TrimSizePreset = '8.5x8.5' | '8x10' | '10x8';

export interface SafeZoneOverlayProps {
  trimSize?: TrimSizePreset;
  bleed?: boolean;
  showBleed?: boolean;
  showTrim?: boolean;
  showSafe?: boolean;
  className?: string;
}

// Trim size configurations with proper percentages for Amazon KDP compliance
const TRIM_CONFIGS: Record<TrimSizePreset, { bleedPercent: number; safePercent: number }> = {
  '8.5x8.5': { bleedPercent: 4.5, safePercent: 12 },
  '8x10': { bleedPercent: 4.5, safePercent: 12 },
  '10x8': { bleedPercent: 4.5, safePercent: 12 },
};

/**
 * SafeZoneOverlay renders purely as a non-blocking background layer using
 * pointer-events-none, absolute inset-0, and z-10, with bleed, trim, and
 * optional grid indicators styled via Tailwind safe-zone color tokens.
 */
export function SafeZoneOverlay({ 
  trimSize,
  bleed = false,
  showBleed = true, 
  showTrim = true, 
  showSafe = true,
  className = ""
}: SafeZoneOverlayProps) {
  // Guard: Return null if trimSize is not defined or invalid
  if (!trimSize || !(trimSize in TRIM_CONFIGS)) {
    return null;
  }

  // Normalize bleed to boolean
  const bleedEnabled = Boolean(bleed);
  
  const config = TRIM_CONFIGS[trimSize];
  const { bleedPercent, safePercent } = config;

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 ${className}`}>
      {/* Bleed zone - outermost (only shown if bleed prop is true) */}
      {showBleed && bleedEnabled && (
        <div className="absolute inset-0 border-2 border-dashed border-safe-bleed opacity-60">
          <div className="absolute -top-5 left-2 rounded border border-safe-bleed bg-background px-1 py-0.5 text-[10px] font-semibold text-foreground">
            BLEED
          </div>
        </div>
      )}
      
      {/* Trim zone */}
      {showTrim && (
        <div 
          className="absolute border-2 border-dashed border-safe-trim opacity-60"
          style={{
            left: `${bleedPercent}%`,
            right: `${bleedPercent}%`,
            top: `${bleedPercent}%`,
            bottom: `${bleedPercent}%`,
          }}
        >
          <div className="absolute -top-5 left-2 rounded border border-safe-trim bg-background px-1 py-0.5 text-[10px] font-semibold text-foreground">
            TRIM
          </div>
        </div>
      )}
      
      {/* Safe zone - innermost */}
      {showSafe && (
        <div 
          className="absolute border-2 border-dashed border-safe-grid opacity-60"
          style={{
            left: `${safePercent}%`,
            right: `${safePercent}%`,
            top: `${safePercent}%`,
            bottom: `${safePercent}%`,
          }}
        >
          <div className="absolute -top-5 left-2 rounded border border-safe-grid bg-background px-1 py-0.5 text-[10px] font-semibold text-foreground">
            SAFE
          </div>
        </div>
      )}
    </div>
  );
}
