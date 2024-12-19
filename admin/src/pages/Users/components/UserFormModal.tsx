import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, Switch, message, TreeSelect } from 'antd'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { createUser, updateUser, User } from '@/store/slices/users.slice'
import { useAppSelector } from '@/store'
import { fetchDepartments } from '@/store/slices/departments.slice'

interface UserFormModalProps {
  visible: boolean
  editingUser: User | null
  onOk: () => void
  onCancel: () => void
}

const UserFormModal: React.FC<UserFormModalProps> = ({ visible, editingUser, onOk, onCancel }) => {
  const [form] = Form.useForm()
  const dispatch = useDispatch<AppDispatch>()
  const isEditing = !!editingUser
  const departments = useAppSelector((state) => state.departments.departments)

  // 获取部门列表
  useEffect(() => {
    dispatch(fetchDepartments())
  }, [dispatch])

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

  // 当编辑的用户改变时，设置表单值
  useEffect(() => {
    if (visible) {
      if (editingUser) {
        // 如果用户有部门，获取所有部门的ID
        const departmentIds = editingUser.departments?.map((dept) => dept._id) || ['root']
        form.setFieldsValue({
          ...editingUser,
          departments: departmentIds
        })
      } else {
        form.setFieldsValue({
          isActive: true,
          canAccessAdmin: false,
          canAccessWeb: true,
          role: 'user',
          departments: ['root']
        })
      }
    }
  }, [editingUser, form, visible])

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 处理部门数据
      const departmentIds = values.departments.filter((id: string) => id !== 'root')
      values.departments = departmentIds.map((id: string) => ({ _id: id }))

      if (isEditing && editingUser?._id) {
        // 更新用户
        await dispatch(
          updateUser({
            id: editingUser._id,
            data: values
          })
        ).unwrap()
        onOk()
      } else if (!isEditing) {
        // 创建用户
        await dispatch(createUser(values)).unwrap()
        onOk()
      } else {
        message.error('用户ID无效')
      }
    } catch (error: any) {
      if (error.errorFields) {
        return // 表单验证错误
      }
    }
  }

  // 处理取消
  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal title={isEditing ? '编辑用户' : '新建用户'} open={visible} onOk={handleSubmit} onCancel={handleCancel} width={600} destroyOnClose>
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input disabled={isEditing} placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 2, message: '用户名至少2个字符' },
            { max: 20, message: '用户名最多20个字符' }
          ]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>

        {!isEditing && (
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        )}

        <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
          <Select>
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="user">普通用户</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="部门" name="departments" rules={[{ required: true, message: '请选择部门' }]}>
          <TreeSelect treeData={treeData} placeholder="请选择部门" treeDefaultExpandAll showSearch multiple allowClear={false} treeNodeFilterProp="title" dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} />
        </Form.Item>

        <Form.Item label="状态" name="isActive" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>

        <Form.Item label="后台权限" name="canAccessAdmin" valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>

        <Form.Item label="前台权限" name="canAccessWeb" valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UserFormModal
