import React, { useEffect, useRef, useState } from 'react';
import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const renderer = new Renderer();
    renderer.code = (code: { text: string; lang?: string }) => {
      const language = code.lang || 'plaintext';
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
      const highlighted = hljs.highlight(code.text, { language: validLanguage }).value;
      return `<pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>`;
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
    });
  }, []);

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(`${index}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const renderMarkdown = () => {
    if (!content) return '';

    const rawHtml = marked.parse(content) as string;
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
        'input', 'button',
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'title',
        'class', 'id', 'style',
        'type', 'checked', 'disabled',
        'data-*',
      ],
      ALLOW_DATA_ATTR: true,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
    });

    return cleanHtml;
  };

  const addCopyButtons = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const codeBlocks = doc.querySelectorAll('pre code');

    codeBlocks.forEach((codeBlock, index) => {
      const pre = codeBlock.parentElement;
      if (!pre) return;

      const wrapper = doc.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = doc.createElement('div');
      header.className = 'code-block-header';

      const languageSpan = doc.createElement('span');
      languageSpan.className = 'code-language';
      const languageMatch = codeBlock.className.match(/language-(\w+)/);
      languageSpan.textContent = languageMatch ? languageMatch[1] : 'code';

      const copyButton = doc.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.type = 'button';
      copyButton.innerHTML = copiedCode === `${index}` 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 已复制'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> 复制';

      header.appendChild(languageSpan);
      header.appendChild(copyButton);

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
      className="markdown-renderer"
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

export default MarkdownRenderer;
