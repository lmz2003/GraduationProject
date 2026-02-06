import React, { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-markdown-editor';
import { marked } from 'marked';
import styles from './RichTextEditor.module.scss';

export interface RichTextEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onHtmlChange?: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialContent = '', 
  onContentChange, 
  onHtmlChange 
}) => {
  const [value, setValue] = useState<string>(initialContent);
  const [charCount, setCharCount] = useState<number>(initialContent.length);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // 仅在初始化时设置内容，之后不再根据 initialContent 更新
    if (!isInitializedRef.current && initialContent) {
      setValue(initialContent);
      setCharCount(initialContent.length);
      isInitializedRef.current = true;
    }
  }, []);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    // 计算字符数
    setCharCount(newValue.length);
    
    // 通知父组件内容变化
    if (onContentChange) {
      onContentChange(newValue);
    }
    
    // 生成HTML内容并通知父组件
    if (onHtmlChange) {
      try {
        const html = marked.parse(newValue) as string;
        onHtmlChange(html);
      } catch (error) {
        console.error('生成HTML失败:', error);
        onHtmlChange(newValue);
      }
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorWrapper}>
        <MDEditor
          value={value}
          onChange={handleChange}
          height="100%"
          previewProps={{
            wrapperElement: {
              'data-color-mode': 'light'
            }
          }}
          className={styles.markdownEditor}
        />
      </div>

      <div className={styles.footer}>
        <span>支持Markdown语法，可插入图片、表格等</span>
        <span>{charCount} 字</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
