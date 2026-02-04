import React, { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import copy from 'copy-to-clipboard';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Markdown 实时渲染组件 (使用 Marked.js)
 * 支持：
 * - 标题、段落、列表（有序/无序/任务列表）
 * - 代码块（带语法高亮和一键复制）
 * - 链接、图片、强调、删除线
 * - 表格（GFM）、引用、分割线
 * - HTML 内容（带XSS安全防护）
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming = false }: MarkdownRendererProps) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const codeBlockIndexRef = React.useRef<number>(0);

  // 配置 marked 的渲染选项
  useEffect(() => {
    // 使用 GFM 扩展并启用表格、任务列表等特性
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // 自定义代码块渲染器 - 用于保存原始代码和语言信息
    const renderer = new marked.Renderer();

    // 存储代码块信息用于后续处理
    const codeBlocks: Array<{ code: string; language: string }> = [];

    renderer.code = ({ text, lang }) => {
      const language = lang || 'text';
      codeBlocks.push({ code: text, language });
      const blockIndex = codeBlocks.length - 1;
      
      // 返回特殊的占位符，便于后续替换为React组件
      return `<div class="markdown-code-block-marker" data-index="${blockIndex}" data-lang="${language}"></div>`;
    };

    // 自定义链接渲染 - 添加外链图标
    renderer.link = ({ href, title, text }) => {
      const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const icon = isExternal ? ' <span class="markdown-external-icon">↗</span>' : '';
      return `<a href="${href}" class="markdown-link" title="${title || ''}"${target}>${text}${icon}</a>`;
    };

    // 自定义图片渲染
    renderer.image = ({ href, title, text }) => {
      return `<div class="markdown-image-wrapper">
        <img src="${href}" alt="${text}" title="${title || ''}" class="markdown-image" />
        ${text ? `<p class="markdown-image-caption">${text}</p>` : ''}
      </div>`;
    };

    // 自定义表格渲染 - 添加包装容器
    renderer.table = ({ header, rows }) => {
      return `<div class="markdown-table-wrapper">
        <table class="markdown-table">
          <thead class="markdown-thead">${header}</thead>
          <tbody class="markdown-tbody">${rows}</tbody>
        </table>
      </div>`;
    };

    // 自定义标题渲染 - 添加对应的CSS类
    renderer.heading = ({ text, depth }: any) => {
      return `<h${depth} class="markdown-h${depth}">${text}</h${depth}>`;
    };

    // 自定义段落渲染
    renderer.paragraph = ({ text }) => {
      return `<p class="markdown-paragraph">${text}</p>`;
    };

    // 自定义列表项渲染 - 支持任务列表
    renderer.listitem = ({ text, task, checked }) => {
      if (task) {
        const checkboxHTML = `<input type="checkbox" ${checked ? 'checked' : ''} disabled />`;
        return `<li class="markdown-li task-list">${checkboxHTML}${text}</li>`;
      }
      return `<li class="markdown-li">${text}</li>`;
    };

    // 自定义无序列表
    renderer.list = ({ items, ordered }) => {
      const tag = ordered ? 'ol' : 'ul';
      const className = ordered ? 'markdown-ol' : 'markdown-ul';
      return `<${tag} class="${className}">${items}</${tag}>`;
    };

    // 自定义引用渲染
    renderer.blockquote = ({ text }) => {
      return `<blockquote class="markdown-blockquote">${text}</blockquote>`;
    };

    // 自定义分割线
    renderer.hr = () => {
      return '<hr class="markdown-hr" />';
    };

    marked.setOptions({ renderer });

    // 将代码块信息保存到window对象，便于React组件访问
    (window as any).__markdownCodeBlocks = codeBlocks;
  }, []);

  const handleCopyCode = (code: string, index: number) => {
    copy(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const htmlContent = useMemo(() => {
    // 重置代码块计数器
    codeBlockIndexRef.current = 0;

    let processed = content;
    
    // 基础清理：移除多余的空行但保留段落间距
    processed = processed.replace(/\n{4,}/g, '\n\n');
    
    // 确保代码块前后有空行
    processed = processed.replace(/([^\n])\n(```)/g, '$1\n\n$2');
    processed = processed.replace(/(```)\n([^\n])/g, '$1\n\n$2');
    
    let markdown = processed.trim();
    
    // 添加流式加载省略号
    if (isStreaming) {
      markdown += '\n\n▌';
    }
    
    // 使用 marked 解析 Markdown
    const rawHtml = marked(markdown) as string;

    // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'del', 'u', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'img', 'div', 'span', 'input',
      ],
      ALLOWED_ATTR: [
        'class', 'style', 'href', 'target', 'rel', 'alt', 'title', 'src',
        'type', 'checked', 'disabled', 'data-index', 'data-lang',
      ],
      KEEP_CONTENT: true,
    });

    return cleanHtml;
  }, [content, isStreaming]);

   // 处理HTML中的代码块标记，替换为完整的代码块UI
  const processedContent = (() => {
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    
    const codeBlocks = (window as any).__markdownCodeBlocks || [];
    const markers = container.querySelectorAll('.markdown-code-block-marker');

    markers.forEach((marker) => {
      const indexStr = marker.getAttribute('data-index');
      const language = marker.getAttribute('data-lang') || 'text';
      const index = parseInt(indexStr || '0', 10);
      const codeBlock = codeBlocks[index];

      if (codeBlock) {
        const currentIndex = codeBlockIndexRef.current++;
        const isCopied = copiedCodeIndex === currentIndex;

        // 创建代码块HTML
        const wrapper = document.createElement('div');
        wrapper.className = 'markdown-code-block-wrapper';
        
        const header = document.createElement('div');
        header.className = 'markdown-code-header';
        
        if (language !== 'text') {
          const langLabel = document.createElement('span');
          langLabel.className = 'markdown-language-label';
          langLabel.textContent = language;
          header.appendChild(langLabel);
        }
        
        const copyBtn = document.createElement('button');
        copyBtn.className = `markdown-copy-btn ${isCopied ? 'copied' : ''}`;
        copyBtn.textContent = isCopied ? '✓ 已复制' : '📋 复制';
        copyBtn.title = '复制代码';
        copyBtn.onclick = () => handleCopyCode(codeBlock.code, currentIndex);
        header.appendChild(copyBtn);
        
        wrapper.appendChild(header);
        
        const codeBlockDiv = document.createElement('div');
        codeBlockDiv.className = 'markdown-code-block';
        
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = `language-${language}`;
        code.textContent = codeBlock.code;
        
        // 应用 Prism 语法高亮
        try {
          code.innerHTML = Prism.highlight(codeBlock.code, Prism.languages[language] || Prism.languages.text, language);
        } catch (e) {
          code.textContent = codeBlock.code;
        }
        
        pre.appendChild(code);
        codeBlockDiv.appendChild(pre);
        wrapper.appendChild(codeBlockDiv);
        
        marker.replaceWith(wrapper);
      }
    });

    return container.innerHTML;
  })();

  return (
    <div
      className={`markdown-renderer ${isStreaming ? 'streaming' : ''}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

export default MarkdownRenderer;
