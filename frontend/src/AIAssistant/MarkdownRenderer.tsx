import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Markdown 实时渲染组件
 * 支持：
 * - 标题、段落、列表
 * - 代码块（带语法高亮）
 * - 链接、图片、强调
 * - 表格、引用、分割线
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming = false }) => {
  const memoizedMarkdown = useMemo(() => {
    return content;
  }, [content]);

  return (
    <div className={`markdown-renderer ${isStreaming ? 'streaming' : ''}`}>
      <ReactMarkdown
        components={{
          // 代码块渲染
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';

            if (inline) {
              return (
                <code className="markdown-inline-code" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className="markdown-code-block">
                {language !== 'text' && <span className="language-label">{language}</span>}
                <SyntaxHighlighter language={language} style={atomDark}>
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },

          // 标题渲染
          h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
          h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
          h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
          h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
          h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
          h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,

          // 段落渲染
          p: ({ children }) => <p className="markdown-paragraph">{children}</p>,

          // 列表渲染
          ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
          ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
          li: ({ children }) => <li className="markdown-li">{children}</li>,

          // 引用渲染
          blockquote: ({ children }) => (
            <blockquote className="markdown-blockquote">{children}</blockquote>
          ),

          // 表格渲染
          table: ({ children }) => (
            <div className="markdown-table-wrapper">
              <table className="markdown-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="markdown-thead">{children}</thead>,
          tbody: ({ children }) => <tbody className="markdown-tbody">{children}</tbody>,
          tr: ({ children }) => <tr className="markdown-tr">{children}</tr>,
          th: ({ children }) => <th className="markdown-th">{children}</th>,
          td: ({ children }) => <td className="markdown-td">{children}</td>,

          // 链接和图片渲染
          a: ({ href, children }) => (
            <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="markdown-image" />
          ),

          // 分割线渲染
          hr: () => <hr className="markdown-hr" />,

          // 强调渲染
          strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
          em: ({ children }) => <em className="markdown-em">{children}</em>,

          // 删除线渲染
          del: ({ children }) => <del className="markdown-del">{children}</del>,
        }}
      >
        {memoizedMarkdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
