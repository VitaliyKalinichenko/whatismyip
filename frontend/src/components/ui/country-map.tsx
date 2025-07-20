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

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  // Multiple CDN sources for country outline/map images  
  const flagEmoji = getFlagEmoji(countryCode);
  const imageSources = [
    // Primary source: Country outline silhouettes from a reliable source
    `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${countryCode.toLowerCase()}/vector.svg`,
    // Fallback 1: Alternative map outline service
    `https://cdn.jsdelivr.net/gh/lipis/flag-icons@6.11.0/flags/1x1/${countryCode.toLowerCase()}.svg`,
    // Fallback 2: High-quality flag service
    `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`,
    // Fallback 3: Another flag service
    `https://cdn.jsdelivr.net/npm/country-flag-icons@1.5.7/3x2/${countryCode.toUpperCase()}.svg`,
    // Fallback 4: Emoji flag fallback
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50%" x="50%" dominant-baseline="middle" text-anchor="middle" font-size="60">${flagEmoji}</text></svg>`,
  ];

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageFailed(false);
  };

  const handleImageError = () => {
    // Try next source if available
    if (currentSourceIndex < imageSources.length - 1) {
      setCurrentSourceIndex(currentSourceIndex + 1);
    } else {
      // All sources failed
      setImageFailed(true);
      setImageLoaded(false);
    }
  };

  // If no country code provided or all images failed, show globe icon
  if (!countryCode || imageFailed) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-md border border-gray-200 shadow-sm`}>
        <Globe className="w-6 h-6 text-blue-400" />
        {countryCode && (
          <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-tl-md">
            {countryCode.toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded-md border border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100`}>
      {/* Loading state */}
      {!imageLoaded && !imageFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Country image */}
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
      
      {/* Country code overlay for large size */}
      {size === 'lg' && imageLoaded && (
        <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-tl-md">
          {countryCode.toUpperCase()}
        </div>
      )}
    </div>
  );
} 