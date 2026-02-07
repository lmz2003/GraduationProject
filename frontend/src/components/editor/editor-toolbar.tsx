'use client';

import React, { useCallback } from 'react';
import { useEditorState } from 'platejs/react';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image,
  FileCode,
} from 'lucide-react';

import {
  Toolbar,
  ToolbarGroup,
  ToolbarButton,
} from '@/components/ui/toolbar';

export const EditorToolbar: React.FC<{ className?: string }> = ({ className }) => {
  const editor = useEditorState();

  if (!editor) return null;

  const handleToggleMark = useCallback((mark: string) => {
    editor.tf.toggleMark(mark);
  }, [editor]);

  const handleToggleNode = useCallback((type: string) => {
    if (type === 'h1') {
      editor.tf.toggleBlock(type);
    } else if (type === 'h2') {
      editor.tf.toggleBlock(type);
    } else if (type === 'h3') {
      editor.tf.toggleBlock(type);
    } else if (type === 'blockquote') {
      editor.tf.toggleBlock(type);
    } else if (type === 'ul') {
      (editor.api as any).list?.toggle?.({ type: 'ul' });
    } else if (type === 'ol') {
      (editor.api as any).list?.toggle?.({ type: 'ol' });
    }
  }, [editor]);

  return (
    <Toolbar className={className}>
      <ToolbarGroup>
        <ToolbarButton
          tooltip="加粗 (Ctrl+B)"
          onClick={() => handleToggleMark('bold')}
          size="sm"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="斜体 (Ctrl+I)"
          onClick={() => handleToggleMark('italic')}
          size="sm"
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="下划线 (Ctrl+U)"
          onClick={() => handleToggleMark('underline')}
          size="sm"
        >
          <Underline className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="代码 (Ctrl+E)"
          onClick={() => handleToggleMark('code')}
          size="sm"
        >
          <Code className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          tooltip="删除线 (Ctrl+Shift+X)"
          onClick={() => handleToggleMark('strikethrough')}
          size="sm"
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          tooltip="标题 1 (Ctrl+Alt+1)"
          onClick={() => handleToggleNode('h1')}
          size="sm"
        >
          <Heading1 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="标题 2 (Ctrl+Alt+2)"
          onClick={() => handleToggleNode('h2')}
          size="sm"
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="标题 3 (Ctrl+Alt+3)"
          onClick={() => handleToggleNode('h3')}
          size="sm"
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="引用 (Ctrl+Shift+.)"
          onClick={() => handleToggleNode('blockquote')}
          size="sm"
        >
          <Quote className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          tooltip="项目符号列表"
          onClick={() => handleToggleNode('ul')}
          size="sm"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="有序列表"
          onClick={() => handleToggleNode('ol')}
          size="sm"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup>
        <ToolbarButton
          tooltip="插入图片"
          onClick={() => {
            const url = prompt('请输入图片URL:');
            if (url) {
              (editor.api as any).img?.insertImg?.({ url });
            }
          }}
          size="sm"
        >
          <Image className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="插入链接"
          onClick={() => {
            const url = prompt('请输入链接URL:');
            if (url) {
              (editor.api as any).link?.insert?.({ url });
            }
          }}
          size="sm"
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="代码块"
          onClick={() => {
            (editor.api as any).codeBlock?.insert?.();
          }}
          size="sm"
        >
          <FileCode className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  );
};

export default EditorToolbar;
