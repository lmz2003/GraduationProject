'use client';

import { IndentPlugin } from '@platejs/indent/react';

// Text alignment is handled by block styling in Plate v52
// No separate TextAlignPlugin exists in the official build
export const IndentAlignKit = [
  IndentPlugin.configure({}),
];
