import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  width?: number; // Kept for API compatibility, but handled via CSS/native mostly now
  fallback?: string;
}

const ASSETS = {
  NO_PFP: 'https://raw.githubusercontent.com/RakaMC2/Marketplace/main/nopfp.png',
};

export const SmartImage: React.FC<SmartImageProps> = ({ src, alt, className, width, fallback = ASSETS.NO_PFP }) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallback);
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Reset state when src prop changes
    setHasError(false);
    setLoaded(false);
    setCurrentSrc(src || fallback);
  }, [src, fallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallback);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-[#1a1a1d] ${className}`}>
      {/* Loading Placeholder */}
      {!loaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1d] animate-pulse z-0">
           <ImageIcon size={20} className="text-white/10" />
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-all duration-500 ease-out z-10 relative ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
      />
    </div>
  );
};