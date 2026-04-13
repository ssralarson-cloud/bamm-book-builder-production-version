import type React from "react";
import { SafeZoneOverlay, type TrimSizePreset } from "./SafeZoneOverlay";

export interface PageCanvasProps {
  trimSize?: TrimSizePreset;
  bleed?: boolean;
  showGuides?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * PageCanvas component wraps content in a relative container with SafeZoneOverlay
 * as a non-blocking background layer at z-10, while interactive elements are
 * positioned at z-20 in a flex column with gap-3 and p-6 for proper layering.
 */
export function PageCanvas({
  trimSize = "8.5x8.5",
  bleed = false,
  showGuides = true,
  children,
  className = "",
}: PageCanvasProps) {
  return (
    <div
      className={`relative aspect-[1/1] overflow-hidden bg-slate-900 ${className}`}
    >
      {/* SafeZoneOverlay as non-blocking background layer at z-10 */}
      {showGuides && (
        <SafeZoneOverlay
          trimSize={trimSize}
          bleed={bleed}
          showBleed={true}
          showTrim={true}
          showSafe={true}
        />
      )}

      {/* Interactive content layer at z-20 with gap-3 and p-6 */}
      <div className="absolute inset-0 z-20 flex flex-col gap-3 p-6">
        {children}
      </div>
    </div>
  );
}
