'use client';

import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  VideoPlugin,
} from '@platejs/media/react';
import {
  ImageElement,
  VideoElement,
  AudioElement,
  FileElement,
  MediaEmbedElement,
} from '@/components/ui/media-node';

export const MediaKit = [
  ImagePlugin.configure({
    node: { component: ImageElement },
  }),
  VideoPlugin.configure({
    node: { component: VideoElement },
  }),
  AudioPlugin.configure({
    node: { component: AudioElement },
  }),
  FilePlugin.configure({
    node: { component: FileElement },
  }),
  MediaEmbedPlugin.configure({
    node: { component: MediaEmbedElement },
  }),
];
