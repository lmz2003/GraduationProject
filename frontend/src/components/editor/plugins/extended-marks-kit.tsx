'use client';

import {
  SubscriptPlugin,
  SuperscriptPlugin,
} from '@platejs/basic-nodes/react';

export const ExtendedMarksKit = [
  // 已在 BasicMarksKit 中，这里为了完整性保留配置示例
  SubscriptPlugin.configure({
    shortcuts: { toggle: { keys: 'mod+comma' } },
  }),
  SuperscriptPlugin.configure({
    shortcuts: { toggle: { keys: 'mod+period' } },
  }),
];
