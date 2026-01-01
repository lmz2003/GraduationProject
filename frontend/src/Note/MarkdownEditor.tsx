import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
`;

const ToolButton = styled.button<{ $primary?: boolean }>`
  border: 1px solid #e2e8f0;
  background: ${props => (props.$primary ? '#4f46e5' : '#ffffff')};
  color: ${props => (props.$primary ? '#ffffff' : '#0f172a')};
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  &:hover {
    background: ${props => (props.$primary ? '#4338ca' : '#f1f5f9')};
    border-color: #cbd5e1;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const EditorArea = styled.textarea`
  width: 100%;
  min-height: 320px;
  padding: 1rem;
  border: none;
  outline: none;
  resize: vertical;
  font-size: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  background: #ffffff;
  color: #0f172a;
  box-sizing: border-box;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem 1rem;
  color: #64748b;
  font-size: 0.85rem;
`;

const Preview = styled.div`
  margin: 0 1rem 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  max-height: 320px;
  overflow-y: auto;

  h1 { font-size: 1.6rem; margin: 0.4rem 0 0.8rem; }
  h2 { font-size: 1.35rem; margin: 0.4rem 0 0.7rem; }
  h3 { font-size: 1.15rem; margin: 0.3rem 0 0.6rem; }
  p { margin: 0 0 0.75rem; line-height: 1.6; color: #334155; }
  ul, ol { margin: 0 0 0.75rem 1.2rem; line-height: 1.6; }
  li { margin-bottom: 0.4rem; }
  code { background: #e2e8f0; padding: 0.15rem 0.35rem; border-radius: 6px; font-size: 0.9rem; }
  pre { background: #0f172a; color: #e2e8f0; padding: 0.75rem; border-radius: 8px; overflow-x: auto; }
  blockquote { border-left: 4px solid #4f46e5; padding-left: 0.75rem; color: #475569; margin: 0.6rem 0; }
`;

const MenuCard = styled.div<{ $open: boolean }>`
  display: ${props => (props.$open ? 'block' : 'none')};
  position: absolute;
  top: 54px;
  left: 0;
  width: 280px;
  max-height: 380px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  z-index: 40;
`;

const MenuHeader = styled.div`
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SearchInput = styled.input`
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  font-size: 0.9rem;
  outline: none;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
  }
`;

const OptionList = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding: 0.35rem 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
  }
`;

const OptionItem = styled.button`
  width: 100%;
  padding: 0.55rem 0.85rem;
  border: none;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;

  &:hover {
    background: #f8fafc;
  }
`;

const OptionIcon = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.95rem;
  color: #0f172a;

  small {
    color: #94a3b8;
    font-size: 0.78rem;
  }
`;

export interface MarkdownEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ initialContent = '', onContentChange }) => {
  const [markdown, setMarkdown] = useState<string>(initialContent || '');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!initialContent) {
      const saved = localStorage.getItem('markdown-content');
      if (saved) {
        setMarkdown(saved);
      }
    }
  }, [initialContent]);

  useEffect(() => {
    localStorage.setItem('markdown-content', markdown);
    if (onContentChange) onContentChange(markdown);
  }, [markdown, onContentChange]);

  const replaceSelection = (formatter: (selected: string, lines: string[]) => string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || '';
    const selectionLines = selected.split('\n');
    const formatted = formatter(selected, selectionLines);
    const newValue = value.slice(0, selectionStart) + formatted + value.slice(selectionEnd);
    setMarkdown(newValue);
    const cursor = selectionStart + formatted.length;
    requestAnimationFrame(() => {
      textarea.setSelectionRange(cursor, cursor);
      textarea.focus();
    });
  };

  const wrap = (prefix: string, suffix?: string) => {
    replaceSelection(selected => `${prefix}${selected}${suffix ?? prefix}`);
  };

  const prefixLines = (symbol: string) => {
    replaceSelection((_, lines) => lines.map(line => `${symbol} ${line.replace(/^\s+/, '')}`.trimEnd()).join('\n'));
  };

  const heading = (level: number) => prefixLines('#'.repeat(level));

  const makeList = (ordered: boolean) => {
    replaceSelection((_, lines) =>
      lines
        .map((line, idx) => ordered ? `${idx + 1}. ${line.replace(/^\d+\.\s*/, '')}` : `- ${line.replace(/^[-*+]\s*/, '')}`)
        .join('\n')
    );
  };

  const makeTodo = () => prefixLines('- [ ]');

  const insertDivider = () => replaceSelection(() => '\n\n---\n\n');

  const insertLink = () => {
    const text = '链接文字';
    const url = 'https://';
    replaceSelection(selected => {
      if (selected) {
        return `[${selected}](${url})`;
      }
      return `[${text}](${url})`;
    });
  };

  const options = [
    { label: '文本', hint: '切换为普通文本', icon: 'T', action: () => {} },
    { label: '一级标题', hint: '标题 1', icon: 'H1', action: () => heading(1) },
    { label: '二级标题', hint: '标题 2', icon: 'H2', action: () => heading(2) },
    { label: '三级标题', hint: '标题 3', icon: 'H3', action: () => heading(3) },
    { label: '有序列表', hint: '1. 列表', icon: '1.', action: () => makeList(true) },
    { label: '无序列表', hint: '• 列表', icon: '•', action: () => makeList(false) },
    { label: '待办清单', hint: 'TODO', icon: '☑', action: makeTodo },
    { label: '代码块', hint: '插入代码', icon: '{}', action: () => wrap('```\n', '\n```') },
    { label: '引用', hint: '引用块', icon: '❝', action: () => prefixLines('>') },
    { label: '分隔线', hint: '---', icon: '—', action: insertDivider },
    { label: '链接', hint: '插入链接', icon: '🔗', action: insertLink },
  ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

  const handleOptionClick = (action: () => void) => {
    action();
    setMenuOpen(false);
    setQuery('');
  };

  return (
    <Shell>
      <Toolbar>
        <ToolButton onClick={() => setMenuOpen(prev => !prev)}>插入 / 格式</ToolButton>
        <ToolButton onClick={() => heading(1)}>H1</ToolButton>
        <ToolButton onClick={() => heading(2)}>H2</ToolButton>
        <ToolButton onClick={() => heading(3)}>H3</ToolButton>
        <ToolButton onClick={() => wrap('**')}>Bold</ToolButton>
        <ToolButton onClick={() => wrap('*')}>Italic</ToolButton>
        <ToolButton onClick={() => prefixLines('>')}>Quote</ToolButton>
        <ToolButton onClick={() => wrap('`')}>Code</ToolButton>
        <ToolButton onClick={() => makeList(false)}>• 列表</ToolButton>
        <ToolButton onClick={() => makeList(true)}>1. 列表</ToolButton>
        <ToolButton onClick={makeTodo}>待办</ToolButton>
        <ToolButton $primary onClick={() => setShowPreview(prev => !prev)}>
          {showPreview ? '隐藏预览' : '显示预览'}
        </ToolButton>

        <MenuCard $open={menuOpen}>
          <MenuHeader>
            <SearchInput
              placeholder="输入关键词"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </MenuHeader>
          <OptionList>
            {options.map(option => (
              <OptionItem key={option.label} onClick={() => handleOptionClick(option.action)}>
                <OptionIcon>{option.icon}</OptionIcon>
                <OptionText>
                  <span>{option.label}</span>
                  <small>{option.hint}</small>
                </OptionText>
              </OptionItem>
            ))}
            {options.length === 0 && (
              <OptionItem disabled>
                <OptionText>
                  <span>未找到匹配项</span>
                </OptionText>
              </OptionItem>
            )}
          </OptionList>
        </MenuCard>
      </Toolbar>

      <EditorArea
        ref={textareaRef}
        value={markdown}
        onChange={e => setMarkdown(e.target.value)}
        placeholder="在这里书写内容，使用上方功能键快速设置标题、列表、引用等"
      />

      {showPreview && (
        <Preview>
          <ReactMarkdown
            components={{
              code(props) {
                const { className, children } = props;
                const match = /language-(\w+)/.exec(className || '');
                if (match) {
                  return (
                    <SyntaxHighlighter style={vs2015} language={match[1]}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                }
                return <code className={className}>{children}</code>;
              }
            }}
          >
            {markdown || '开始书写，或使用功能键快速排版'}
          </ReactMarkdown>
        </Preview>
      )}

      <Footer>
        <span>支持 Markdown 语法，功能键可快速套用格式</span>
        <span>{markdown.length} 字符</span>
      </Footer>
    </Shell>
  );
};

export default MarkdownEditor;