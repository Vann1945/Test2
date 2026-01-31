import React, { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  /** The current rating value (0 to 5) */
  rating: number;
  /** Size of the stars in pixels */
  size?: number;
  /** If true, the user can hover and click to set a rating */
  interactive?: boolean;
  /** Callback fired when a star is clicked */
  onRate?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  size = 16, 
  interactive = false, 
  onRate 
}) => {
  // State to track the rating value while the user hovers over the stars.
  // This allows for visual feedback before the user commits to a rating by clicking.
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Determine which rating to display.
  // If the component is interactive and the user is hovering, show the hoverRating.
  // Otherwise, show the persisted/passed rating.
  const displayRating = interactive && hoverRating !== null ? hoverRating : rating;

  // Round the display rating to the nearest 0.5 to support half-star visualization.
  // For example, 4.3 becomes 4.5, 4.1 becomes 4.0.
  const rounded = Math.round(displayRating * 2) / 2;
  const stars = [];

  // Loop to generate 5 stars
  for (let i = 1; i <= 5; i++) {
    // Logic to determine if the star at index 'i' should be full, half, or empty.
    const isFull = rounded >= i;
    const isHalf = !isFull && rounded >= i - 0.5;
    
    // Choose the appropriate icon component based on the state.
    // Lucide 'Star' is used for full (filled via class) and empty (transparent fill).
    // Lucide 'StarHalf' is used for half stars.
    const Icon = isHalf ? StarHalf : Star;
    
    // Base styling for transitions
    let className = "transition-all duration-200 ease-out";
    
    // Apply coloring based on state
    if (isFull || isHalf) {
      className += " fill-yellow-400 text-yellow-400"; // Gold color for filled/half
    } else {
      className += " text-gray-600 fill-transparent"; // Gray outline for empty
    }

    // Interactive hover effect: scale up the star being hovered to provide feedback
    if (interactive && hoverRating === i) {
      className += " scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
    }

    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive} // Disable button interactions if not interactive
        onClick={() => interactive && onRate?.(i)} // Trigger onRate callback on click
        onMouseEnter={() => interactive && setHoverRating(i)} // Set hover state on mouse enter
        className={`relative group focus:outline-none ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        aria-label={interactive ? `Rate ${i} stars` : `Rating: ${rating} stars`}
      >
        <Icon size={size} className={className} />
        
        {/* Tooltip functionality:
            Shows the star number when hovering in interactive mode.
            Uses absolute positioning to float above the star.
        */}
        {interactive && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0a0a0c] text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-10">
            {i} Star{i !== 1 ? 's' : ''}
          </div>
        )}
      </button>
    );
  }

  return (
    <div 
      className="flex gap-0.5 items-center" 
      // Reset hover rating when mouse leaves the entire container
      onMouseLeave={() => interactive && setHoverRating(null)}
    >
      {stars}
    </div>
  );
};