'use client';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function LinkElement(props: PlateElementProps) {
  const { element } = props;
  const url = element.url as string;

  return (
    <PlateElement
      as="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={cn('cursor-pointer text-blue-500 underline hover:text-blue-600')}
    >
      {props.children}
    </PlateElement>
  );
}
