import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import copy from 'copy-to-clipboard';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Markdown 实时渲染组件 (增强版)
 * 支持：
 * - 标题、段落、列表（有序/无序）
 * - 代码块（带语法高亮和一键复制）
 * - 链接、图片、强调、删除线
 * - 表格（GFM）、任务列表、引用、分割线
 * - HTML 内容（带安全转义）
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming = false }: MarkdownRendererProps) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const codeBlockIndexRef = React.useRef<number>(0);

  // 重置代码块计数器
  codeBlockIndexRef.current = 0;

  const memoizedMarkdown = useMemo(() => {
    let processed = content;
    
    // 基础清理：移除多余的空行但保留段落间距
    processed = processed.replace(/\n{4,}/g, '\n\n');
    
    // 确保代码块前后有空行
    processed = processed.replace(/([^\n])\n(```)/g, '$1\n\n$2');
    processed = processed.replace(/(```)\n([^\n])/g, '$1\n\n$2');
    
    let result = processed.trim();
    
    // 添加流式加载省略号
    if (isStreaming) {
      result += '\n\n▌';
    }
    
    return result;
  }, [content, isStreaming]);

  const handleCopyCode = (code: string, index: number) => {
    copy(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const MarkdownComponent = ReactMarkdown as any;

  return (
    <div className={`markdown-renderer ${isStreaming ? 'streaming' : ''}`}>
      <MarkdownComponent
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize]]}
        components={{
          // 代码块渲染 - 增强版本，支持复制
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';
            const codeContent = String(children).replace(/\n$/, '');

            if (inline) {
              return (
                <code className="markdown-inline-code" {...props}>
                  {children}
                </code>
              );
            }

            const currentIndex = codeBlockIndexRef.current++;
            const isCopied = copiedCodeIndex === currentIndex;

            return (
              <div className="markdown-code-block-wrapper">
                <div className="markdown-code-header">
                  {language !== 'text' && (
                    <span className="markdown-language-label">{language}</span>
                  )}
                  <button
                    className={`markdown-copy-btn ${isCopied ? 'copied' : ''}`}
                    onClick={() => handleCopyCode(codeContent, currentIndex)}
                    title="复制代码"
                  >
                    {isCopied ? '✓ 已复制' : '📋 复制'}
                  </button>
                </div>
                <div className="markdown-code-block">
                  <SyntaxHighlighter
                    language={language}
                    style={atomDark}
                    showLineNumbers={true}
                    wrapLines={true}
                    lineProps={() => ({ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } })}
                  >
                    {codeContent}
                  </SyntaxHighlighter>
                </div>
              </div>
            );
          },

          // 标题渲染
          h1: ({ children }: any) => <h1 className="markdown-h1">{children}</h1>,
          h2: ({ children }: any) => <h2 className="markdown-h2">{children}</h2>,
          h3: ({ children }: any) => <h3 className="markdown-h3">{children}</h3>,
          h4: ({ children }: any) => <h4 className="markdown-h4">{children}</h4>,
          h5: ({ children }: any) => <h5 className="markdown-h5">{children}</h5>,
          h6: ({ children }: any) => <h6 className="markdown-h6">{children}</h6>,

          // 段落渲染
          p: ({ children }: any) => <p className="markdown-paragraph">{children}</p>,

          // 列表渲染 - 支持有序、无序和任务列表
          ul: ({ children }: any) => <ul className="markdown-ul">{children}</ul>,
          ol: ({ children }: any) => <ol className="markdown-ol">{children}</ol>,
          li: ({ children, className }: any) => {
            const isTaskList = className && className.includes('task-list-item');
            return (
              <li className={`markdown-li ${isTaskList ? 'task-list' : ''}`}>
                {children}
              </li>
            );
          },

          // 引用渲染
          blockquote: ({ children }: any) => (
            <blockquote className="markdown-blockquote">{children}</blockquote>
          ),

          // 表格渲染 - GFM 支持
          table: ({ children }: any) => (
            <div className="markdown-table-wrapper">
              <table className="markdown-table">{children}</table>
            </div>
          ),
          thead: ({ children }: any) => <thead className="markdown-thead">{children}</thead>,
          tbody: ({ children }: any) => <tbody className="markdown-tbody">{children}</tbody>,
          tr: ({ children }: any) => <tr className="markdown-tr">{children}</tr>,
          th: ({ children, align }: any) => (
            <th className="markdown-th" style={{ textAlign: align || 'left' }}>
              {children}
            </th>
          ),
          td: ({ children, align }: any) => (
            <td className="markdown-td" style={{ textAlign: align || 'left' }}>
              {children}
            </td>
          ),

          // 链接和图片渲染
          a: ({ href, children }: any) => {
            const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
            return (
              <a
                href={href}
                className="markdown-link"
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {children}
                {isExternal && <span className="markdown-external-icon">↗</span>}
              </a>
            );
          },
          img: ({ src, alt, title }: any) => (
            <div className="markdown-image-wrapper">
              <img src={src} alt={alt} title={title} className="markdown-image" />
              {alt && <p className="markdown-image-caption">{alt}</p>}
            </div>
          ),

          // 分割线渲染
          hr: () => <hr className="markdown-hr" />,

          // 强调渲染
          strong: ({ children }: any) => <strong className="markdown-strong">{children}</strong>,
          em: ({ children }: any) => <em className="markdown-em">{children}</em>,

          // 删除线渲染
          del: ({ children }: any) => <del className="markdown-del">{children}</del>,

          // 预格式化文本
          pre: ({ children }: any) => <pre className="markdown-pre">{children}</pre>,
        }}
      >
        {memoizedMarkdown}
      </MarkdownComponent>
    </div>
  );
};

export default MarkdownRenderer;
