import React, { useEffect, useState, useRef } from 'react'
import { Spin, message } from 'antd'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { renderAsync } from 'docx-preview'
import * as pdfjsLib from 'pdfjs-dist'
import './styles.css'

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface FilePreviewProps {
  fileUrl: string
  fileName: string
}

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, fileName }) => {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

  // 获取文件扩展名
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true)
        const ext = getFileExtension(fileName)
        const response = await axios.get(fileUrl, {
          responseType: 'arraybuffer'
        })

        const data = response.data

        switch (ext) {
          case 'pdf':
            await handlePdfPreview(data)
            break
          case 'doc':
          case 'docx':
            await handleWordPreview(data)
            break
          case 'xls':
          case 'xlsx':
            await handleExcelPreview(data)
            break
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif':
            setContent(URL.createObjectURL(new Blob([data])))
            break
          case 'txt':
          case 'json':
          case 'md':
            const textContent = new TextDecoder().decode(data)
            setContent(textContent)
            break
          default:
            setContent(fileUrl)
        }
      } catch (error) {
        console.error('Error fetching file:', error)
        message.error('文件加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchFile()

    return () => {
      if (content.startsWith('blob:')) {
        URL.revokeObjectURL(content)
      }
    }
  }, [fileUrl, fileName])

  // 处理 PDF 预览
  const handlePdfPreview = async (data: ArrayBuffer) => {
    if (!containerRef.current) return

    try {
      const pdf = await pdfjsLib.getDocument({ data }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.5 })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise

        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(canvas)
      }
    } catch (error) {
      console.error('Error rendering PDF:', error)
      message.error('PDF 预览失败')
    }
  }

  // 处理 Excel 预览
  const handleExcelPreview = async (data: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const htmlString = XLSX.utils.sheet_to_html(firstSheet)

      if (containerRef.current) {
        containerRef.current.innerHTML = htmlString
      }
    } catch (error) {
      console.error('Error rendering Excel:', error)
      message.error('Excel 预览失败')
    }
  }

  // 处理 Word 预览
  const handleWordPreview = async (data: ArrayBuffer) => {
    if (!containerRef.current) return

    try {
      await renderAsync(data, containerRef.current, containerRef.current, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: true,
        ignoreHeight: true
      })
    } catch (error) {
      console.error('Error rendering Word:', error)
      message.error('Word 文档预览失败')
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Spin tip="加载中..." />
        </div>
      )
    }

    const ext = getFileExtension(fileName)

    // 图片预览
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <img src={content} alt={fileName} className="max-w-full h-auto" />
    }

    // 文本预览
    if (['txt', 'json', 'md'].includes(ext)) {
      return <pre className="whitespace-pre-wrap break-words p-4 bg-gray-50 rounded">{content}</pre>
    }

    // PDF、Word 和 Excel 预览
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
      return <div ref={containerRef} className="preview-container" />
    }

    // 不支持的文件类型
    return (
      <div className="text-center p-4">
        <p>此文件类型暂不支持预览</p>
        <a href={fileUrl} download={fileName} className="text-blue-500 hover:text-blue-700 underline">
          点击下载 {fileName}
        </a>
      </div>
    )
  }

  return (
    <div className="file-preview">
      <div className="file-preview-content">{renderContent()}</div>
    </div>
  )
}

export default FilePreview
