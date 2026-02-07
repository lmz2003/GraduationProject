import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - react-quill 类型声明可能不完整
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// @ts-ignore - quill-better-table 类型声明可能不完整
import QuillBetterTable from 'quill-better-table';
import 'quill-better-table/dist/quill-better-table.css';
import styles from './RichTextEditor.module.scss';

// 注册 quill-better-table (在组件挂载后延迟注册)
let isTableModuleRegistered = false;

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
    // 仅在初始化时设置内容
    if (!isInitializedRef.current) {
      setEditorHtml(initialContent);
      isInitializedRef.current = true;
      // 初始化时计算一次字数
      if (initialContent) {
        setTimeout(() => updateWordCount(), 100);
      }
    }
  }, [initialContent]);

  // 在组件挂载时注册 betterTable 模块
  useEffect(() => {
    if (!isTableModuleRegistered && QuillBetterTable) {
      try {
        Quill.register({
          'modules/betterTable': QuillBetterTable
        });
        isTableModuleRegistered = true;
      } catch (error) {
        console.warn('betterTable 模块已注册或注册失败:', error);
      }
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


  const modules = {
    toolbar: [
      // 标题和字体
      [
        { 'header': [1, 2, 3, 4, 5, 6, false] },
        { 'font': [] },
        { 'size': ['small', false, 'large', 'huge'] }
      ],
      // 文字样式
      ['bold', 'italic', 'underline', 'strike'],
      // 文字颜色和背景色
      [{ 'color': [] }, { 'background': [] }],
      // 对齐方式
      [{ 'align': [] }],
      // 列表和缩进
      [
        { 'list': 'ordered' },
        { 'list': 'bullet' },
        { 'indent': '-1' },
        { 'indent': '+1' }
      ],
      // 其他功能
      ['blockquote', 'code-block'],
      ['link', 'image', 'betterTable'],
      // 清除格式
      ['clean']
    ],
    betterTable: {
      operationMenu: {
        items: {
          insertRowUp: {
            text: '上方插入行'
          },
          insertRowDown: {
            text: '下方插入行'
          },
          insertColLeft: {
            text: '左方插入列'
          },
          insertColRight: {
            text: '右方插入列'
          },
          deleteRow: {
            text: '删除行'
          },
          deleteCol: {
            text: '删除列'
          },
          deleteTable: {
            text: '删除表格'
          },
          mergeCells: {
            text: '合并单元格'
          },
          unmergeCells: {
            text: '取消合并'
          }
        }
      }
    },
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorWrapper}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={editorHtml}
          onChange={handleChange}
          modules={modules}
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
