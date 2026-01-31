import React from 'react';

export interface User {
  username: string;
  role: 'user' | 'staff' | 'admin' | 'owner';
  banned?: boolean;
  muted?: boolean;
  profilePic?: string;
  profileBorder?: string;
  customColor?: string;
  customBorderWidth?: number;
  bio?: string;
  socials?: {
    discord?: string;
    whatsapp?: string;
    youtube?: string;
  };
}

export interface Rating {
  userId: string;
  username: string;
  rating: number;
  review?: string;
  timestamp: number;
}

export interface Changelog {
  version: string;
  text: string;
  timestamp: number;
}

export interface Item {
  id: string;
  title: string;
  desc: string;
  cat: string;
  link: string;
  youtube?: string;
  originalCreator?: string;
  img: string;
  gallery?: string[];
  changelog?: Changelog[];
  authorId: string;
  author: string;
  ratings?: Record<string, Rating>;
  featured?: boolean;
}

export interface CategoryState {
  [key: string]: string;
}

export const BORDERS: Record<string, { name: string; class: string; style?: React.CSSProperties }> = {
  'default': { name: 'Default', class: 'border-2 border-[#2d2d3a]' },
  'custom': { name: 'CUSTOM 🎨', class: 'border-custom' },
  'gold': { name: 'Gold', class: 'shadow-[0_0_0_3px_gold,0_0_15px_gold]' },
  'fire': { name: 'Fire', class: 'shadow-[0_0_0_2px_#ff4500,0_0_15px_#ff4500] animate-pulse' },
  'ice': { name: 'Ice', class: 'shadow-[0_0_0_2px_#00ffff,0_0_15px_#00ffff]' },
  'neon_red': { name: 'Neon Red', class: 'border-2 border-[#ff0055] shadow-[0_0_10px_#ff0055]' },
  'neon_green': { name: 'Neon Green', class: 'border-2 border-[#0f0] shadow-[0_0_10px_#0f0]' },
  'rainbow': { name: 'Rainbow', class: 'ring-2 ring-offset-2 ring-offset-black ring-red-500' },
  'glitch': { name: 'Glitch', class: 'border-2 border-white shadow-[-2px_0_red,2px_0_blue]' },
};