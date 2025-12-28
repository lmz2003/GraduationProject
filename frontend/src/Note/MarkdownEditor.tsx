import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Editor from '@uiw/react-markdown-editor';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Styled components
const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const EditorSection = styled.div`
  flex: 1;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 768px) {
    max-height: 600px;
  }
`;

const SectionHeader = styled.div`
  padding: 1rem;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  color: #333;
`;

const EditorContent = styled.div`
  height: 500px;
  
  @media (min-width: 768px) {
    height: 550px;
  }
`;

const PreviewContent = styled.div`
  padding: 1rem;
  height: 500px;
  overflow-y: auto;
  
  @media (min-width: 768px) {
    height: 550px;
  }
  
  /* Markdown styling */
  h1 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  h3 {
    font-size: 1.3rem;
    margin-top: 1.2rem;
    margin-bottom: 0.8rem;
    color: #333;
  }
  
  p {
    margin-bottom: 1rem;
    line-height: 1.6;
    color: #555;
  }
  
  ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    line-height: 1.6;
    color: #555;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  code {
    background: #f0f0f0;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
  }
  
  pre {
    background: #f0f0f0;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  
  pre code {
    background: transparent;
    padding: 0;
    border-radius: 0;
  }
  
  blockquote {
    border-left: 4px solid #667eea;
    padding-left: 1rem;
    color: #666;
    margin-bottom: 1rem;
    font-style: italic;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  
  th, td {
    border: 1px solid #e0e0e0;
    padding: 0.8rem;
    text-align: left;
  }
  
  th {
    background: #fafafa;
    font-weight: 600;
  }
  
  a {
    color: #667eea;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// Props interface
export interface MarkdownEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

// MarkdownEditor component
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  initialContent = '',
  onContentChange 
}) => {
  // State for markdown content
  const [markdown, setMarkdown] = useState<string>(initialContent || '');
  
  // Reference for preview area (used for PDF export)
  const previewRef = useRef<HTMLDivElement>(null);

  // Load initial content from localStorage if available
  useEffect(() => {
    if (!initialContent) {
      const saved = localStorage.getItem('markdown-content');
      if (saved) {
        setMarkdown(saved);
      }
    }
  }, [initialContent]);

  // Save content to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('markdown-content', markdown);
    if (onContentChange) {
      onContentChange(markdown);
    }
  }, [markdown, onContentChange]);

  // Handle content change from editor
  const handleChange = (value: string | undefined) => {
    setMarkdown(value || '');
  };

  return (
    <EditorContainer>
      {/* Editor Section */}
      <EditorSection>
        <SectionHeader>编辑区域</SectionHeader>
        <EditorContent>
          <Editor
            value={markdown}
            onChange={handleChange}
            style={{
              border: 'none',
              borderRadius: '0',
              height: '100%'
            }}
          />
        </EditorContent>
      </EditorSection>

      {/* Preview Section */}
      <EditorSection>
        <SectionHeader>预览区域</SectionHeader>
        <PreviewContent ref={previewRef}>
          <ReactMarkdown
            components={{
              code(props) {
                const { className, children } = props;
                const match = /language-(\w+)/.exec(className || '');
                if (match) {
                  return (
                    <SyntaxHighlighter
                      style={vs2015}
                      language={match[1]}
                      customStyle={{
                        margin: '1em 0',
                        borderRadius: '4px',
                        padding: '1em'
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                }
                return (
                  <code className={className}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {markdown || '# 开始编辑您的 Markdown 内容'}
          </ReactMarkdown>
        </PreviewContent>
      </EditorSection>
    </EditorContainer>
  );
};

export default MarkdownEditor;