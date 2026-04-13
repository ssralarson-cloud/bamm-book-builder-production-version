import type React from "react";

interface AssetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  alt: string;
}

/**
 * AssetImage component for rendering /assets/{name}.png images
 * with non-draggable and user-select-none properties for consistent asset display
 */
export function AssetImage({
  name,
  alt,
  className = "",
  style,
  ...props
}: AssetImageProps) {
  return (
    <img
      src={`/assets/${name}.png`}
      className={className}
      draggable={false}
      style={{ userSelect: "none", ...style }}
      {...props}
      alt={alt}
    />
  );
}
