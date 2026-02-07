'use client';

import { IndentPlugin } from '@platejs/indent/react';
import { TextAlignPlugin } from '@platejs/align/react';
import { KEYS } from 'platejs';

export const IndentAlignKit = [
  IndentPlugin.configure({
    options: {
      queryNodeToindent: (node) => {
        // 允许缩进这些元素
        return ![KEYS.blockquote, KEYS.code_block, 'code_line'].includes(
          node.type as string
        );
      },
    },
  }),
  TextAlignPlugin.configure({
    options: {
      queryNodeToAlign: (node) => {
        // 允许对齐这些元素
        return ![KEYS.code_block, 'code_line'].includes(node.type as string);
      },
    },
  }),
];
