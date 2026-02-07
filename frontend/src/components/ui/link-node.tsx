'use client';

import type { PlateElementProps } from 'platejs/react';

import { cn } from '@/lib/utils';

export function LinkElement(props: PlateElementProps) {
  const { element, ...rest } = props;
  const url = element.url as string;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('cursor-pointer text-blue-500 underline hover:text-blue-600')}
      {...(rest as any)}
    >
      {props.children}
    </a>
  );
}
