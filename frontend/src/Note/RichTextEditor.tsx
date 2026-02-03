import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - react-quill 类型声明可能不完整
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  const [editorHtml, setEditorHtml] = useState<string>(initialContent);
  const quillRef = useRef<ReactQuill>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // 仅在初始化时设置内容，之后不再根据 initialContent 更新
    if (!isInitializedRef.current && initialContent) {
      setEditorHtml(initialContent);
      isInitializedRef.current = true;
      // 初始化时计算一次字数
      setTimeout(() => updateWordCount(), 100);
    }
  }, []);

  // 为图片按钮添加自定义处理器
  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    if (editor) {
      const toolbar = editor.getModule('toolbar') as any;
      if (toolbar) {
        toolbar.addHandler('image', handleImageUpload);
      }
    }
  }, []);

  const updateWordCount = () => {
    try {
      // 获取 Quill 编辑器实例（ReactQuill 组件的 getEditor 方法）
      const editor = quillRef.current?.getEditor?.();
      const text = editor?.getText?.() || '';
      const words = text.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
      setWordCount(words);
    } catch (error) {
      console.warn('计算字数失败:', error);
    }
  };

  const handleChange = (html: string) => {
    setEditorHtml(html);
    
    // 使用 setTimeout 避免立即调用，以支持中文输入法
    setTimeout(() => {
      updateWordCount();
      if (onContentChange) {
        try {
          const editor = quillRef.current?.getEditor?.();
          const text = editor?.getText?.() || '';
          onContentChange(text);
        } catch (error) {
          console.warn('获取编辑器文本失败:', error);
        }
      }
      if (onHtmlChange) {
        onHtmlChange(html);
      }
    }, 0);
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
          const response = await fetch(`${apiBase}/upload`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            // 兼容后端返回格式：{ code: 0, url: '...' } 或 { url: '...' }
            const imageUrl = result.data?.url || result.url;
            
            if (!imageUrl) {
              alert('图片上传失败：返回的 URL 为空');
              return;
            }

            try {
              const editor = quillRef.current?.getEditor?.();
              const range = editor?.getSelection?.();
              if (range && editor) {
                editor.insertEmbed(range.index, 'image', imageUrl);
              }
            } catch (error) {
              console.error('插入图片失败:', error);
              alert('插入图片失败');
            }
          } else {
            const error = await response.json();
            alert(`图片上传失败: ${error.message || '未知错误'}`);
          }
        } catch (error) {
          console.error('图片上传失败:', error);
          alert(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    };
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorWrapper}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          defaultValue={editorHtml}
          onChange={handleChange}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }, 'bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              ['clean']
            ],
            clipboard: {
              matchVisual: false,
            },
          }}
          placeholder="开始编辑内容..."
          className={styles.quillEditor}
        />
      </div>

      <div className={styles.footer}>
        <span>支持富文本编辑，可插入图片、表格等</span>
        <span>{wordCount} 字</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
