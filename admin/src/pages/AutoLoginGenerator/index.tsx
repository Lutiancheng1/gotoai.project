import React, { useState } from 'react'
import { Card, Form, Input, Button, message, Typography } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

const { Text } = Typography

interface FormValues {
  email: string
  password: string
}

const AutoLoginGenerator: React.FC = () => {
  const [form] = Form.useForm()
  const [generatedUrl, setGeneratedUrl] = useState<string>('')

  const generateToken = (values: FormValues) => {
    try {
      const { email, password } = values
      // 使用Base64编码
      const token = btoa(`${email}:${password}`)
      // 生成完整的URL
      const url = `${window.location.origin}/admin/auto-login?token=${token}`
      setGeneratedUrl(url)
      message.success('链接生成成功')
    } catch (error) {
      message.error('生成链接失败')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl)
      message.success('链接已复制到剪贴板')
    } catch (error) {
      message.error('复制失败，请手动复制')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full overflow-y-auto pr-4">
        <Card title="自动登录链接生成器" className="mb-4">
          <Form form={form} layout="vertical" onFinish={generateToken} autoComplete="off">
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                生成链接
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {generatedUrl && (
          <Card title="生成的链接" className="mb-4">
            <div className="break-all mb-4">
              <Text>{generatedUrl}</Text>
            </div>
            <Button type="primary" icon={<CopyOutlined />} onClick={copyToClipboard}>
              复制链接
            </Button>
          </Card>
        )}

        <Card title="使用说明" className="mb-4">
          <div className="space-y-2">
            <p>1. 输入需要自动登录的账号邮箱和密码</p>
            <p>2. 点击"生成链接"按钮生成自动登录链接</p>
            <p>3. 复制生成的链接</p>
            <p>4. 访问该链接即可自动登录到管理后台</p>
            <p className="text-red-500">注意：请勿将链接分享给不信任的人，链接包含了登录凭据</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AutoLoginGenerator
