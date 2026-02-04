import React, { useMemo, useState } from 'react';
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
 * 流式加载指示器组件
 * 显示三个省略号的渐隐渐现动画
 */
const StreamingIndicator: React.FC = () => {
  return (
    <span className="streaming-indicator">
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </span>
  );
};

/**
 * Markdown 实时渲染组件 (使用 Marked.js)
 * 支持：
 * - 标题、段落、列表（有序/无序/任务列表）
 * - 代码块（带语法高亮和一键复制）
 * - 链接、图片、强调、删除线
 * - 表格（GFM）、引用、分割线
 * - HTML 内容（带XSS安全防护）
 */
// 全局Marked配置（只执行一次）
let markedConfigured = false;

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming = false }: MarkdownRendererProps) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const codeBlocksRef = React.useRef<Array<{ code: string; language: string }>>([]);

  // 一次性配置 marked 的渲染选项
  if (!markedConfigured) {
    markedConfigured = true;

    // 使用 GFM 扩展并启用表格、任务列表等特性
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // 自定义代码块渲染器 - 用于保存原始代码和语言信息
    const renderer = new marked.Renderer();

    renderer.code = ({ text, lang }) => {
      const language = lang || 'text';
      codeBlocksRef.current.push({ code: text, language });
      const blockIndex = codeBlocksRef.current.length - 1;
      
      // 返回特殊的占位符，便于后续替换为React组件
      return `<div class="markdown-code-block-marker" data-index="${blockIndex}" data-lang="${language}"></div>`;
    };

    // 自定义链接渲染 - 添加外链图标
    renderer.link = ({ href, title, text }) => {
      const hrefStr = typeof href === 'string' ? href : String(href || '');
      const titleStr = typeof title === 'string' ? title : String(title || '');
      const textStr = typeof text === 'string' ? text : String(text || '');
      const isExternal = hrefStr && (hrefStr.startsWith('http://') || hrefStr.startsWith('https://'));
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const icon = isExternal ? ' <span class="markdown-external-icon">↗</span>' : '';
      return `<a href="${hrefStr}" class="markdown-link" title="${titleStr}"${target}>${textStr}${icon}</a>`;
    };

    // 自定义图片渲染
    renderer.image = ({ href, title, text }) => {
      const hrefStr = typeof href === 'string' ? href : String(href || '');
      const titleStr = typeof title === 'string' ? title : String(title || '');
      const textStr = typeof text === 'string' ? text : String(text || '');
      return `<div class="markdown-image-wrapper">
        <img src="${hrefStr}" alt="${textStr}" title="${titleStr}" class="markdown-image" />
        ${textStr ? `<p class="markdown-image-caption">${textStr}</p>` : ''}
      </div>`;
    };

    // 自定义表格渲染 - 添加包装容器
    renderer.table = ({ header, rows }) => {
      const headerStr = typeof header === 'string' ? header : String(header || '');
      const rowsStr = typeof rows === 'string' ? rows : String(rows || '');
      return `<div class="markdown-table-wrapper">
        <table class="markdown-table">
          <thead class="markdown-thead">${headerStr}</thead>
          <tbody class="markdown-tbody">${rowsStr}</tbody>
        </table>
      </div>`;
    };

    // 自定义表格行渲染
    renderer.tablerow = ({ text }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      return `<tr class="markdown-tr">${textStr}</tr>`;
    };

    // 自定义表格单元格渲染
    renderer.tablecell = ({ text, align, flags }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      const tag = flags?.header ? 'th' : 'td';
      const className = flags?.header ? 'markdown-th' : 'markdown-td';
      const alignStr = typeof align === 'string' ? align : 'left';
      return `<${tag} class="${className}" style="text-align: ${alignStr}">${textStr}</${tag}>`;
    };

    // 自定义标题渲染 - 添加对应的CSS类
    renderer.heading = ({ text, depth }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      const depthNum = typeof depth === 'number' ? depth : 1;
      return `<h${depthNum} class="markdown-h${depthNum}">${textStr}</h${depthNum}>`;
    };

    // 自定义段落渲染
    renderer.paragraph = ({ text }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      return `<p class="markdown-paragraph">${textStr}</p>`;
    };

    // 自定义列表项渲染 - 支持任务列表
    renderer.listitem = ({ text, task, checked, depth }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      if (task) {
        const checkboxHTML = `<input type="checkbox" ${checked ? 'checked' : ''} disabled />`;
        return `<li class="markdown-li task-list">${checkboxHTML}${textStr}</li>`;
      }
      return `<li class="markdown-li">${textStr}</li>`;
    };

    // 自定义无序列表
    renderer.list = ({ items, ordered, depth }: any) => {
      const itemsStr = Array.isArray(items) ? items.join('') : String(items || '');
      const tag = ordered ? 'ol' : 'ul';
      const className = ordered ? 'markdown-ol' : 'markdown-ul';
      return `<${tag} class="${className}">${itemsStr}</${tag}>`;
    };

    // 自定义引用渲染
    renderer.blockquote = ({ text }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      return `<blockquote class="markdown-blockquote">${textStr}</blockquote>`;
    };

    // 自定义分割线
    renderer.hr = () => {
      return '<hr class="markdown-hr" />';
    };

    // 自定义强调（粗体）渲染
    renderer.strong = ({ text }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      return `<strong>${textStr}</strong>`;
    };

    // 自定义斜体渲染
    renderer.em = ({ text }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      return `<em>${textStr}</em>`;
    };

    // 自定义删除线渲染
    renderer.del = ({ text }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      return `<del>${textStr}</del>`;
    };

    // 自定义文本渲染
    renderer.text = ({ text }: any) => {
      const textStr = typeof text === 'string' ? text : String(text || '');
      return textStr;
    };

    marked.setOptions({ renderer });
  }

  const handleCopyCode = (code: string, index: number) => {
    copy(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const htmlContent = useMemo(() => {
    // 清空代码块数组，为新的content准备
    codeBlocksRef.current = [];

    // 预处理内容：确保 content 是字符串，处理对象情况
    let processed = content;
    if (typeof processed !== 'string') {
      // 如果 content 是对象或数组，尝试转换为字符串
      try {
        processed = JSON.stringify(processed, null, 2);
      } catch (e) {
        processed = String(processed);
      }
    }
    
    // 基础清理：移除多余的空行但保留段落间距
    processed = processed.replace(/\n{4,}/g, '\n\n');
    
    // 确保代码块前后有空行
    processed = processed.replace(/([^\n])\n```/g, '$1\n\n```');
    processed = processed.replace(/```\n([^\n])/g, '```\n\n$1');
    
    let markdown = processed.trim();
    
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
        'data-code-index', 'data-code', 'colspan', 'rowspan',
      ],
      KEEP_CONTENT: true,
    });

    return cleanHtml;
  }, [content, isStreaming]);

  // 处理HTML中的代码块标记，替换为完整的代码块UI
  const processedContent = useMemo(() => {
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    
    const codeBlocks = codeBlocksRef.current;
    const markers = container.querySelectorAll('.markdown-code-block-marker');
    let blockIndex = 0;

    markers.forEach((marker) => {
      const indexStr = marker.getAttribute('data-index');
      const language = marker.getAttribute('data-lang') || 'text';
      const index = parseInt(indexStr || '0', 10);
      const codeBlock = codeBlocks[index];

      if (codeBlock) {
        const currentBlockIndex = blockIndex++;
        const isCopied = copiedCodeIndex === currentBlockIndex;

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
        // 存储索引到data属性，避免闭包问题
        copyBtn.setAttribute('data-code-index', currentBlockIndex.toString());
        copyBtn.setAttribute('data-code', codeBlock.code);
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
  }, [htmlContent, copiedCodeIndex]);

  const handleCopyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('markdown-copy-btn')) {
      const codeIndex = target.getAttribute('data-code-index');
      const codeContent = target.getAttribute('data-code');
      if (codeIndex !== null && codeContent !== null) {
        handleCopyCode(codeContent, parseInt(codeIndex, 10));
      }
    }
  };

  return (
    <div
      className={`markdown-renderer ${isStreaming ? 'streaming' : ''}`}
      onClick={handleCopyClick}
    >
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      {isStreaming && <StreamingIndicator />}
    </div>
  );
};

export default MarkdownRenderer;
