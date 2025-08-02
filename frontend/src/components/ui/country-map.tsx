"use client";

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface CountryMapProps {
  countryCode: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Function to get flag emoji from country code
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export function CountryMap({ countryCode, className = '', size = 'md' }: CountryMapProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Reset states when country code changes
  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [countryCode]);

  // Adjusted size configurations for larger icons
  const sizeClasses = {
    sm: 'w-12 h-12',   // 48×48px
    md: 'w-20 h-20',   // 80×80px
    lg: 'w-28 h-28'    // 112×112px
  };

  const flagEmoji = getFlagEmoji(countryCode);
  const imageSources = [
    `/mapsicon/all/${countryCode.toLowerCase()}/vector.svg`,
    `/mapsicon/all/${countryCode.toLowerCase()}/vector.png`,
    `data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><text y=\"50%\" x=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-size=\"60\">${flagEmoji}</text></svg>`
  ];

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageFailed(false);
  };

  const handleImageError = () => {
    if (currentSourceIndex < imageSources.length - 1) {
      setCurrentSourceIndex(currentSourceIndex + 1);
    } else {
      setImageFailed(true);
      setImageLoaded(false);
    }
  };

  if (!countryCode || imageFailed) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-md border border-gray-200 shadow-sm`}>
        <Globe className="w-8 h-8 text-blue-400" />
        {countryCode && (
          <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-tl-md">{countryCode.toUpperCase()}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-md border border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100`}>
      {!imageLoaded && !imageFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={imageSources[currentSourceIndex]}
        alt={`${countryCode} country map`}
        className={`w-full h-full object-contain transition-opacity duration-200 p-1 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      {size === 'lg' && imageLoaded && (
        <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-tl-md">{countryCode.toUpperCase()}</div>
      )}
    </div>
  );
}
