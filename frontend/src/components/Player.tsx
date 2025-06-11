'use client';

import React from 'react';
import Image from 'next/image';

interface PlayerProps {
  size?: 'xsmall' | 'small' | 'medium' | 'large';
  showName?: boolean;
  playerName?: string;
  playerId?: string | number;
  align?: 'left' | 'center';
}

const Player = (props: PlayerProps) => {
  const { 
    playerId, 
    playerName, 
    size = 'medium', 
    showName = true,
    align = 'left'
  } = props;

  // Define size configurations for different display options
  const sizeConfig = {
    xsmall: {
      container: "gap-1",
      image: "w-6 h-5",
      dimensions: { width: 26, height: 19 },
      textSize: "text-xs"
    },
    small: {
      container: "gap-1.5",
      image: "w-8 h-6",
      dimensions: { width: 35, height: 26 },
      textSize: "text-sm"
    },
    medium: {
      container: "gap-2",
      image: "w-10 h-8",
      dimensions: { width: 44, height: 32 },
      textSize: "text-lg"
    },
    large: {
      container: "gap-3",
      image: "w-16 h-12",
      dimensions: { width: 68, height: 50 },
      textSize: "text-xl"
    }
  };

  // Get configuration based on requested size
  const config = sizeConfig[size];

  // Generate initials from player name for fallback
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const initials = getInitials(playerName);

  // Set alignment classes
  const alignmentClass = align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex items-center ${config.container} ${alignmentClass}`}>
      <div className="relative flex items-center justify-center">
        {playerId ? (
          <Image
            src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`}
            alt={playerName || 'NBA Player'}
            className={`${config.image} rounded object-cover overflow-hidden`}
            width={config.dimensions.width}
            height={config.dimensions.height}
            onError={(e) => {
              // If image fails to load, show fallback
              (e.target as HTMLImageElement).style.display = 'none';
              ((e.target as HTMLImageElement).nextElementSibling as HTMLElement)!.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback for missing images or when playerId is not available */}
        <div 
          className={`${config.image} bg-blue-100 dark:bg-blue-800 rounded flex items-center justify-center text-blue-800 dark:text-blue-200 font-medium ${
            playerId ? 'hidden absolute inset-0' : ''
          }`}
          style={{ display: playerId ? 'none' : 'flex' }}
        >
          {initials}
        </div>
      </div>
      
      {showName && playerName && (
        <p className={`${config.textSize} font-medium text-gray-800 dark:text-gray-100 truncate`}>
          {playerName}
        </p>
      )}
    </div>
  );
};

export default Player;
