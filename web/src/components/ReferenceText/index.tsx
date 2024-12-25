import React, { useRef, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Popover, Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { renderMarkdown } from '@/components/MdRender/markdownRenderer'
import type { Reference } from '@/types/ragflow'
import './styles.css'
import { baseUrl } from '@/services/ragflow'
import { isCsvFile, isDocxFile, isExcelFile, isPdfFile } from '@/utils/is'
import PdfViewer from '@/components/PDFViewer'
import WordPreview from '../WordPreview'
import ExcelPreview from '../ExcelPreview'
import CsvPreview from '../CSVPreview'

interface ReferenceTextProps {
  text: string
  references: Reference[]
}
//需支持的文件格式为DOCX、DOC、EXCEL、PPT、PPTX、IMAGE、PDF、CSV、TXT、MD、JSON、EML、HTML
// 目前 支持的预览类型配置
const PREVIEW_CONFIGS = [
  {
    type: 'pdf',
    check: isPdfFile,
    component: ({ url }: { url: string }) => <PdfViewer url={url} hasTools={true} />
  },
  {
    type: 'docx',
    check: isDocxFile,
    component: ({ url }: { url: string }) => <WordPreview url={url} hasTools={true} />
  },
  {
    type: 'excel',
    check: isExcelFile,
    component: ({ url }: { url: string }) => <ExcelPreview url={url} />
  },
  {
    type: 'csv',
    check: isCsvFile,
    component: ({ url }: { url: string }) => <CsvPreview url={url} />
  }
] as const

const ReferenceText: React.FC<ReferenceTextProps> = ({ text, references }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rootsRef = useRef<Map<string, ReturnType<typeof createRoot>>>(new Map())
  const [open, setOpen] = useState(false)
  const [currentReference, setCurrentReference] = useState<Reference | null>(null)
  // 在markdown渲染之前替换引用标记
  const processText = () => {
    let processedText = text
    references.forEach((_, index) => {
      const marker = `##${index}$$`
      const icon = `<span class="reference-icon" data-index="${index}"></span>`
      processedText = processedText.replace(marker, icon)
    })
    return processedText
  }
  // 创建引用图标
  const createReferenceIcon = (index: number) => {
    const reference = references[index]
    if (!reference) return null

    const content = (
      <div className="flex gap-2 max-w-md">
        {reference.image_id && (
          <>
            {/* 左侧大图预览 */}
            <Popover
              placement="left"
              content={
                <div className="w-96 h-96">
                  <a href={`${baseUrl}/v1/document/image/${reference.image_id}`} target="_blank" rel="noopener noreferrer">
                    <img src={`${baseUrl}/v1/document/image/${reference.image_id}`} alt="Reference Preview" className="w-full h-full object-contain" />
                  </a>
                </div>
              }
              trigger="hover"
            >
              <div className="w-20 h-20 flex-shrink-0">
                <img src={`${baseUrl}/v1/document/image/${reference.image_id}`} alt="Reference" className="w-full h-full object-cover rounded cursor-pointer" />
              </div>
            </Popover>
          </>
        )}
        <div className="flex-1">{reference.content}</div>
      </div>
    )
    const name = (
      <div
        className="text-blue-500 text-center w-full hover:text-blue-700 cursor-pointer"
        onClick={() => {
          setCurrentReference(reference)
          setOpen(true)
        }}
      >
        📄
        {reference.document_name}
      </div>
    )

    return (
      <Popover content={<div style={{ maxHeight: '400px', overflow: 'auto', padding: '4px 0' }}>{content}</div>} title={name} trigger="hover" overlayClassName="reference-popover shadow-lg markdown-body ">
        <ExclamationCircleOutlined
          className="text-blue-500 cursor-pointer mx-1"
          style={{
            transform: 'rotate(180deg)'
          }}
        />
      </Popover>
    )
  }

  // 使用DOM API替换引用图标占位符
  useEffect(() => {
    if (!references || references.length === 0) return

    const container = containerRef.current
    if (!container) return

    // 获取所有引用图标占位符
    const icons = container.getElementsByClassName('reference-icon')
    const currentRoots = new Map<string, ReturnType<typeof createRoot>>()

    // 创建新的roots
    Array.from(icons).forEach((icon) => {
      const index = parseInt(icon.getAttribute('data-index') || '0')
      const iconElement = createReferenceIcon(index)
      if (iconElement) {
        const iconContainer = document.createElement('span')
        iconContainer.className = 'reference-icon-root'
        const id = `icon-${index}-${Date.now()}`
        iconContainer.setAttribute('data-root-id', id)
        icon.parentNode?.replaceChild(iconContainer, icon)

        const root = createRoot(iconContainer)
        currentRoots.set(id, root)
        root.render(iconElement)
      }
    })

    // 清理函数
    return () => {
      // 使用 setTimeout 确保在下一个事件循环中进行清理
      setTimeout(() => {
        // 卸载旧的roots
        rootsRef.current.forEach((root) => {
          try {
            root.unmount()
          } catch (e) {
            console.warn('Error unmounting root:', e)
          }
        })
        rootsRef.current = currentRoots
      }, 0)
    }
  }, [text, references])

  // 渲染内容
  const renderedContent = references && references.length > 0 ? renderMarkdown(processText()) : renderMarkdown(text)

  return (
    <>
      <div ref={containerRef} className="reference-text" dangerouslySetInnerHTML={{ __html: renderedContent }} />

      {open && currentReference && (
        <Modal
          open={open}
          onCancel={() => {
            setOpen(false)
            setCurrentReference(null)
          }}
          width={1000}
          classNames={{
            body: 'preview-container'
          }}
          styles={{
            body: {
              height: '70vh',
              padding: 0,
              overflowY: 'scroll'
            }
          }}
          footer={null}
          title={currentReference?.document_name}
        >
          {PREVIEW_CONFIGS.find((config) => config.check(currentReference.document_name))?.component({
            url: `${baseUrl}/v1/document/get/${currentReference.document_id}`
          }) ?? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-4xl mb-4">🚫</div>
              <div className="text-lg text-gray-600 mb-2">暂不支持预览该类型的文件</div>
              <div className="text-sm text-gray-400">当前支持预览的文件类型：{PREVIEW_CONFIGS.map((config) => config.type.toUpperCase()).join('、')}</div>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

export default ReferenceText
