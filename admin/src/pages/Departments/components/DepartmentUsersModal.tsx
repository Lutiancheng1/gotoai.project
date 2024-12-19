import React, { useEffect, useState, useMemo } from 'react'
import { Modal, Table, Button, Space, Transfer, message } from 'antd'
import type { TransferDirection } from 'antd/es/transfer'
import { useAppDispatch, useAppSelector } from '@/store'
import { Department } from '@/store/slices/departments.slice'
import { fetchAllUsers, updateUser, User } from '@/store/slices/users.slice'
import type { TransferItem } from 'antd/es/transfer'

interface DepartmentUsersModalProps {
  visible: boolean
  onCancel: () => void
  department: Department | null
  onSuccess?: () => void
}

interface CustomTransferItem extends TransferItem {
  title: string
  user: User
}

const DepartmentUsersModal: React.FC<DepartmentUsersModalProps> = ({ visible, onCancel, department, onSuccess }) => {
  const dispatch = useAppDispatch()
  const users = useAppSelector((state) => state.users.users)
  const loading = useAppSelector((state) => state.users.loading)
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [targetKeys, setTargetKeys] = useState<React.Key[]>([])
  const [sourceFilter, setSourceFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')

  useEffect(() => {
    if (visible && department) {
      dispatch(fetchAllUsers({}))
    }
  }, [visible, department, dispatch])

  useEffect(() => {
    if (department) {
      // 获取当前部门的用户ID列表
      const departmentUserIds = users.filter((user) => user.departments.some((dept) => dept._id === department._id)).map((user) => user._id)
      setTargetKeys(departmentUserIds)
    }
  }, [department, users])

  // 转换用户数据为Transfer需要的格式
  const allDataSource: CustomTransferItem[] = useMemo(
    () =>
      users.map((user) => ({
        key: user._id,
        title: `${user.username} (${user.email})`,
        description: user.role === 'admin' ? '管理员' : '普通用户',
        user: user
      })),
    [users]
  )

  // 根据搜索条件过滤数据
  const filterData = (dataSource: CustomTransferItem[], filter: string) => {
    if (!filter) return dataSource
    const lowercaseFilter = filter.toLowerCase()
    return dataSource.filter((item) => {
      const user = item.user
      return user.username.toLowerCase().includes(lowercaseFilter) || user.email.toLowerCase().includes(lowercaseFilter) || user.role.toLowerCase().includes(lowercaseFilter)
    })
  }

  const handleChange = (nextTargetKeys: React.Key[], direction: TransferDirection, moveKeys: React.Key[]) => {
    if (!department) return

    const updateUsers = async () => {
      try {
        // 找出需要添加和移除的用户
        const currentUserIds = targetKeys
        const usersToAdd = nextTargetKeys.filter((id) => !currentUserIds.includes(id))
        const usersToRemove = currentUserIds.filter((id) => !nextTargetKeys.includes(id))

        // 处理添加用户
        for (const userId of usersToAdd) {
          const user = users.find((u) => u._id === userId)
          if (user) {
            const newDepartments = [...user.departments, { _id: department._id, name: department.name }]
            await dispatch(
              updateUser({
                id: userId.toString(),
                data: { departments: newDepartments }
              })
            ).unwrap()
          }
        }

        // 处理移除用户
        for (const userId of usersToRemove) {
          const user = users.find((u) => u._id === userId)
          if (user) {
            const newDepartments = user.departments.filter((dept) => dept._id !== department._id)
            await dispatch(
              updateUser({
                id: userId.toString(),
                data: { departments: newDepartments }
              })
            ).unwrap()
          }
        }

        setTargetKeys(nextTargetKeys)
        message.success('部门成员更新成功')
        // 更新成功后刷新用户列表
        dispatch(fetchAllUsers({}))
        onSuccess?.()
      } catch (error) {
        message.error('部门成员更新失败')
      }
    }

    updateUsers()
  }

  const handleSearch = (dir: TransferDirection, value: string) => {
    if (dir === 'left') {
      setSourceFilter(value)
    } else {
      setTargetFilter(value)
    }
  }

  // 获取过滤后的数据源
  const filteredDataSource = useMemo(() => {
    const sourceData = allDataSource.filter((item) => !targetKeys.includes(item.key as string))
    const targetData = allDataSource.filter((item) => targetKeys.includes(item.key as string))

    return {
      sourceData: filterData(sourceData, sourceFilter),
      targetData: filterData(targetData, targetFilter)
    }
  }, [allDataSource, targetKeys, sourceFilter, targetFilter])

  return (
    <Modal
      title={`管理部门成员 - ${department?.name || ''}`}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          关闭
        </Button>
      ]}
    >
      <Transfer<CustomTransferItem>
        dataSource={allDataSource}
        showSearch
        listStyle={{
          width: 300,
          height: 500
        }}
        titles={['未加入', '已加入']}
        targetKeys={targetKeys}
        selectedKeys={selectedKeys}
        onChange={handleChange}
        onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
          setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys])
        }}
        onSearch={handleSearch}
        render={(item) => item.title}
        filterOption={(inputValue: string, item: CustomTransferItem) => {
          const dir = targetKeys.includes(item.key as string) ? 'right' : 'left'
          const filter = dir === 'left' ? sourceFilter : targetFilter
          return !filter || item.title.toLowerCase().indexOf(filter.toLowerCase()) !== -1
        }}
      />
    </Modal>
  )
}

export default DepartmentUsersModal
