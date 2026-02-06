import React, { useEffect, useRef, useState } from 'react';
import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './MarkdownRenderer.scss';

/**
 * MarkdownRenderer 组件
 * 用于渲染AI助手消息中的Markdown内容
 * 支持语法高亮、代码块优化、行号显示和响应式设计
 */
interface MarkdownRendererProps {
  /** Markdown内容 */
  content: string;
  /** 是否为流式加载状态 */
  isStreaming?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming = false }) => {
  /** 容器引用，用于操作DOM元素 */
  const containerRef = useRef<HTMLDivElement>(null);
  /** 复制状态，用于显示复制成功提示 */
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  /** 加载状态，用于显示加载动画 */
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const renderer = new Renderer();
    renderer.code = ({ text, lang }: { text: string; lang?: string; escaped?: boolean }) => {
      const language = lang || 'plaintext';
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
      const highlighted = hljs.highlight(text, { language: validLanguage }).value;
      return `<pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>`;
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
    });
  }, []);

  /**
   * 处理代码复制功能
   * @param code 要复制的代码内容
   * @param index 代码块索引，用于更新复制状态
   */
  const handleCopyCode = async (code: string, index: number) => {
    try {
      // 复制代码到剪贴板
      await navigator.clipboard.writeText(code);
      // 更新复制状态，显示复制成功提示
      setCopiedCode(`${index}`);
      // 2秒后重置复制状态
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  /**
   * 加载状态管理
   * 当流式加载时显示加载动画
   */
  useEffect(() => {
    if (isStreaming && content) {
      setIsLoading(true);
      // 300ms后自动隐藏加载状态，确保内容渲染完成
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [content, isStreaming]);

  /**
   * 渲染Markdown内容
   * 将Markdown文本转换为HTML，并进行安全过滤
   * @returns 安全的HTML字符串
   */
  const renderMarkdown = () => {
    if (!content) return '';

    try {
      // 使用marked库解析Markdown为HTML
      const rawHtml = marked.parse(content) as string;
      
      // 使用DOMPurify过滤HTML，防止XSS攻击
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'blockquote',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'hr',
          'div', 'span',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'src', 'alt', 'title',
          'class', 'id', 'style',
          'data-*',
        ],
        ALLOW_DATA_ATTR: true,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
      });
      
      return cleanHtml;
    } catch (error) {
      // 处理Markdown解析错误，返回纯文本
      console.error('Markdown parsing error:', error);
      return `<p>${DOMPurify.sanitize(content)}</p>`;
    }
  };

  /**
   * 为代码块添加复制按钮和行号显示
   * @param html 原始HTML字符串
   * @returns 增强后的HTML字符串
   */
  const addCopyButtons = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const codeBlocks = doc.querySelectorAll('pre code');

    // 遍历所有代码块，为每个代码块添加复制按钮和行号
    codeBlocks.forEach((codeBlock, index) => {
      const pre = codeBlock.parentElement;
      if (!pre) return;

      // 创建代码块包装器
      const wrapper = doc.createElement('div');
      wrapper.className = 'code-block-wrapper';

      // 创建代码块头部（包含语言标签和复制按钮）
      const header = doc.createElement('div');
      header.className = 'code-block-header';

      // 添加语言标签
      const languageSpan = doc.createElement('span');
      languageSpan.className = 'code-language';
      const languageMatch = codeBlock.className.match(/language-(\w+)/);
      languageSpan.textContent = languageMatch ? languageMatch[1] : 'code';

      // 添加复制按钮
      const copyButton = doc.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.type = 'button';
      copyButton.innerHTML = copiedCode === `${index}` 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 已复制'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> 复制';

      header.appendChild(languageSpan);
      header.appendChild(copyButton);

      // 添加行号显示
      const codeContent = codeBlock.textContent || '';
      const lines = codeContent.split('\n');
      
      const codeWithLines = doc.createElement('div');
      codeWithLines.className = 'code-with-lines';
      
      // 创建行号容器
      const lineNumbers = doc.createElement('div');
      lineNumbers.className = 'line-numbers';
      lines.forEach((_, lineIndex) => {
        const lineNumber = doc.createElement('span');
        lineNumber.className = 'line-number';
        lineNumber.textContent = (lineIndex + 1).toString();
        lineNumbers.appendChild(lineNumber);
      });
      
      // 创建代码内容容器
      const codeContainer = doc.createElement('div');
      codeContainer.className = 'code-content';
      codeContainer.appendChild(codeBlock);
      
      codeWithLines.appendChild(lineNumbers);
      codeWithLines.appendChild(codeContainer);
      
      pre.innerHTML = '';
      pre.appendChild(codeWithLines);

      // 重新组织DOM结构
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });

    return doc.body.innerHTML;
  };

  const processedHtml = addCopyButtons(renderMarkdown());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const copyButtons = container.querySelectorAll('.copy-button');
    copyButtons.forEach((button, index) => {
      const handleClick = () => {
        const codeBlock = container.querySelectorAll('pre code')[index];
        if (codeBlock) {
          handleCopyCode(codeBlock.textContent || '', index);
        }
      };
      button.addEventListener('click', handleClick);
      return () => {
        button.removeEventListener('click', handleClick);
      };
    });
  }, [processedHtml, copiedCode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const links = container.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }, [processedHtml]);

  return (
    <div 
      ref={containerRef}
      className={`markdown-renderer ${isStreaming ? 'streaming' : ''} ${isLoading ? 'loading' : ''}`}
    >
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      {isStreaming && isLoading && (
        <div className="loading-indicator">
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
