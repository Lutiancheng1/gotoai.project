import React, { useEffect } from 'react'
import { Modal, Form, Input, Select, Switch } from 'antd'
import { useAppDispatch } from '@/store'
import { createApplication, updateApplication, Application } from '@/store/slices/applications.slice'

interface ApplicationFormModalProps {
  visible: boolean
  editingApplication: Application | null
  onOk: () => void
  onCancel: () => void
}

const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({ visible, editingApplication, onOk, onCancel }) => {
  const [form] = Form.useForm()
  const dispatch = useAppDispatch()
  const isEditing = !!editingApplication

  useEffect(() => {
    if (visible && editingApplication) {
      form.setFieldsValue({
        name: editingApplication.name,
        type: editingApplication.type,
        apiKey: editingApplication.apiKey,
        isActive: editingApplication.isActive,
        config: editingApplication.config ? JSON.stringify(editingApplication.config) : undefined
      })
    } else {
      form.resetFields()
    }
  }, [visible, editingApplication])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()

      // 处理 config 字段
      if (values.config) {
        try {
          values.config = JSON.parse(values.config)
        } catch (error) {
          // 如果解析失败，保持原样
        }
      }

      if (isEditing && editingApplication) {
        await dispatch(
          updateApplication({
            id: editingApplication._id,
            data: values
          })
        ).unwrap()
      } else {
        await dispatch(createApplication(values)).unwrap()
      }

      onOk()
    } catch (error) {
      // Form validation error or API error, handled by the slice
    }
  }

  return (
    <Modal title={isEditing ? '编辑应用' : '新建应用'} open={visible} onOk={handleOk} onCancel={onCancel} width={600}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isActive: true
        }}
      >
        <Form.Item name="name" label="应用名称" rules={[{ required: true, message: '请输入应用名称' }]}>
          <Input placeholder="请输入应用名称" />
        </Form.Item>

        <Form.Item name="type" label="应用类型" rules={[{ required: true, message: '请选择应用类型' }]}>
          <Select placeholder="请选择应用类型">
            {/* <Select.Option value="dify">Dify</Select.Option> */}
            <Select.Option value="ragflow">RagFlow</Select.Option>
            {/* <Select.Option value="fastgpt">FastGPT</Select.Option> */}
          </Select>
        </Form.Item>

        <Form.Item name="apiKey" label="API Key" rules={[{ required: true, message: '请输入 API Key' }]}>
          <Input.Password placeholder="请输入 API Key (助理id)" />
        </Form.Item>

        <Form.Item name="config" label="配置信息" help="请输入有效的 JSON 格式配置">
          <Input.TextArea rows={4} defaultValue={'{"token":""}'} placeholder="请输入 JSON 格式的配置信息" />
        </Form.Item>

        <Form.Item name="isActive" label="状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ApplicationFormModal
