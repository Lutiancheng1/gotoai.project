import React, { useEffect, useState, useRef } from 'react'
import { Table, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import * as XLSX from 'xlsx'
import Loading from '../Loading'
import Toast from '../Toast'
import './index.css'

interface ExcelPreviewProps {
  url: string
  initialPageSize?: number
  className?: string
  style?: React.CSSProperties
  height?: number | string
}

interface SheetData {
  name: string
  data: any[]
  columns: ColumnsType<any>
}

/**
 * ExcelPreview 组件的属性定义
 * @interface ExcelPreviewProps
 * @property {string} url - Excel 文件的 URL 地址
 * @property {number} [initialPageSize=100] - 初始每页显示的行数
 * @property {string} [className] - 额外的 CSS 类名
 * @property {React.CSSProperties} [style] - 内联样式
 * @property {number | string} [height] - 容器高度
 */
const ExcelPreview: React.FC<ExcelPreviewProps> = ({ url, initialPageSize = 20, className = '', style = {}, height = '100%' }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [pageSize, setPageSize] = useState(initialPageSize)
  const containerRef = useRef<HTMLDivElement>(null)

  // 生成表格列配置
  const generateColumns = (data: any[]): ColumnsType<any> => {
    if (data.length === 0) return []

    return Object.keys(data[0]).map((key, index) => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      width: Math.min(300, Math.max(100, Math.max(...data.slice(0, 100).map((row) => String(row[key] || '').length * 8 + 32)))),
      render: (text: any) => {
        if (text === null || text === undefined) return '-'
        if (typeof text === 'boolean') return text ? 'Yes' : 'No'
        if (typeof text === 'object' && text instanceof Date) {
          return text.toLocaleString()
        }
        return String(text)
      }
    }))
  }

  // 处理 Sheet 数据
  const processSheetData = (worksheet: XLSX.WorkSheet, sheetName: string): SheetData => {
    // 将工作表转换为 JSON 数据
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '-' // 设置空单元格的默认值
    })

    // 生成列配置
    const columns = generateColumns(jsonData)

    return {
      name: sheetName,
      data: jsonData,
      columns
    }
  }

  useEffect(() => {
    const loadExcel = async () => {
      try {
        setLoading(true)
        setError(null)

        // 使用 fetch 获取文件
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch Excel file')
        }

        // 获取文件内容
        const arrayBuffer = await response.arrayBuffer()

        // 读取 Excel 文件
        const workbook = XLSX.read(arrayBuffer, {
          type: 'array',
          cellDates: true, // 将日期字符串转换为日期对象
          cellNF: true, // 保留数字格式
          cellStyles: true // 保留单元格样式
        })

        // 处理所有工作表
        const processedSheets = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          return processSheetData(worksheet, sheetName)
        })

        setSheets(processedSheets)
        setActiveSheet(processedSheets[0]?.name || '')
        setLoading(false)
      } catch (error) {
        console.error('Error loading Excel:', error)
        setLoading(false)
        setError('Excel 文件加载失败')
        Toast.notify({ type: 'error', message: 'Excel 文件加载失败' })
      }
    }

    loadExcel()
  }, [url])

  return (
    <div className={`excel-preview-container ${className}`} ref={containerRef} style={{ ...style, height }}>
      {/* 加载状态 */}
      {loading && (
        <div className="loading-mask">
          <Loading />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Excel 数据表格 */}
      {!loading && !error && sheets.length > 0 && (
        <div className="excel-content">
          <Tabs
            activeKey={activeSheet}
            onChange={setActiveSheet}
            type="card"
            size="small"
            items={sheets.map((sheet) => ({
              key: sheet.name,
              label: sheet.name,
              children: (
                <div className="sheet-table">
                  <Table<any>
                    columns={sheet.columns}
                    dataSource={sheet.data}
                    rowKey={(_, i) => `${i}`}
                    pagination={{
                      pageSize: pageSize,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条数据`,
                      size: 'small',
                      position: ['bottomCenter'],
                      onShowSizeChange: (_, size) => setPageSize(size)
                    }}
                    scroll={{
                      x: 'max-content',
                      y: 500 // 使用固定高度
                    }}
                    size="small"
                    bordered
                  />
                </div>
              )
            }))}
          />
        </div>
      )}
    </div>
  )
}

export default ExcelPreview
