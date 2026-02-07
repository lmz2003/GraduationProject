'use client';

import { CodeBlockPlugin, CodeLinePlugin } from '@platejs/code-block/react';
import { CodeBlockElement, CodeLineElement } from '@/components/ui/code-block-node';

export const CodeBlockKit = [
  CodeBlockPlugin.configure({
    node: { component: CodeBlockElement },
  }),
  CodeLinePlugin.configure({
    node: { component: CodeLineElement },
  }),
];
