'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor, useEditorState } from 'platejs/react';

import { BasicNodesKit } from '@/components/editor/plugins/basic-nodes-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { EditorToolbar } from '@/components/editor/editor-toolbar';
import styles from './plate-note-editor.module.scss';

export interface PlateNoteEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onHtmlChange?: (html: string) => void;
}

// 将 HTML 内容转换为 Plate 格式
const htmlToPlateValue = (initialContent: string) => {
  if (!initialContent) {
    return normalizeNodeId([
      {
        type: 'p',
        children: [{ text: '' }],
      },
    ]);
  }

  try {
    // 如果内容已经是 JSON 格式的 Plate 节点，直接使用
    try {
      const parsed = JSON.parse(initialContent);
      if (Array.isArray(parsed)) {
        return normalizeNodeId(parsed);
      }
    } catch {
      // 不是 JSON 格式，继续处理 HTML
    }

    // 如果是 HTML 格式，进行基本的转换
    const parser = new DOMParser();
    const doc = parser.parseFromString(initialContent, 'text/html');
    const nodes: any[] = [];

    // 遍历 HTML 节点并转换为 Plate 格式
    const processNode = (node: Node): any => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        return text ? { text } : null;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const children: any[] = [];

        for (const child of Array.from(element.childNodes)) {
          const processed = processNode(child);
          if (processed) {
            if (Array.isArray(processed)) {
              children.push(...processed);
            } else {
              children.push(processed);
            }
          }
        }

        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
          case 'h1':
            return { type: 'h1', children: children.length ? children : [{ text: '' }] };
          case 'h2':
            return { type: 'h2', children: children.length ? children : [{ text: '' }] };
          case 'h3':
            return { type: 'h3', children: children.length ? children : [{ text: '' }] };
          case 'h4':
            return { type: 'h4', children: children.length ? children : [{ text: '' }] };
          case 'h5':
            return { type: 'h5', children: children.length ? children : [{ text: '' }] };
          case 'h6':
            return { type: 'h6', children: children.length ? children : [{ text: '' }] };
          case 'blockquote':
            return { type: 'blockquote', children: children.length ? children : [{ text: '' }] };
          case 'p':
            return { type: 'p', children: children.length ? children : [{ text: '' }] };
          case 'strong':
          case 'b':
            return children.map((child) => ({ ...child, bold: true }));
          case 'em':
          case 'i':
            return children.map((child) => ({ ...child, italic: true }));
          case 'u':
            return children.map((child) => ({ ...child, underline: true }));
          case 's':
          case 'strike':
            return children.map((child) => ({ ...child, strikethrough: true }));
          case 'code':
            return children.map((child) => ({ ...child, code: true }));
          case 'img':
            return null; // 图片处理需要单独的插件
          default:
            return children;
        }
      }

      return null;
    };

    for (const child of Array.from(doc.body.childNodes)) {
      const processed = processNode(child);
      if (processed) {
        if (Array.isArray(processed)) {
          nodes.push(...processed.filter((n) => n));
        } else {
          nodes.push(processed);
        }
      }
    }

    const result =
      nodes.length > 0
        ? normalizeNodeId(nodes)
        : normalizeNodeId([{ type: 'p', children: [{ text: '' }] }]);

    return result;
  } catch (error) {
    console.error('Error converting initial content:', error);
    return normalizeNodeId([{ type: 'p', children: [{ text: '' }] }]);
  }
};

// 提取编辑器中的纯文本
const extractTextFromNodes = (nodes: any[]): string => {
  let text = '';

  const extractText = (node: any): void => {
    if (typeof node === 'string') {
      text += node;
    } else if (node.text) {
      text += node.text;
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => extractText(child));
    }
  };

  nodes.forEach((node: any) => extractText(node));
  return text;
};

// 编辑器内部组件，用于访问编辑器状态
const EditorContent: React.FC<{
  onWordCountChange: (count: number) => void;
}> = ({ onWordCountChange }) => {
  const editor = useEditorState();
  const callbacksRef = useRef<{ onWordCountChange: (count: number) => void }>({ onWordCountChange });

  useEffect(() => {
    callbacksRef.current = { onWordCountChange };
  }, [onWordCountChange]);

  // 监听编辑器内容变化
  useEffect(() => {
    if (!editor || !editor.children) return;

    const text = extractTextFromNodes(editor.children);
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;
    
    callbacksRef.current.onWordCountChange(words);
  }, [editor, editor?.children]);

  return (
    <EditorContainer variant="default" className={styles.editorWrapper}>
      <Editor
        variant="default"
        placeholder="开始编辑内容..."
        className={styles.editor}
      />
    </EditorContainer>
  );
};

const PlateNoteEditor: React.FC<PlateNoteEditorProps> = ({
  initialContent = '',
  onContentChange,
  onHtmlChange,
}) => {
  const [wordCount, setWordCount] = useState<number>(0);
  const isInitializedRef = useRef(false);
  const callbacksRef = useRef({ onContentChange, onHtmlChange });

  // 更新回调引用
  useEffect(() => {
    callbacksRef.current = { onContentChange, onHtmlChange };
  }, [onContentChange, onHtmlChange]);

  // 将 HTML 内容转换为 Plate 格式
  const initialValue = useMemo(() => htmlToPlateValue(initialContent), [initialContent]);

  // 处理编辑器变化
  const handleChange = useCallback((editor: any) => {
    if (!editor || !editor.children) return;

    try {
      // 提取纯文本
      const text = extractTextFromNodes(editor.children);

      // 触发内容变化回调
      if (callbacksRef.current.onContentChange) {
        callbacksRef.current.onContentChange(text);
      }

      // 保存为 JSON 格式（后续可用于恢复编辑器状态）
      if (callbacksRef.current.onHtmlChange) {
        try {
          // 将 Plate 节点转换为 JSON 格式保存
          callbacksRef.current.onHtmlChange(JSON.stringify(editor.children));
        } catch (error) {
          console.warn('保存编辑器内容失败:', error);
          // 至少保存纯文本
          callbacksRef.current.onHtmlChange(text);
        }
      }
    } catch (error) {
      console.warn('处理编辑器变化失败:', error);
    }
  }, []);

  const editor = usePlateEditor({
    plugins: BasicNodesKit,
    value: initialValue,
  });

  // 监听编辑器值变化
  useEffect(() => {
    if (editor && isInitializedRef.current) {
      handleChange(editor);
    } else if (editor && !isInitializedRef.current) {
      isInitializedRef.current = true;
      handleChange(editor);
    }
  }, [editor?.children]);

  return (
    <div className={styles.editorContainer}>
      <Plate editor={editor}>
        <EditorToolbar className={styles.toolbar} />
        <EditorContent onWordCountChange={setWordCount} />
      </Plate>

      <div className={styles.footer}>
        <span>支持富文本编辑，可插入图片、表格等</span>
        <span>{wordCount} 字</span>
      </div>
    </div>
  );
};

export default PlateNoteEditor;
