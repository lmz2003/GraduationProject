'use client';

import { ListPlugin } from '@platejs/list/react';
import { ListItemElement, ListElement } from '@/components/ui/list-node';

export const ListKit = [
  ListPlugin.configure({
    node: {
      component: ListElement,
    },
  }),
];
