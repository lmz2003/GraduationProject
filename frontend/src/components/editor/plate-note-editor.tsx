'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor, useEditorState } from 'platejs/react';
import { TooltipProvider } from '@/components/ui/tooltip';

import { BasicNodesKit } from '@/components/editor/plugins/basic-nodes-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { LinkKit } from '@/components/editor/plugins/link-kit';
import { MediaKit } from '@/components/editor/plugins/media-kit';
import { CodeBlockKit } from '@/components/editor/plugins/code-block-kit';
import { AutoformatKit } from '@/components/editor/plugins/autoformat-kit';
import { BlockSelectionKit } from '@/components/editor/plugins/block-selection-kit';
import { IndentAlignKit } from '@/components/editor/plugins/indent-align-kit';
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
    const processNode = (node: Node, parentTag?: string): any => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        return text ? { text } : null;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        const children: any[] = [];

        // 对于void元素（自闭合标签），不处理子元素
        const voidElements = ['img', 'br', 'hr', 'video', 'audio', 'iframe'];
        const shouldProcessChildren = !voidElements.includes(tagName);

        if (shouldProcessChildren) {
          for (const child of Array.from(element.childNodes)) {
            const processed = processNode(child, tagName);
            if (processed) {
              if (Array.isArray(processed)) {
                children.push(...processed);
              } else {
                children.push(processed);
              }
            }
          }
        }

        switch (tagName) {
          // 块级元素
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            return { 
              type: tagName, 
              children: children.length ? children : [{ text: '' }] 
            };
          case 'blockquote':
            return { 
              type: 'blockquote', 
              children: children.length ? children : [{ text: '' }] 
            };
          case 'p':
            return { 
              type: 'p', 
              children: children.length ? children : [{ text: '' }] 
            };
          case 'div':
            // div通常转换为段落（如果包含内容）或保留子元素
            return children.length > 0 ? children : null;
          case 'section':
          case 'article':
          case 'main':
            // 这些标签保留其子元素
            return children.length > 0 ? children : null;
          
          // 列表
          case 'ul':
          case 'ol': {
            // 确保只包含li元素
            const listItems = children.filter(child => child?.type === 'li');
            return {
              type: tagName,
              children: listItems.length > 0 ? listItems : [{ type: 'li', children: [{ text: '' }] }]
            };
          }
          case 'li':
            return { 
              type: 'li', 
              children: children.length ? children : [{ text: '' }] 
            };
          case 'dl':
            // 定义列表转换为段落
            return children.length > 0 ? children : null;
          case 'dt':
          case 'dd':
            return { 
              type: 'p', 
              children: children.length ? children : [{ text: '' }] 
            };
          
          // 代码块
          case 'pre': {
            // 预处理文本以保留空格和换行
            const codeText = element.textContent || '';
            const codeLines = codeText.split('\n').map(line => ({
              type: 'code_line',
              children: [{ text: line }]
            }));
            return {
              type: 'code_block',
              lang: element.getAttribute('data-language') || element.getAttribute('class') || '',
              children: codeLines.length > 0 ? codeLines : [{ type: 'code_line', children: [{ text: '' }] }]
            };
          }
          case 'code':
            if (parentTag === 'pre') {
              // 在pre标签内，code返回其文本
              return { type: 'code_line', children: [{ text: element.textContent || '' }] };
            }
            // 否则标记为代码文本
            return children.map((child) => child ? { ...child, code: true } : null).filter((c) => c);
          
          // 内联标记
          case 'strong':
          case 'b':
            return children.map((child) => child ? { ...child, bold: true } : null).filter((c) => c);
          case 'em':
          case 'i':
            return children.map((child) => child ? { ...child, italic: true } : null).filter((c) => c);
          case 'u':
            return children.map((child) => child ? { ...child, underline: true } : null).filter((c) => c);
          case 's':
          case 'strike':
          case 'del':
            return children.map((child) => child ? { ...child, strikethrough: true } : null).filter((c) => c);
          case 'mark':
          case 'highli':
            return children.map((child) => child ? { ...child, highlight: true } : null).filter((c) => c);
          case 'sub':
            return children.map((child) => child ? { ...child, subscript: true } : null).filter((c) => c);
          case 'sup':
            return children.map((child) => child ? { ...child, superscript: true } : null).filter((c) => c);
          case 'kbd':
            return children.map((child) => child ? { ...child, kbd: true } : null).filter((c) => c);
          
          // 媒体元素
          case 'img': {
            const url = element.getAttribute('src') || '';
            return url ? {
              type: 'img',
              url,
              alt: element.getAttribute('alt') || '',
              children: [{ text: '' }],
            } : null;
          }
          case 'video': {
            const url = element.getAttribute('src') || '';
            return url ? {
              type: 'video',
              url,
              children: [{ text: '' }],
            } : null;
          }
          case 'audio': {
            const url = element.getAttribute('src') || '';
            return url ? {
              type: 'audio',
              url,
              children: [{ text: '' }],
            } : null;
          }
          case 'iframe': {
            const url = element.getAttribute('src') || '';
            return url ? {
              type: 'mediaEmbed',
              url,
              children: [{ text: '' }],
            } : null;
          }
          
          // 链接
          case 'a': {
            const url = element.getAttribute('href') || '';
            return {
              type: 'a',
              url,
              children: children.length ? children : [{ text: element.textContent || '' }],
            };
          }
          
          // 忽略的元素
          case 'br':
            return { text: '\n' };
          case 'hr':
            return { type: 'hr', children: [{ text: '' }] };
          case 'style':
          case 'script':
          case 'noscript':
          case 'meta':
          case 'title':
          case 'head':
            return null;
          
          // 其他容器元素，保留子元素
          case 'span':
          case 'small':
          case 'button':
          default:
            return children.length > 0 ? children : null;
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
    plugins: [
      ...BasicNodesKit,
      ...ListKit,
      ...LinkKit,
      ...MediaKit,
      ...CodeBlockKit,
      ...AutoformatKit,
      ...BlockSelectionKit,
      ...IndentAlignKit,
    ],
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
      <TooltipProvider>
        <Plate editor={editor}>
          <EditorToolbar className={styles.toolbar} />
          <EditorContent onWordCountChange={setWordCount} />
        </Plate>
      </TooltipProvider>

      <div className={styles.footer}>
        <span>支持富文本编辑，可插入图片、表格等</span>
        <span>{wordCount} 字</span>
      </div>
    </div>
  );
};

export default PlateNoteEditor;
