'use client';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function CodeBlockElement(props: PlateElementProps) {
  const { element } = props;
  const language = (element.lang as string) || 'plaintext';

  return (
    <PlateElement {...props} as="pre" className={cn('m-0 overflow-x-auto bg-slate-900 text-slate-50 rounded-lg p-4 mb-2')}>
      <code
        className={cn(
          'font-mono text-sm',
          `language-${language}`
        )}
      >
        {props.children}
      </code>
    </PlateElement>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} as="div" className={cn('m-0 px-0 py-0')}>
      {props.children}
    </PlateElement>
  );
}
