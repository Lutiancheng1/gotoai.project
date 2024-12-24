import React, { useEffect, useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import request from '@/utils/axios'

interface CustomerServiceConfig {
  greeting: string
  apiKey: string
  apiSecret: string
}

const CustomerService: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 加载配置
  const loadConfig = async () => {
    try {
      const res = await request.get('/api/admin/config/customer-service')
      const config = res.data.data.config
      form.setFieldsValue(config)
    } catch (error) {
      console.error('Error:', error)
      message.error('加载配置失败')
    }
  }

  // 保存配置
  const handleSubmit = async (values: CustomerServiceConfig) => {
    try {
      setLoading(true)
      await request.put('/api/admin/config/customer-service', values)
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full overflow-y-auto pr-4">
      <Card title="客服配置">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            greeting: '',
            apiKey: '',
            apiSecret: ''
          }}
        >
          <Form.Item label="开场白" name="greeting" rules={[{ required: true, message: '请输入开场白' }]}>
            <Input.TextArea rows={4} placeholder="请输入开场白" />
          </Form.Item>

          <Form.Item label="API Key" name="apiKey" rules={[{ required: true, message: '请输入 API Key' }]}>
            <Input.Password placeholder="请输入 API Key" />
          </Form.Item>

          <Form.Item label="API Secret" name="apiSecret" rules={[{ required: true, message: '请输入 API Secret' }]}>
            <Input.Password placeholder="请输入 API Secret" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default CustomerService
