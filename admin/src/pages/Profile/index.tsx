import React, { useState } from 'react'
import { Card, Form, Input, Button, Tabs, message } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import axios from '@/utils/axios'
import { fetchUserInfo } from '@/store/slices/auth.slice'
import { encryptObject, decryptObject } from '@/utils/crypto'
import type { TabsProps } from 'antd'

interface ProfileForm {
  username: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface SavedCredentials {
  email: string
  password: string
  username?: string
  remember?: boolean
}

const CREDENTIALS_KEY = 'encrypted_credentials'

const Profile: React.FC = () => {
  const [profileForm] = Form.useForm<ProfileForm>()
  const [passwordForm] = Form.useForm<PasswordForm>()
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((state: RootState) => state.auth.user)

  // 初始化基本信息表单
  React.useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username
      })
    }
  }, [user, profileForm])

  // 更新基本信息
  const handleUpdateProfile = async (values: ProfileForm) => {
    try {
      setLoading(true)
      await axios.put('/api/auth/profile', values)
      message.success('个人信息更新成功')
      // 重新获取用户信息以更新界面
      dispatch(fetchUserInfo())

      // 如果有保存的登录信息，更新用户名
      const encryptedData = localStorage.getItem(CREDENTIALS_KEY)
      if (encryptedData) {
        const credentials = decryptObject<SavedCredentials>(encryptedData)
        const updatedCredentials = {
          ...credentials,
          username: values.username
        }
        localStorage.setItem(CREDENTIALS_KEY, encryptObject(updatedCredentials))
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 修改密码
  const handleUpdatePassword = async (values: PasswordForm) => {
    try {
      setLoading(true)
      await axios.put('/api/auth/profile', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      message.success('密码修改成功')

      // 如果有保存的登录信息，更新密码
      const encryptedData = localStorage.getItem(CREDENTIALS_KEY)
      if (encryptedData) {
        const credentials = decryptObject<SavedCredentials>(encryptedData)
        const updatedCredentials = {
          ...credentials,
          password: values.newPassword
        }
        localStorage.setItem(CREDENTIALS_KEY, encryptObject(updatedCredentials))
      }

      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  const items: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item label="邮箱">
            <Input value={user?.email} disabled />
            <div className="text-gray-400 text-sm mt-1">邮箱不可修改</div>
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

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'password',
      label: '修改密码',
      children: (
        <Form form={passwordForm} layout="vertical" onFinish={handleUpdatePassword}>
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              修改密码
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <div className="p-6">
      <Card title="个人信息设置" className="max-w-3xl mx-auto">
        <Tabs defaultActiveKey="basic" items={items} />
      </Card>
    </div>
  )
}

export default Profile
