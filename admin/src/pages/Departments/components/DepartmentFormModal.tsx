import React, { useEffect } from 'react'
import { Modal, Form, Input, TreeSelect, Button, Select } from 'antd'
import { useAppDispatch, useAppSelector } from '@/store'
import { Department, createDepartment, updateDepartment, fetchDepartments } from '@/store/slices/departments.slice'
import { fetchApplications } from '@/store/slices/applications.slice'

interface DepartmentFormModalProps {
  visible: boolean
  onCancel: () => void
  editingDepartment?: Department | null
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({ visible, onCancel, editingDepartment }) => {
  const [form] = Form.useForm()
  const dispatch = useAppDispatch()
  const departments = useAppSelector((state) => state.departments.departments)
  const applications = useAppSelector((state) => state.applications.applications)
  const loading = useAppSelector((state) => state.applications.loading)

  // 获取部门列表和应用列表
  useEffect(() => {
    if (visible) {
      // 确保在编辑模式下先获取应用列表，再设置表单值
      dispatch(fetchApplications({})).then(() => {
        if (editingDepartment) {
          form.setFieldsValue({
            name: editingDepartment.name,
            description: editingDepartment.description,
            parentId: editingDepartment.parentId || 'root',
            applications: editingDepartment.applications?.map((app) => app._id) || []
          })
        }
      })
    }
  }, [visible, dispatch])

  // 构建部门树形数据
  const buildTreeData = (departments: Department[]): any[] => {
    return departments.map((dept) => ({
      title: dept.name,
      value: dept._id,
      key: dept._id,
      disabled:
        editingDepartment &&
        (dept._id === editingDepartment._id || // 禁止选择自己
          isDescendant(dept._id, editingDepartment._id, departments)), // 禁止选择子部门
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

  // 重置表单
  const resetForm = () => {
    form.resetFields()
    form.setFieldsValue({
      parentId: 'root',
      applications: []
    })
  }

  useEffect(() => {
    if (!visible) {
      resetForm()
    }
  }, [visible])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 处理根节点的情况
      if (values.parentId === 'root') {
        values.parentId = null
      }

      if (editingDepartment) {
        await dispatch(
          updateDepartment({
            id: editingDepartment._id,
            data: values
          })
        ).unwrap()
      } else {
        await dispatch(createDepartment(values)).unwrap()
      }

      dispatch(fetchDepartments())
      onCancel()
      resetForm()
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  // 获取应用类型的标签颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dify':
        return 'blue'
      case 'ragflow':
        return 'green'
      case 'fastgpt':
        return 'purple'
      default:
        return 'default'
    }
  }

  return (
    <Modal
      title={editingDepartment ? '编辑部门' : '新建部门'}
      open={visible}
      onCancel={() => {
        onCancel()
        resetForm()
      }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          确定
        </Button>
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="name"
          label="部门名称"
          rules={[
            { required: true, message: '请输入部门名称' },
            { min: 2, message: '部门名称至少2个字符' },
            { max: 20, message: '部门名称最多20个字符' }
          ]}
        >
          <Input placeholder="请输入部门名称" />
        </Form.Item>

        <Form.Item name="description" label="部门描述" rules={[{ max: 200, message: '部门描述最多200个字符' }]}>
          <Input.TextArea placeholder="请输入部门描述" showCount maxLength={200} rows={4} />
        </Form.Item>

        <Form.Item name="parentId" label="上级部门" initialValue="root" rules={[{ required: true, message: '请选择上级部门' }]}>
          <TreeSelect treeData={treeData} placeholder="请选择上级部门" treeDefaultExpandAll showSearch allowClear={false} treeNodeFilterProp="title" dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} />
        </Form.Item>

        <Form.Item name="applications" label="关联应用" rules={[{ type: 'array' }]}>
          <Select
            mode="multiple"
            placeholder="请选择关联应用"
            loading={loading}
            allowClear
            showSearch
            optionFilterProp="title"
            filterOption={(input, option) => (option?.title?.toLowerCase() ?? '').includes(input.toLowerCase())}
            options={applications.map((app) => ({
              key: app._id,
              value: app._id,
              disabled: !app.isActive,
              label: (
                <div key={app._id} className="flex items-center justify-between">
                  <span className={!app.isActive ? 'text-gray-400' : ''}>{app.name}</span>
                  <div>
                    <span className={`text-${getTypeColor(app.type)}-500 text-sm mr-2`}>({app.type})</span>
                    {!app.isActive && <span className="text-red-500 text-sm">(已禁用)</span>}
                  </div>
                </div>
              ),
              title: `${app.name} (${app.type})`
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// 检查是否是子部门
const isDescendant = (parentId: string, childId: string, departments: Department[]): boolean => {
  const findChildren = (id: string): boolean => {
    const dept = departments.find((d) => d._id === id)
    if (!dept || !dept.children) return false
    return dept.children.some((child) => child._id === childId || findChildren(child._id))
  }
  return findChildren(parentId)
}

export default DepartmentFormModal
