'use client';

import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const bgColors = [
  'bg-brand-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-teal-600',
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

const sizeMap = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold text-white',
        sizeMap[size],
        hashColor(name),
        className,
      )}
      aria-label={name}
      role="img"
    >
      {getInitials(name)}
    </div>
  );
}
