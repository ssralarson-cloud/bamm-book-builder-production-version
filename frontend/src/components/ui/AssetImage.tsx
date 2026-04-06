import React from 'react';

interface AssetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  alt: string;
}

/**
 * AssetImage component for rendering /assets/generated/{name}.png images
 * with non-draggable and user-select-none properties for consistent asset display
 */
export function AssetImage({ name, alt, className = '', ...props }: AssetImageProps) {
  return (
    <img
      src={`/assets/generated/${name}.png`}
      alt={alt}
      className={className}
      draggable={false}
      style={{ userSelect: 'none', ...props.style }}
      {...props}
    />
  );
}
