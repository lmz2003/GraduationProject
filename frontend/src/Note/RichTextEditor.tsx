import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.root.innerHTML = initialContent;
      updateWordCount();
    }
  }, [initialContent]);

  const updateWordCount = () => {
    const text = quillRef.current?.getText() || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
  };

  const handleChange = (html: string) => {
    setEditorHtml(html);
    updateWordCount();
    if (onContentChange) {
      const text = quillRef.current?.getText() || '';
      onContentChange(text);
    }
    if (onHtmlChange) {
      onHtmlChange(html);
    }
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
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const { url } = await response.json();
            const range = quillRef.current?.getSelection();
            if (range) {
              quillRef.current?.insertEmbed(range.index, 'image', url);
            }
          } else {
            alert('图片上传失败');
          }
        } catch (error) {
          console.error('图片上传失败:', error);
          alert('图片上传失败');
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
          value={editorHtml}
          onChange={handleChange}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] },
              ['bold', 'italic', 'underline', 'strike'],
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
