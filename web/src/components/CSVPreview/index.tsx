import React, { useEffect, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import Papa from 'papaparse'
import Loading from '../Loading'
import Toast from '../Toast'
import './index.css'

interface CSVPreviewProps {
  url: string
  initialPageSize?: number
  className?: string
  style?: React.CSSProperties
  height?: number | string
}

interface CSVData {
  [key: string]: string | number | boolean | null
}

/**
 * CSVPreview 组件的属性定义
 * @interface CSVPreviewProps
 * @property {string} url - CSV 文件的 URL 地址
 * @property {string} [className] - 额外的 CSS 类名
 * @property {React.CSSProperties} [style] - 内联样式
 * @property {number | string} [height] - 容器高度
 * @property {number} [initialPageSize=100] - 初始每页显示的行数
 */
const CSVPreview: React.FC<CSVPreviewProps> = ({ url, className = '', style = {}, height = '100%', initialPageSize = 20 }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CSVData[]>([])
  const [columns, setColumns] = useState<ColumnsType<CSVData>>([])
  const [pageSize, setPageSize] = useState(initialPageSize)

  // 生成表格列配置
  const generateColumns = (headers: string[]): ColumnsType<CSVData> => {
    return headers.map((header) => ({
      title: header,
      dataIndex: header,
      key: header,
      ellipsis: true,
      width: 150,
      render: (text: any) => {
        if (text === null || text === undefined) return '-'
        if (typeof text === 'boolean') return text ? 'Yes' : 'No'
        return String(text)
      }
    }))
  }

  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch CSV file')
        }

        const text = await response.text()

        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && Array.isArray(results.data) && results.data.length > 0) {
              const firstRow = results.data[0] as Record<string, unknown>
              const headers = Object.keys(firstRow)
              setColumns(generateColumns(headers))
              setData(results.data as CSVData[])
            }
            setLoading(false)
          },
          error: (error: Error) => {
            console.error('Error parsing CSV:', error)
            setError('CSV 文件解析失败')
            setLoading(false)
            Toast.notify({ type: 'error', message: 'CSV 文件解析失败' })
          }
        } as Papa.ParseConfig<CSVData>)
      } catch (error) {
        console.error('Error loading CSV:', error)
        setLoading(false)
        setError('CSV 文件加载失败')
        Toast.notify({ type: 'error', message: 'CSV 文件加载失败' })
      }
    }

    loadCSV()
  }, [url])

  return (
    <div className={`csv-preview-container ${className}`} style={{ ...style, height }}>
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

      {/* CSV 数据表格 */}
      {!loading && !error && data.length > 0 && (
        <div className="csv-content">
          <Table<CSVData>
            columns={columns}
            dataSource={data}
            rowKey={(_, index) => `${index}`}
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
              y: 'calc(100% - 56px)' // 预留分页器空间
            }}
            size="small"
            bordered
          />
        </div>
      )}
    </div>
  )
}

export default CSVPreview
