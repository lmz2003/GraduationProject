import { Plate, usePlateEditor } from 'platejs/react';
 import * as React from 'react';
import { Editor, EditorContainer } from '@/components/editor/editor';
 import type { Value } from 'platejs';
 import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';

const initialValue: Value = [
  {
    type: 'p',
    children: [
      { text: 'Hello! Try out the ' },
      { text: 'bold', bold: true },
      { text: ', ' },
      { text: 'italic', italic: true },
      { text: ', and ' },
      { text: 'underline', underline: true },
      { text: ' formatting.' },
    ],
  },
];
export default function MyEditor() {
  const editor = usePlateEditor({
    plugins: [BoldPlugin, ItalicPlugin, UnderlinePlugin], // 添加标记插件
    value: initialValue,         // 设置初始内容
  });
 
  return (
    <Plate editor={editor}>
      <FixedToolbar className="justify-start rounded-t-lg">
        <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">B</MarkToolbarButton>
        <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">I</MarkToolbarButton>
        <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">U</MarkToolbarButton>
      </FixedToolbar>
      <EditorContainer>
        <Editor placeholder="输入您精彩的内容..." />
      </EditorContainer>
    </Plate>
  );
}