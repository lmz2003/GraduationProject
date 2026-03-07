import { useEffect, useRef, useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './MarkdownRenderer.scss';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

const languageMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  go: 'go',
  rs: 'rust',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  sh: 'bash',
  bash: 'bash',
  shell: 'bash',
  sql: 'sql',
  xml: 'xml',
  php: 'php',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mdInstance: any = null;

const getMarkdownIt = async () => {
  if (mdInstance) return mdInstance;
  
  const MarkdownIt = (await import('markdown-it')).default;
  const md = new MarkdownIt({
    html: false,
    xhtmlOut: false,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string): string => {
      let normalizedLang = lang?.toLowerCase() || '';
      if (languageMap[normalizedLang]) {
        normalizedLang = languageMap[normalizedLang];
      }
      
      const language = normalizedLang && hljs.getLanguage(normalizedLang) 
        ? normalizedLang 
        : 'plaintext';
      
      let highlighted: string;
      try {
        highlighted = hljs.highlight(str, { language }).value;
      } catch {
        try {
          highlighted = hljs.highlightAuto(str).value;
        } catch {
          highlighted = str;
        }
      }
      
      const escapedLang = language.replace(/"/g, '&quot;');
      const escapedCode = btoa(unescape(encodeURIComponent(str)));
      
      return `<div class="md-code-wrapper" data-language="${escapedLang}" data-code="${escapedCode}"><pre class="md-pre"><code class="hljs language-${escapedLang}">${highlighted}</code></pre></div>`;
    },
  });

  md.renderer.rules.heading_open = (tokens: { tag: string }[], idx: number) => {
    const level = tokens[idx].tag;
    return `<${level} class="md-${level}">`;
  };

  md.renderer.rules.paragraph_open = () => '<p class="md-p">';
  
  md.renderer.rules.paragraph_close = () => '</p>\n';

  md.renderer.rules.bullet_list_open = () => '<ul class="md-ul">\n';
  
  md.renderer.rules.ordered_list_open = (tokens: { attrGet: (name: string) => string | null }[], idx: number) => {
    const token = tokens[idx];
    const start = token.attrGet('start');
    const startAttr = start && start !== '1' ? ` start="${start}"` : '';
    return `<ol class="md-ol"${startAttr}>\n`;
  };

  md.renderer.rules.list_item_open = (tokens: { type: string; content: string }[], idx: number) => {
    const nextToken = tokens[idx + 1];
    const isTaskItem = nextToken && 
                       nextToken.type === 'paragraph_open' && 
                       tokens[idx + 2] && 
                       tokens[idx + 2].content &&
                       /^\[([ xX])\]\s/.test(tokens[idx + 2].content);
    
    if (isTaskItem) {
      const match = tokens[idx + 2].content.match(/^\[([ xX])\]\s(.*)$/);
      if (match) {
        const checked = match[1].toLowerCase() === 'x';
        tokens[idx + 2].content = match[2];
        return `<li class="md-li md-task-list-item" data-checked="${checked}">`;
      }
    }
    return '<li class="md-li">';
  };

  md.renderer.rules.blockquote_open = () => '<blockquote class="md-blockquote">\n';

  md.renderer.rules.code_inline = (tokens: { content: string }[], idx: number) => {
    const content = tokens[idx].content;
    return `<code class="md-inline-code">${content}</code>`;
  };

  md.renderer.rules.hr = () => '<hr class="md-hr" />\n';

  md.renderer.rules.table_open = () => '<div class="md-table-wrapper"><table class="md-table">\n';
  
  md.renderer.rules.table_close = () => '</table></div>\n';
  
  md.renderer.rules.thead_open = () => '<thead class="md-thead">\n';
  
  md.renderer.rules.tbody_open = () => '<tbody class="md-tbody">\n';
  
  md.renderer.rules.tr_open = () => '<tr class="md-tr">\n';
  
  md.renderer.rules.th_open = (tokens: { attrGet: (name: string) => string | null }[], idx: number) => {
    const align = tokens[idx].attrGet('style');
    return `<th class="md-td"${align ? ` style="${align}"` : ''}>`;
  };
  
  md.renderer.rules.td_open = (tokens: { attrGet: (name: string) => string | null }[], idx: number) => {
    const align = tokens[idx].attrGet('style');
    return `<td class="md-td"${align ? ` style="${align}"` : ''}>`;
  };

  md.renderer.rules.strong_open = () => '<strong class="md-strong">';
  
  md.renderer.rules.em_open = () => '<em class="md-em">';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  md.renderer.rules.link_open = (tokens: any, idx: number, options: any, _env: any, self: any) => {
    const token = tokens[idx];
    token.attrPush(['class', 'md-link']);
    token.attrPush(['target', '_blank']);
    token.attrPush(['rel', 'noopener noreferrer']);
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.image = (tokens: { attrGet: (name: string) => string | null; content: string }[], idx: number) => {
    const token = tokens[idx];
    const src = token.attrGet('src') || '';
    const alt = token.content || '';
    const title = token.attrGet('title');
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${src}" alt="${alt}"${titleAttr} class="md-image" />`;
  };

  md.renderer.rules.softbreak = () => '<br class="md-br" />\n';
  
  md.renderer.rules.hardbreak = () => '<br class="md-br" />\n';

  mdInstance = md;
  return md;
};

const MarkdownRenderer = ({ content, isStreaming = false }: MarkdownRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedIndices, setCopiedIndices] = useState<Set<number>>(new Set());
  const [md, setMd] = useState<{ render: (content: string) => string } | null>(null);

  useEffect(() => {
    getMarkdownIt().then(setMd);
  }, []);

  const rawHtml = useMemo(() => {
    if (!content || !md) return '';
    try {
      const html = md.render(content);
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'blockquote',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'hr', 'div', 'span',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'src', 'alt', 'title', 
          'class', 'id', 'style', 'data-language', 'data-code', 
          'data-checked', 'start'
        ],
        ALLOW_DATA_ATTR: true,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
      });
    } catch (e) {
      console.error('Markdown parse error:', e);
      return `<p class="md-p">${DOMPurify.sanitize(content)}</p>`;
    }
  }, [content, md]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll('.md-code-header').forEach(el => el.remove());

    const wrappers = container.querySelectorAll<HTMLElement>('.md-code-wrapper');
    wrappers.forEach((wrapper, idx) => {
      const lang = wrapper.dataset.language || 'plaintext';
      const isCopied = copiedIndices.has(idx);

      const header = document.createElement('div');
      header.className = 'md-code-header';

      const langEl = document.createElement('span');
      langEl.className = 'md-code-lang';
      langEl.textContent = lang.toLowerCase();
      header.appendChild(langEl);

      const copyBtn = document.createElement('button');
      copyBtn.className = `md-copy-btn${isCopied ? ' copied' : ''}`;
      copyBtn.type = 'button';
      copyBtn.dataset.index = String(idx);
      copyBtn.innerHTML = isCopied
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>已复制</span>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>复制</span>`;
      
      copyBtn.addEventListener('click', async () => {
        let text = '';
        if (wrapper.dataset.code) {
          try {
            text = decodeURIComponent(escape(atob(wrapper.dataset.code)));
          } catch {
            const code = wrapper.querySelector('code');
            text = code?.textContent || '';
          }
        } else {
          const code = wrapper.querySelector('code');
          text = code?.textContent || '';
        }
        
        try {
          await navigator.clipboard.writeText(text);
          setCopiedIndices(prev => {
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
          setTimeout(() => {
            setCopiedIndices(prev => {
              const next = new Set(prev);
              next.delete(idx);
              return next;
            });
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
        }
      });
      header.appendChild(copyBtn);

      wrapper.insertBefore(header, wrapper.firstChild);
    });

    container.querySelectorAll('a').forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    container.querySelectorAll<HTMLElement>('li[data-checked]').forEach(li => {
      const isChecked = li.dataset.checked === 'true';
      li.classList.add('md-task-list-item');
      li.style.listStyle = 'none';
      li.style.position = 'relative';
      
      const checkbox = document.createElement('span');
      checkbox.className = `md-task-checkbox${isChecked ? ' checked' : ''}`;
      checkbox.innerHTML = isChecked ? '✓' : '';
      checkbox.style.display = 'inline-block';
      checkbox.style.width = '16px';
      checkbox.style.height = '16px';
      checkbox.style.border = '1px solid #9ca3af';
      checkbox.style.borderRadius = '3px';
      checkbox.style.marginRight = '8px';
      checkbox.style.textAlign = 'center';
      checkbox.style.lineHeight = '14px';
      checkbox.style.fontSize = '12px';
      checkbox.style.verticalAlign = 'middle';
      checkbox.style.flexShrink = '0';
      
      if (isChecked) {
        checkbox.style.backgroundColor = '#6366f1';
        checkbox.style.borderColor = '#6366f1';
        checkbox.style.color = '#fff';
      }
      
      li.insertBefore(checkbox, li.firstChild);
    });
  }, [rawHtml, copiedIndices]);

  return (
    <div
      ref={containerRef}
      className={`markdown-renderer${isStreaming ? ' streaming' : ''}`}
      dangerouslySetInnerHTML={{ __html: rawHtml }}
    />
  );
};

export default MarkdownRenderer;
