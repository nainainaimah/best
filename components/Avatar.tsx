'use client';

import { useState } from 'react';

type AvatarProps = {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  borderColor?: string;
};

export default function Avatar({
  src,
  alt = 'Avatar',
  fallbackText = 'U',
  size = 'md',
  className = '',
  borderColor = '#6366F1',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-32 h-32 text-4xl',
  };

  const showFallback = !src || imageError;

  const handleImageError = () => {
    console.warn(`Failed to load avatar image: ${src}`);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  if (showFallback) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white ${className}`}
        style={{ backgroundColor: borderColor }}
        title={alt}
      >
        {fallbackText.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {imageLoading && (
        <div
          className={`absolute inset-0 rounded-full flex items-center justify-center font-bold text-white`}
          style={{ backgroundColor: borderColor }}
        >
          {fallbackText.charAt(0).toUpperCase()}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity`}
        style={{ borderColor }}
      />
    </div>
  );
}
