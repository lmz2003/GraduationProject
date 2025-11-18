import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import Editor from '@uiw/react-markdown-editor'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import Login from './components/Login'
import HomePage from './components/HomePage'
import './App.css'

function App() {
  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });
  // 从本地存储加载初始内容
  const [markdown, setMarkdown] = useState<string>(() => {
    const saved = localStorage.getItem('markdown-content')
    if (saved) return saved;
    
    // 使用字符串拼接代替模板字符串中的代码块，避免TypeScript解析错误
    const initialContent = 
      '# 欢迎使用 Markdown 编辑器\n\n' +
      '## 开始编辑吧！\n\n' +
      '### 功能特点\n' +
      '- ✨ 实时预览\n' +
      '- 📋 支持常用 Markdown 语法\n' +
      '- 💾 自动保存到本地存储\n' +
      '- 📱 响应式设计\n\n' +
      '### 语法示例\n\n' +
      '**加粗文本** 和 *斜体文本*\n\n' +
      '[链接示例](https://react.dev)\n\n' +
      '```javascript\n' +
      '// 代码块示例\n' +
      'function greeting() {\n' +
      '  console.log("Hello, Markdown!")\n' +
      '}\n' +
      '```\n\n' +
      '| 表格列1 | 表格列2 |\n' +
      '|--------|--------|\n' +
      '| 单元格1 | 单元格2 |\n' +
      '| 单元格3 | 单元格4 |\n\n' +
      '> 这是一段引用文本\n\n' +
      '- 无序列表项1\n' +
      '- 无序列表项2\n' +
      '- 无序列表项3\n\n' +
      '1. 有序列表项1\n' +
      '2. 有序列表项2\n' +
      '3. 有序列表项3';
    
    return initialContent;
  })

  // PDF导出配置
  const [pdfConfig, setPdfConfig] = useState({
    title: 'Markdown 导出文档',
    pageSize: 'a4', // a4, letter
    orientation: 'portrait' as 'portrait' | 'landscape', // portrait, landscape
    includeHeader: true,
    includeFooter: true,
  })
  
  // PDF导出设置对话框状态
  const [showPdfSettings, setShowPdfSettings] = useState(false)
  
  // 用于PDF导出的预览区域引用
  const previewRef = useRef<HTMLDivElement>(null)

  // 当内容变化时保存到本地存储
  useEffect(() => {
    localStorage.setItem('markdown-content', markdown)
  }, [markdown])

  // 清除内容功能
  const handleClear = () => {
    if (window.confirm('确定要清除所有内容吗？')) {
      setMarkdown('')
    }
  }


  // 导出内容功能
  const handleExport = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `markdown-export-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // PDF导出功能
  const handleExportPdf = async () => {
    try {
      // 检查预览区域是否存在
      if (!previewRef.current) {
        throw new Error('预览区域未找到')
      }

      // 创建PDF文档
      const doc = new jsPDF(pdfConfig.orientation, 'mm', pdfConfig.pageSize)

      // 获取页面尺寸
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // 创建一个临时的div来包含标题和预览内容
      // 这样可以确保标题和内容都能被html2canvas正确捕获（包括中文）
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.top = '-9999px'
      tempContainer.style.left = '-9999px'
      tempContainer.style.width = `${pageWidth * 3.78}px` // 转换mm为px (1mm ≈ 3.78px)
      tempContainer.style.backgroundColor = 'white'
      tempContainer.style.padding = '20px'
      tempContainer.style.boxSizing = 'border-box'
      
      // 如果需要标题，添加标题元素
      if (pdfConfig.includeHeader && pdfConfig.title) {
        const titleElement = document.createElement('h1')
        titleElement.textContent = pdfConfig.title
        titleElement.style.textAlign = 'center'
        titleElement.style.marginBottom = '20px'
        titleElement.style.fontSize = '24px'
        titleElement.style.fontFamily = 'Arial, sans-serif'
        tempContainer.appendChild(titleElement)
      }
      
      // 克隆预览内容到临时容器
      const previewClone = previewRef.current.cloneNode(true) as HTMLDivElement
      previewClone.style.width = '100%'
      tempContainer.appendChild(previewClone)
      
      // 添加页脚信息到临时容器
      if (pdfConfig.includeFooter) {
        const footerElement = document.createElement('div')
        footerElement.textContent = `生成时间: ${new Date().toLocaleString()}`
        footerElement.style.textAlign = 'right'
        footerElement.style.marginTop = '20px'
        footerElement.style.fontSize = '12px'
        footerElement.style.color = '#666'
        footerElement.style.fontFamily = 'Arial, sans-serif'
        tempContainer.appendChild(footerElement)
      }
      
      // 将临时容器添加到文档中
      document.body.appendChild(tempContainer)
      
      // 使用html2canvas将完整内容转换为图像
      // 这种方法可以确保所有中文都能正确显示，因为它使用浏览器的渲染能力
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // 提高清晰度
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      // 从文档中移除临时容器
      document.body.removeChild(tempContainer)
      
      // 将canvas转换为图像数据
      const imgData = canvas.toDataURL('image/png')
      
      // 计算图像尺寸以适应页面
      const imgWidth = pageWidth - 20 // 左右边距各10mm
      const imgHeight = canvas.height * imgWidth / canvas.width
      
      // 计算起始Y坐标
      let startY = 10
      
      // 检查是否需要分页
      let heightLeft = imgHeight
      let position = startY
      
      // 添加图像到PDF
      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - position - 10
      
      // 处理多页
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - 20
      }
      
      // 保存PDF
      const fileName = `markdown-pdf-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF导出失败:', error)
      alert(`PDF导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 更新PDF配置
  const updatePdfConfig = (key: string, value: string | boolean) => {
    setPdfConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="app-container">
      {!isLoggedIn ? (
        <HomePage />
      ) : (
        <>        <header className="app-header">
          <h1>Markdown 编辑器</h1>
          <div className="header-actions">
            <button onClick={handleClear} className="btn-clear">
              清除内容
            </button>
            <button onClick={handleExport} className="btn-export">
              导出 MD
            </button>
            <button onClick={() => setShowPdfSettings(true)} className="btn-pdf">
              PDF 导出设置
            </button>
            <button onClick={() => {
              localStorage.removeItem('token');
              setIsLoggedIn(false);
            }} className="btn-logout">
              退出登录
            </button>
          </div>
        </header>
        
        <main className="editor-container">
          <div className="editor-layout">
            {/* 编辑区域 */}
            <div className="editor-section">
              <div className="section-header">
                <h2>编辑区域</h2>
              </div>
              <Editor
                value={markdown}
                onChange={(value) => setMarkdown(value || '')}
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
              />
            </div>
            
            {/* 预览区域 */}
            <div className="preview-section">
              <div className="section-header">
                <h2>预览区域</h2>
              </div>
              <div className="markdown-preview" ref={previewRef}>
                <ReactMarkdown
                    components={{
                      code(props) {
                        const { className, children } = props
                        const match = /language-(\w+)/.exec(className || '')
                        if (match) {
                          return (
                            <SyntaxHighlighter
                              style={vs2015}
                              language={match[1]}
                              customStyle={{
                                margin: '1em 0',
                                borderRadius: '4px'
                              }}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          )
                        }
                        return (
                          <code className={className}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {markdown || '# 开始编辑您的 Markdown 内容'}
                  </ReactMarkdown>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="app-footer">
          <p>💡 提示：您的内容会自动保存到浏览器本地存储中</p>
        </footer>        
      </>
      )}

      {/* PDF导出设置对话框 */}
      {showPdfSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>PDF导出设置</h3>
            
            <div className="form-group">
              <label htmlFor="pdf-title">文档标题:</label>
              <input
                id="pdf-title"
                type="text"
                value={pdfConfig.title}
                onChange={(e) => updatePdfConfig('title', e.target.value)}
                placeholder="输入文档标题"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="page-size">页面大小:</label>
              <select
                id="page-size"
                value={pdfConfig.pageSize}
                onChange={(e) => updatePdfConfig('pageSize', e.target.value)}
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="tabloid">Tabloid</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="orientation">页面方向:</label>
              <select
                id="orientation"
                value={pdfConfig.orientation}
                onChange={(e) => updatePdfConfig('orientation', e.target.value)}
              >
                <option value="portrait">纵向</option>
                <option value="landscape">横向</option>
              </select>
            </div>
            
            <div className="form-group checkbox">
              <input
                id="include-header"
                type="checkbox"
                checked={pdfConfig.includeHeader}
                onChange={(e) => updatePdfConfig('includeHeader', e.target.checked)}
              />
              <label htmlFor="include-header">包含页眉</label>
            </div>
            
            <div className="form-group checkbox">
              <input
                id="include-footer"
                type="checkbox"
                checked={pdfConfig.includeFooter}
                onChange={(e) => updatePdfConfig('includeFooter', e.target.checked)}
              />
              <label htmlFor="include-footer">包含页脚（页码和时间）</label>
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowPdfSettings(false)} className="btn-cancel">
                取消
              </button>
              <button onClick={handleExportPdf} className="btn-confirm">
                导出 PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
