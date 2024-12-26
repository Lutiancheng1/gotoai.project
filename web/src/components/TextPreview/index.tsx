import React, { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { renderMarkdown } from '@/components/MdRender/markdownRenderer'
import Loading from '../Loading'
import Toast from '../Toast'
import './index.css'
import { isHtmlFile, isJsonFile, isMdFile } from '@/utils/is'

interface TextPreviewProps {
  url: string
  className?: string
  style?: React.CSSProperties
  height?: number | string
  fileType?: string // 可选的文件类型参数
}

type TextHandler = (text: string) => string

// 定义 MIME 类型到处理函数的映射
const MIME_TYPE_HANDLERS: Record<string, TextHandler> = {
  'text/markdown': (text: string) => renderMarkdown(text),
  'text/html': (text: string) => text,
  'application/json': (text: string) => {
    try {
      const jsonObj = JSON.parse(text)
      return JSON.stringify(jsonObj, null, 2)
    } catch (e) {
      return text
    }
  },
  'text/plain': (text: string) => text
} as const

const TextPreview: React.FC<TextPreviewProps> = ({ url, className = '', style = {}, height = '100%', fileType }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [contentType, setContentType] = useState<string>('')

  useEffect(() => {
    const loadText = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch text file')
        }

        const contentType = response.headers.get('Content-Type') || ''
        setContentType(contentType)

        const text = await response.text()

        // 1. 如果提供了 fileType，优先使用 fileType 判断
        if (fileType) {
          if (fileType.toLowerCase().match(/^(md|markdown)$/)) {
            setContent(renderMarkdown(text))
          } else if (fileType.toLowerCase() === 'json') {
            try {
              const jsonObj = JSON.parse(text)
              setContent(JSON.stringify(jsonObj, null, 2))
            } catch (e) {
              setContent(text)
            }
          } else if (fileType.toLowerCase().match(/^(html|htm)$/)) {
            setContent(text)
          } else {
            // 尝试检测内容特征
            detectAndSetContent(text)
          }
        }
        // 2. 否则尝试通过 Content-Type 判断
        else if (contentType) {
          const baseContentType = contentType.split(';')[0].toLowerCase()
          const handler = MIME_TYPE_HANDLERS[baseContentType]
          if (handler) {
            setContent(handler(text))
          } else {
            // 尝试检测内容特征
            detectAndSetContent(text)
          }
        }
        // 3. 如果没有类型信息，尝试通过内容特征判断
        else {
          detectAndSetContent(text)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading text:', error)
        setLoading(false)
        setError('文件加载失败')
        Toast.notify({ type: 'error', message: '文件加载失败' })
      }
    }

    loadText()
  }, [url, fileType])

  // 检测内容特征并设置内容
  const detectAndSetContent = (text: string) => {
    // 尝试解析为 JSON
    try {
      JSON.parse(text)
      setContent(JSON.stringify(JSON.parse(text), null, 2))
      return
    } catch {}

    // 检查是否为 Markdown
    const markdownFeatures = [
      text.includes('##'), // 标题
      text.includes('```'), // 代码块
      text.includes('*'), // 强调
      text.includes('- '), // 列表
      text.includes('> '), // 引用
      text.includes('[') && text.includes('](') // 链接
    ]
    if (markdownFeatures.filter(Boolean).length >= 2) {
      setContent(renderMarkdown(text))
      return
    }

    // 检查是否为 HTML
    if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html') || (text.includes('<') && text.includes('>') && text.includes('</') && text.includes('>'))) {
      setContent(text)
      return
    }

    // 默认作为纯文本处理
    setContent(text)
  }

  const renderContent = () => {
    // 如果是 HTML 内容，使用 iframe 显示
    if (contentType.includes('html') || fileType?.includes('html') || content.includes('<!DOCTYPE html>')) {
      return <iframe srcDoc={content} style={{ width: '100%', height: '100%', border: 'none' }} sandbox="allow-same-origin allow-scripts" title="HTML Preview" />
    }

    // 如果是 Markdown 内容
    if (contentType.includes('markdown') || fileType?.includes('md') || (content.includes('##') && content.includes('```'))) {
      return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: content }} />
    }

    // 其他文本内容
    return (
      <pre className="text-content">
        <code>{content}</code>
      </pre>
    )
  }

  return (
    <div className={`text-preview-container ${className}`} style={{ ...style, height }}>
      {loading && (
        <div className="loading-mask">
          <Loading />
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && content && <div className="text-content-wrapper">{renderContent()}</div>}
    </div>
  )
}

export default TextPreview
