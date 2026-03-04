'use client';

import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { clsx } from 'clsx';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayDuration?: number;
}

export function Tooltip({ content, children, side = 'top', delayDuration = 300 }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={5}
          className={clsx(
            'z-50 rounded-md bg-slate-700 px-3 py-1.5 text-xs text-slate-100',
            'shadow-lg border border-slate-600',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-slate-700" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
