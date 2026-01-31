import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { SmartImage } from './SmartImage';

interface FeaturedCarouselProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ items, onItemClick }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const current = items[index];

  return (
    <div className="relative w-full h-[350px] md:h-[450px] rounded-3xl overflow-hidden mb-10 group shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-white/5 bg-black">
      {/* Background with blur */}
      <div className="absolute inset-0">
          <SmartImage 
            src={current.img} 
            alt="" 
            className="w-full h-full object-cover transition-all duration-700 ease-in-out blur-2xl opacity-40 scale-110" 
            width={200}
          />
      </div>
      
      {/* Content Container */}
      <div className="absolute inset-0 flex items-center justify-center">
          <SmartImage 
            src={current.img} 
            alt={current.title}
            width={1200}
            className="w-full h-full object-cover opacity-80 mask-image-gradient"
          />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex items-end">
        <div className="w-full p-8 md:p-12 flex flex-col md:flex-row gap-8 items-end justify-between">
            <div className="flex-1 space-y-4 animate-fade-in max-w-3xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500 text-black text-xs font-bold shadow-lg shadow-yellow-500/20">
                    <Star size={12} fill="currentColor" /> FEATURED
                </span>
                <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight drop-shadow-xl leading-none">{current.title}</h2>
                <p className="text-gray-300 line-clamp-2 text-base md:text-lg drop-shadow-md font-medium">{current.desc.substring(0, 150)}...</p>
                <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden">
                        {/* We don't have user object here easily, so simpler avatar or passed prop would be better, but sticking to design */}
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-white">
                            {current.author.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <span className="text-sm font-bold text-white drop-shadow">{current.author}</span>
                </div>
            </div>
            
            <button 
                onClick={() => onItemClick(current)}
                className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)] whitespace-nowrap text-sm md:text-base"
            >
                Check it out
            </button>
        </div>
      </div>

      {/* Controls */}
      {items.length > 1 && (
        <>
            <button 
                onClick={() => setIndex((index - 1 + items.length) % items.length)}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={() => setIndex((index + 1) % items.length)}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
                <ChevronRight size={24} />
            </button>
            
            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {items.map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 shadow-lg ${idx === index ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                    />
                ))}
            </div>
        </>
      )}
    </div>
  );
};