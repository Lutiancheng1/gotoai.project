import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Popconfirm, Input, Select, Form, TreeSelect, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import type { TablePaginationConfig } from 'antd/es/table'
import { useDispatch, useSelector } from 'react-redux'
import { useMount } from 'ahooks'
import type { RootState, AppDispatch } from '@/store'
import { fetchUsers, deleteUser, User } from '@/store/slices/users.slice'
import { fetchDepartments } from '@/store/slices/departments.slice'
import UserFormModal from './components/UserFormModal'

interface TableParams {
  pagination: TablePaginationConfig
  search?: string
  role?: 'admin' | 'user'
  isActive?: boolean
  departmentId?: string
}

const Users: React.FC = () => {
  const [form] = Form.useForm()
  const dispatch = useDispatch<AppDispatch>()
  const { users, total, loading } = useSelector((state: RootState) => state.users)
  const { departments, loading: departmentsLoading } = useSelector((state: RootState) => state.departments)
  const currentUser = useSelector((state: RootState) => state.auth.user)
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true
    }
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // 获取部门列表
  useMount(() => {
    if (departments && departments.length === 0 && !departmentsLoading) {
      dispatch(fetchDepartments())
    }
  })

  // 构建部门树形数据
  const buildTreeData = (departments: any[]): any[] => {
    return departments.map((dept) => ({
      title: dept.name,
      value: dept._id,
      key: dept._id,
      children: dept.children ? buildTreeData(dept.children) : undefined
    }))
  }

  // 添加根节点
  const treeData = [
    {
      title: '/',
      value: 'root',
      key: 'root',
      children: buildTreeData(departments)
    }
  ]

  // 获取用户列表
  const fetchData = () => {
    const params = {
      page: tableParams.pagination.current || 1,
      limit: tableParams.pagination.pageSize || 10,
      search: tableParams.search,
      role: tableParams.role,
      isActive: tableParams.isActive,
      departmentId: tableParams.departmentId === 'root' ? undefined : tableParams.departmentId
    }
    dispatch(fetchUsers(params))
  }

  useEffect(() => {
    fetchData()
  }, [JSON.stringify(tableParams)])

  // 处理表格变化
  const handleTableChange = (pagination: TablePaginationConfig) => {
    setTableParams((prev) => ({
      ...prev,
      pagination: { ...pagination, total }
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

  // 检查是否可以删除用户
  const canDeleteUser = (user: User) => {
    // 如果当前用户不是管理员，不能删除任何用户
    if (currentUser?.role !== 'admin') {
      return false
    }

    // 不能删除自己
    if (user._id === currentUser?._id) {
      return false
    }

    // 如果要删除的是管理员，检查是否是最后一个管理员
    if (user.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length
      if (adminCount <= 1) {
        return false
      }
    }

    return true
  }

  // 获取删除按钮的提示文本
  const getDeleteButtonTooltip = (user: User) => {
    if (currentUser?.role !== 'admin') {
      return '只有管理员可以删除用户'
    }
    if (user._id === currentUser?._id) {
      return '不能删除当前登录用户'
    }
    if (user.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length
      if (adminCount <= 1) {
        return '系统中必须保留至少一个管理员'
      }
    }
    return '确定要删除这个用户吗？此操作不可恢复'
  }

  // 处理删除用户
  const handleDelete = async (user: User) => {
    if (!canDeleteUser(user)) {
      message.error(getDeleteButtonTooltip(user))
      return
    }

    try {
      await dispatch(deleteUser(user._id)).unwrap()
      message.success('删除用户成功')
      fetchData()
    } catch (error: any) {
      message.error(error.message || '删除用户失败')
    }
  }

  // 处理Modal确认
  const handleModalOk = () => {
    setModalVisible(false)
    setEditingUser(null)
    fetchData()
  }

  // 处理Modal取消
  const handleModalCancel = () => {
    setModalVisible(false)
    setEditingUser(null)
  }

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 150,
      fixed: 'left' as const
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 230
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (role: string) => (role === 'admin' ? '管理员' : '普通用户')
    },
    {
      title: '部门',
      dataIndex: 'departments',
      width: 180,
      render: (departments: { name: string; _id: string }[]) => {
        const departmentNames = departments?.map((dept) => dept.name).join(', ')
        return (
          <div title={departmentNames} style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {departmentNames || '-'}
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (isActive: boolean) => <span className={isActive ? 'text-green-600' : 'text-red-600'}>{isActive ? '启用' : '禁用'}</span>
    },
    {
      title: '后台权限',
      dataIndex: 'canAccessAdmin',
      width: 100,
      render: (canAccess: boolean) => (canAccess ? '是' : '否')
    },
    {
      title: '前台权限',
      dataIndex: 'canAccessWeb',
      width: 100,
      render: (canAccess: boolean) => (canAccess ? '是' : '否')
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
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record)
              setModalVisible(true)
            }}
            // disabled={record._id === currentUser?._id} // 禁止编辑当前用户
          >
            编辑
          </Button>
          <Popconfirm title="确认删除" description={getDeleteButtonTooltip(record)} onConfirm={() => handleDelete(record)} okText="确认" cancelText="取消" disabled={!canDeleteUser(record)}>
            <Button type="link" danger icon={<DeleteOutlined />} disabled={!canDeleteUser(record)}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card
      title="用户管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingUser(null)
            setModalVisible(true)
          }}
        >
          新建用户
        </Button>
      }
    >
      <Form form={form} layout="inline" className="mb-4" onFinish={handleSearch}>
        <Form.Item name="search">
          <Input placeholder="搜索用户名/邮箱" prefix={<SearchOutlined />} allowClear />
        </Form.Item>
        <Form.Item name="departmentId">
          <TreeSelect treeData={treeData} placeholder="选择部门" allowClear treeDefaultExpandAll style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="role">
          <Select placeholder="选择角色" allowClear style={{ width: 120 }}>
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="user">普通用户</Select.Option>
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
        dataSource={users}
        rowKey="_id"
        loading={loading}
        pagination={{
          ...tableParams.pagination,
          total,
          showTotal: (total) => `共 ${total} 条`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1500, y: 'calc(100vh - 300px)' }}
      />
      <UserFormModal visible={modalVisible} editingUser={editingUser} onOk={handleModalOk} onCancel={handleModalCancel} />
    </Card>
  )
}

export default Users
