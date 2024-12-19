import React, { useState, useEffect } from 'react'
import { Card, Tree, Button, Space, Tooltip, Popconfirm, Badge, message, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '@/store'
import { Department, fetchDepartments, deleteDepartment } from '@/store/slices/departments.slice'
import DepartmentFormModal from './components/DepartmentFormModal'
import DepartmentUsersModal from './components/DepartmentUsersModal'
import { fetchAllUsers } from '@/store/slices/users.slice'
import { fetchApplications } from '@/store/slices/applications.slice'
import { useMount } from 'ahooks'

const DepartmentsPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const departments = useAppSelector((state) => state.departments.departments)
  const users = useAppSelector((state) => state.users.users)
  const applications = useAppSelector((state) => state.applications.applications)
  const loading = useAppSelector((state) => state.departments.loading)

  const [modalVisible, setModalVisible] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [usersModalVisible, setUsersModalVisible] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  // 获取部门、用户和应用数据
  const fetchData = () => {
    dispatch(fetchDepartments())
    dispatch(fetchAllUsers({}))
    dispatch(fetchApplications({}))
  }

  useMount(() => {
    if (departments && departments.length === 0) {
      dispatch(fetchDepartments())
    }
    if (users && users.length === 0) {
      dispatch(fetchAllUsers({}))
    }
    if (applications && applications.length === 0) {
      dispatch(fetchApplications({}))
    }
  })

  // 获取部门用户数量
  const getDepartmentUserCount = (departmentId: string) => {
    return users.filter((user) => user.departments.some((dept) => dept._id === departmentId)).length
  }

  // 转换部门数据为Tree组件需要的格式
  const convertToTreeData = (departments: Department[]): any[] => {
    return departments.map((dept) => ({
      title: (
        <Space>
          <span>{dept.name}</span>
          <Badge count={getDepartmentUserCount(dept._id)} style={{ backgroundColor: '#52c41a' }} />
          <span className="text-gray-400 text-sm">({dept.description || '无描述'})</span>
          {dept.applications && dept.applications.length > 0 && (
            <span className="ml-2">
              {dept.applications.map((app, index) => (
                <Tag key={index} color={app.type === 'dify' ? 'blue' : app.type === 'ragflow' ? 'green' : app.type === 'fastgpt' ? 'purple' : 'default'}>
                  {app.name}-{app.type}
                </Tag>
              ))}
            </span>
          )}
          <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Space>
              <Tooltip title="管理部门成员">
                <Button
                  type="text"
                  icon={<UserAddOutlined />}
                  onClick={() => {
                    setSelectedDepartment(dept)
                    setUsersModalVisible(true)
                  }}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="编辑">
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(dept)} size="small" />
              </Tooltip>
              <Tooltip title="删除">
                <Popconfirm title="确定要删除此部门吗？" onConfirm={() => handleDelete(dept._id)} okText="确定" cancelText="取消">
                  <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
              </Tooltip>
            </Space>
          </div>
        </Space>
      ),
      key: dept._id,
      children: dept.children ? convertToTreeData(dept.children) : undefined,
      className: 'group hover:bg-gray-50'
    }))
  }

  // 添加根节点
  const treeData = [
    {
      title: '/',
      key: 'root',
      children: convertToTreeData(departments)
    }
  ]

  const handleAdd = () => {
    setEditingDepartment(null)
    setModalVisible(true)
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    // 检查部门是否有用户
    const userCount = getDepartmentUserCount(id)
    if (userCount > 0) {
      message.error('该部门下还有用户，请先移除用户后再删除部门')
      return
    }
    await dispatch(deleteDepartment(id))
    dispatch(fetchDepartments())
  }

  return (
    <Card
      title="部门管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建部门
        </Button>
      }
    >
      <Tree showLine={{ showLeafIcon: false }} defaultExpandAll treeData={treeData} />

      {modalVisible && (
        <DepartmentFormModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingDepartment(null)
          }}
          editingDepartment={editingDepartment}
        />
      )}

      <DepartmentUsersModal
        visible={usersModalVisible}
        onCancel={() => {
          setUsersModalVisible(false)
          setSelectedDepartment(null)
        }}
        department={selectedDepartment}
        onSuccess={fetchData}
      />
    </Card>
  )
}

export default DepartmentsPage
