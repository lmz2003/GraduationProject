'use client';

import { BlockSelectionPlugin } from '@platejs/selection/react';

export const BlockSelectionKit = [
  BlockSelectionPlugin.configure({
    options: {
      isSelectable: (element) => {
        return !['code_line'].includes(element.type as string);
      },
    },
  }),
];
