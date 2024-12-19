import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Popconfirm, Form, Input, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { TablePaginationConfig } from 'antd/es/table'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchApplications, deleteApplication, Application } from '@/store/slices/applications.slice'
import ApplicationFormModal from './components/ApplicationFormModal'

interface TableParams {
  pagination: TablePaginationConfig
  search?: string
  type?: 'dify' | 'ragflow' | 'fastgpt'
  isActive?: boolean
}

const Applications: React.FC = () => {
  const [form] = Form.useForm()
  const dispatch = useAppDispatch()
  const { applications, pagination, loading } = useAppSelector((state) => state.applications)
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true
    }
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)

  // 获取应用列表
  const fetchData = () => {
    const params = {
      page: tableParams.pagination.current || 1,
      limit: tableParams.pagination.pageSize || 10,
      search: tableParams.search,
      type: tableParams.type,
      isActive: tableParams.isActive
    }
    dispatch(fetchApplications(params))
  }

  useEffect(() => {
    fetchData()
  }, [JSON.stringify(tableParams)])

  // 处理表格变化
  const handleTableChange = (pagination: TablePaginationConfig) => {
    setTableParams((prev) => ({
      ...prev,
      pagination: { ...pagination, total: prev.pagination.total }
    }))
  }

  // 处理搜索
  const handleSearch = () => {
    const values = form.getFieldsValue()
    setTableParams((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, current: 1 },
      ...values
    }))
  }

  // 重置搜索
  const handleReset = () => {
    form.resetFields()
    setTableParams({
      pagination: {
        current: 1,
        pageSize: tableParams.pagination.pageSize,
        showSizeChanger: true,
        showQuickJumper: true
      }
    })
  }

  // 处理删除应用
  const handleDelete = async (id: string) => {
    await dispatch(deleteApplication(id))
    fetchData()
  }

  // 处理Modal确认
  const handleModalOk = () => {
    setModalVisible(false)
    setEditingApplication(null)
    fetchData()
  }

  // 处理Modal取消
  const handleModalCancel = () => {
    setModalVisible(false)
    setEditingApplication(null)
  }

  // 表格列定义
  const columns = [
    {
      title: '应用名称',
      dataIndex: 'name',
      width: 200,
      fixed: 'left' as const
    },
    {
      title: '应用类型',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          dify: 'Dify',
          ragflow: 'RagFlow',
          fastgpt: 'FastGPT'
        }
        return typeMap[type as keyof typeof typeMap] || type
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: (isActive: boolean) => <span className={isActive ? 'text-green-600' : 'text-red-600'}>{isActive ? '启用' : '禁用'}</span>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: Application) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingApplication(record)
              setModalVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除" description="确定要删除这个应用吗？此操作不可恢复。" onConfirm={() => handleDelete(record._id)} okText="确认" cancelText="取消">
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card
      title="应用管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingApplication(null)
            setModalVisible(true)
          }}
        >
          新建应用
        </Button>
      }
    >
      <Form form={form} layout="inline" className="mb-4" onFinish={handleSearch}>
        <Form.Item name="search">
          <Input placeholder="搜索应用名称" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="type">
          <Select placeholder="选择类型" allowClear style={{ width: 120 }}>
            {/* <Select.Option value="dify">Dify</Select.Option> */}
            <Select.Option value="ragflow">RagFlow</Select.Option>
            {/* <Select.Option value="fastgpt">FastGPT</Select.Option> */}
          </Select>
        </Form.Item>
        <Form.Item name="isActive">
          <Select placeholder="选择状态" allowClear style={{ width: 120 }}>
            <Select.Option value={true}>启用</Select.Option>
            <Select.Option value={false}>禁用</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={applications}
        rowKey="_id"
        loading={loading}
        pagination={{
          ...tableParams.pagination,
          total: pagination.total,
          showTotal: (total) => `共 ${total} 条`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200, y: 'calc(100vh - 300px)' }}
      />

      {modalVisible && <ApplicationFormModal visible={modalVisible} editingApplication={editingApplication} onOk={handleModalOk} onCancel={handleModalCancel} />}
    </Card>
  )
}

export default Applications
