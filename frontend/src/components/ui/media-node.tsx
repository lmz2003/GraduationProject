'use client';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useFocused, useReadOnly, useSelected } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ImageElement(props: PlateElementProps) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  const url = element.url as string;
  const alt = (element.alt as string) || '图片';

  return (
    <PlateElement {...props}>
      <div className="py-2" contentEditable={false}>
        <img
          src={url}
          alt={alt}
          className={cn(
            'max-w-full h-auto rounded-md',
            selected && focused && 'ring-2 ring-ring ring-offset-2',
            !readOnly && 'cursor-pointer'
          )}
        />
      </div>
      {props.children}
    </PlateElement>
  );
}

export function VideoElement(props: PlateElementProps) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  const url = element.url as string;

  return (
    <PlateElement {...props}>
      <div className="py-2" contentEditable={false}>
        <video
          src={url}
          className={cn(
            'max-w-full h-auto rounded-md',
            selected && focused && 'ring-2 ring-ring ring-offset-2',
            !readOnly && 'cursor-pointer'
          )}
          controls
        />
      </div>
      {props.children}
    </PlateElement>
  );
}

export function AudioElement(props: PlateElementProps) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  const url = element.url as string;

  return (
    <PlateElement {...props}>
      <div className="py-2" contentEditable={false}>
        <audio
          src={url}
          className={cn(
            'w-full',
            selected && focused && 'ring-2 ring-ring ring-offset-2',
            !readOnly && 'cursor-pointer'
          )}
          controls
        />
      </div>
      {props.children}
    </PlateElement>
  );
}

export function FileElement(props: PlateElementProps) {
  const { element } = props;
  const selected = useSelected();
  const focused = useFocused();

  const url = element.url as string;
  const name = (element.name as string) || '文件';

  return (
    <PlateElement {...props}>
      <div className="py-2" contentEditable={false}>
        <a
          href={url}
          download
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 underline',
            selected && focused && 'ring-2 ring-ring ring-offset-2'
          )}
        >
          📎 {name}
        </a>
      </div>
      {props.children}
    </PlateElement>
  );
}

export function MediaEmbedElement(props: PlateElementProps) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  const url = element.url as string;

  return (
    <PlateElement {...props}>
      <div className="py-2" contentEditable={false}>
        <iframe
          src={url}
          className={cn(
            'max-w-full h-96 rounded-md',
            selected && focused && 'ring-2 ring-ring ring-offset-2',
            !readOnly && 'cursor-pointer'
          )}
          allowFullScreen
          title="embedded media"
        />
      </div>
      {props.children}
    </PlateElement>
  );
}
