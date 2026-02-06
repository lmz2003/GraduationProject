import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - react-quill 类型声明可能不完整
import ReactQuill, { Quill } from 'react-quill';
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
  const [showTablePicker, setShowTablePicker] = useState<boolean>(false);
  const tablePickerRef = useRef<HTMLDivElement>(null);
  const tableButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // 仅在初始化时设置内容，之后不再根据 initialContent 更新
    if (!isInitializedRef.current && initialContent) {
      setEditorHtml(initialContent);
      isInitializedRef.current = true;
      // 初始化时计算一次字数
      setTimeout(() => updateWordCount(), 100);
    }
  }, []);

  // 为图片和表格按钮添加自定义处理器
  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    if (editor) {
      const toolbar = editor.getModule('toolbar') as any;
      if (toolbar) {
        toolbar.addHandler('image', handleImageUpload);
        
        // 找到表格按钮并添加点击事件
        const toolbarContainer = editor.container.previousSibling as HTMLElement;
        const tableButton = toolbarContainer?.querySelector('.ql-table') as HTMLButtonElement;
        if (tableButton) {
          tableButtonRef.current = tableButton;
          tableButton.addEventListener('click', handleTableClick);
        }
      }
    }

    return () => {
      if (tableButtonRef.current) {
        tableButtonRef.current.removeEventListener('click', handleTableClick);
      }
    };
  }, []);

  // 点击外部关闭表格选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(event.target as Node)) {
        if (tableButtonRef.current && !tableButtonRef.current.contains(event.target as Node)) {
          setShowTablePicker(false);
        }
      }
    };

    if (showTablePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTablePicker]);

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

  const handleTableClick = (e?: Event) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowTablePicker(!showTablePicker);
  };

  const insertTable = (rows: number, cols: number) => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;

    const range = editor.getSelection();
    if (!range) return;

    // 插入表格HTML
    let tableHTML = '<table><tbody>';
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td><br></td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p><br></p>';

    // 使用 clipboard 插入 HTML
    const delta = (editor.clipboard as any).convert(tableHTML);
    editor.updateContents(delta, 'user');
    editor.setSelection((range?.index || 0) + 1, 0);
    
    setShowTablePicker(false);
  };

  // 渲染表格选择器
  const renderTablePicker = () => {
    if (!showTablePicker || !tableButtonRef.current) return null;

    const buttonRect = tableButtonRef.current.getBoundingClientRect();
    const rows = 8;
    const cols = 10;

    return (
      <div 
        ref={tablePickerRef}
        className={styles.tablePicker}
        style={{
          position: 'fixed',
          top: `${buttonRect.bottom + 5}px`,
          left: `${buttonRect.left}px`,
        }}
      >
        <div className={styles.tablePickerTitle}>选择表格大小</div>
        <div className={styles.tableGrid}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className={styles.tableRow}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={styles.tableCell}
                  onMouseEnter={(e) => {
                    const cells = e.currentTarget.parentElement?.parentElement?.querySelectorAll(`.${styles.tableCell}`);
                    cells?.forEach((cell, index) => {
                      const cellRow = Math.floor(index / cols);
                      const cellCol = index % cols;
                      if (cellRow <= rowIndex && cellCol <= colIndex) {
                        cell.classList.add(styles.tableCellHover);
                      } else {
                        cell.classList.remove(styles.tableCellHover);
                      }
                    });
                  }}
                  onClick={() => insertTable(rowIndex + 1, colIndex + 1)}
                />
              ))}
            </div>
          ))}
        </div>
        <div className={styles.tablePickerFooter}>
          点击选择表格行列数
        </div>
      </div>
    );
  };

  const modules = {
    toolbar: {
      container: [
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
        ['link', 'image', 'table'],
        // 撤销/重做和清除格式
        ['clean']
      ],
      handlers: {
        'undo': function(this: any) {
          this.quill.history.undo();
        },
        'redo': function(this: any) {
          this.quill.history.redo();
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
          defaultValue={editorHtml}
          onChange={handleChange}
          modules={modules}
          placeholder="开始编辑内容..."
          className={styles.quillEditor}
        />
        {renderTablePicker()}
      </div>

      <div className={styles.footer}>
        <span>支持富文本编辑，可插入图片、表格等</span>
        <span>{wordCount} 字</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
