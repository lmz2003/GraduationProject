'use client';

import { AutoformatPlugin } from '@platejs/autoformat/react';
import { KEYS } from 'platejs';

export const AutoformatKit = [
  AutoformatPlugin.configure({
    rules: [
      // Block formatting
      {
        mode: 'block',
        type: 'h1',
        match: '# ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: 'h2',
        match: '## ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: 'h3',
        match: '### ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: 'h4',
        match: '#### ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: 'h5',
        match: '##### ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: 'h6',
        match: '###### ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: 'blockquote',
        match: '> ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: KEYS.ul,
        match: ['* ', '- '],
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: KEYS.ol,
        match: '1. ',
        preFormat: (editor) => editor.tf.clear(),
      },
      {
        mode: 'block',
        type: 'code_block',
        match: '```',
        preFormat: (editor) => editor.tf.clear(),
      },
      // Inline formatting
      {
        mode: 'text',
        type: 'bold',
        match: '**',
        matchEnd: '**',
      },
      {
        mode: 'text',
        type: 'italic',
        match: '*',
        matchEnd: '*',
      },
      {
        mode: 'text',
        type: 'strikethrough',
        match: '~~',
        matchEnd: '~~',
      },
      {
        mode: 'text',
        type: 'code',
        match: '`',
        matchEnd: '`',
      },
      // Smart punctuation
      {
        mode: 'text',
        match: '--',
        replace: '—',
      },
      {
        mode: 'text',
        match: '...',
        replace: '…',
      },
    ],
  }),
];
