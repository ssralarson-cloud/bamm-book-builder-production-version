import React from 'react';

interface AssetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: string;
  alt: string;
}

/**
 * Map of asset names to their actual filenames in /assets/generated/
 * Caffeine generates images with dimension suffixes like .dim_64x64.png
 */
const ASSET_MAP: Record<string, string> = {
  'owl-icon': 'owl-icon.dim_64x64.png',
  'border-twig': 'border-twig.dim_512x512.png',
  'parchment-texture': 'parchment-texture.dim_512x512.png',
  'linen-texture-background': 'linen-texture-background.dim_256x256.png',
  'gnome-logo': 'gnome-logo.dim_200x200.png',
  'forest-owl': 'forest-owl.dim_512x512.png',
  'gnome-crest': 'gnome-crest.dim_512x512.png',
  'gnome-king': 'gnome-king.dim_512x512.png',
  'ink-quill': 'ink-quill.dim_512x512.png',
  'forest-border': 'forest-border.dim_512x512.png',
  'sidebar-carving': 'sidebar-carving.dim_512x512.png',
  'paper': 'paper.dim_512x512.png',
  'fairy-tale-mascot-boho-transparent': 'fairy-tale-mascot-boho-transparent.dim_200x200.png',
  'new-project-boho-icon-transparent': 'new-project-boho-icon-transparent.dim_64x64.png',
};

/**
 * AssetImage component for rendering /assets/generated/{name} images
 * with non-draggable and user-select-none properties for consistent asset display.
 * Resolves short names (e.g. "owl-icon") to actual filenames with dimension suffixes.
 */
export function AssetImage({ name, alt, className = '', ...props }: AssetImageProps) {
  const filename = ASSET_MAP[name] || `${name}.png`;
  return (
    <img
      src={`/assets/generated/${filename}`}
      alt={alt}
      className={className}
      draggable={false}
      style={{ userSelect: 'none', ...props.style }}
      {...props}
    />
  );
}
