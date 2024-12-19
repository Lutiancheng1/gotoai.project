import React, { useEffect } from 'react'
import { Form, Input, Button, Card, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import { login, clearError } from '@/store/slices/auth.slice'
import { encryptObject, decryptObject } from '@/utils/crypto'
import type { RootState } from '@/store'

interface LoginForm {
  email: string
  password: string
  remember: boolean
}

interface SavedCredentials {
  email: string
  password: string
}

const CREDENTIALS_KEY = 'encrypted_credentials'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isLoading } = useAppSelector((state: RootState) => state.auth)
  const [form] = Form.useForm()

  // 组件加载时从本地存储获取保存的登录信息
  useEffect(() => {
    try {
      const encryptedData = localStorage.getItem(CREDENTIALS_KEY)
      if (encryptedData) {
        const credentials = decryptObject<SavedCredentials>(encryptedData)
        form.setFieldsValue({
          email: credentials.email,
          password: credentials.password,
          remember: true
        })
      }
    } catch (error) {
      // 如果解密失败，清除存储的数据
      localStorage.removeItem(CREDENTIALS_KEY)
      console.error('Failed to decrypt credentials:', error)
    }
  }, [form])

  const onFinish = async (values: LoginForm) => {
    const { email, password, remember } = values

    try {
      // 如果选择记住密码，加密保存到本地存储
      if (remember) {
        const encryptedData = encryptObject({ email, password })
        localStorage.setItem(CREDENTIALS_KEY, encryptedData)
      } else {
        localStorage.removeItem(CREDENTIALS_KEY)
      }

      await dispatch(login({ email, password }))

      // 登录成功后，导航到之前尝试访问的页面或首页
      const from = (location.state as any)?.from || '/'
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">管理后台登录</h2>
        </div>
        <Form name="login" form={form} onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住密码</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={isLoading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
