'use client';

import { BlockSelectionPlugin } from '@platejs/selection/react';

export const BlockSelectionKit = [
  BlockSelectionPlugin.configure({
    options: {
      isSelectable: (element) => {
        // 允许选择大多数块元素，除了某些特定类型
        return !['code_line'].includes(element.type as string);
      },
    },
  }),
];
