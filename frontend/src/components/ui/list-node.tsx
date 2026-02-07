'use client';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ListElement(props: PlateElementProps) {
  const { element } = props;
  const isOrdered = element.type === 'ol';

  return (
    <PlateElement
      as={isOrdered ? 'ol' : 'ul'}
      {...props}
      className={cn(
        isOrdered ? 'list-decimal' : 'list-disc',
        'mb-2 ml-6 space-y-1'
      )}
    >
      {props.children}
    </PlateElement>
  );
}

export function ListItemElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} as="li" className={cn('m-0')}>
      {props.children}
    </PlateElement>
  );
}
