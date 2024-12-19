import React, { useEffect } from 'react'
import { Form, Input, Button, Checkbox, ConfigProvider } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import logo from '@/assets/images/logo.png'
import styles from './index.module.css'
import { login, clearError } from '@/store/slice/authSlice'
import Loading from '@/components/Loading'
import CopyRight from '@/components/CopyRight'
import { SecureStorage, type StoredCredentials } from '@/utils/storage'
import Toast from '@/components/Toast'

type FieldType = {
  username: string
  password: string
  remember: boolean
}

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)
  const siteConfig = window.__SITE_CONFIG__

  // 组件加载时检查是否有存储的凭证
  useEffect(() => {
    const storedCredentials = SecureStorage.getCredentials()
    if (storedCredentials) {
      form.setFieldsValue({
        username: storedCredentials.username,
        password: storedCredentials.password,
        remember: storedCredentials.remember
      })
    }
    return () => {
      dispatch(clearError())
    }
  }, [form, dispatch])

  const onFinish = async (values: FieldType) => {
    try {
      // 处理记住密码
      if (values.remember) {
        SecureStorage.saveCredentials({
          username: values.username,
          password: values.password,
          remember: true
        })
      } else {
        // 如果不记住密码，清除之前存储的凭证
        SecureStorage.clearCredentials()
      }

      const result = await dispatch(login(values)).unwrap()

      if (result?.user) {
        Toast.notify({
          type: 'success',
          message: '登陆成功'
        })
        // 如果location有state，则跳转到from
        if (location.state) {
          const { from } = location.state
          return navigate(from)
        }
        // 否则跳转到首页
        navigate('/')
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log('Form validation failed:', errorInfo)
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Form: {},
          Input: {
            hoverBorderColor: ''
          },
          Button: {}
        }
      }}
    >
      <div className={styles.login}>
        {loading && (
          <div id="mask" className="w-full h-full opacity-30" style={{ position: 'absolute', zIndex: 999, backgroundColor: '#fff' }}>
            <Loading type="app" />
          </div>
        )}
        <div className={`${styles.container} ${styles.containerRightPanelActive}`}>
          <div className={`${styles.containerForm} ${styles.containerSignin}`}>
            <Form form={form} className={styles.form} id="form2" initialValues={{ remember: true }} onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete="off">
              <div className="w-28">
                <img src={logo} className="w-full h-full" alt="Logo" />
              </div>
              <h2 className={`${styles.formTitle} text-lg text-slate-500 mb-0`}>{siteConfig?.loginTitle}</h2>
              <p className="text-slate-500 mb-3">{siteConfig?.version}</p>

              <Form.Item<FieldType> labelAlign="left" name="username" rules={[{ required: true, message: '请输入邮箱!', type: 'email' }]} validateStatus={error ? 'error' : ''}>
                <Input style={{ padding: '10px' }} prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Email" />
              </Form.Item>

              <Form.Item<FieldType> labelAlign="left" name="password" rules={[{ required: true, message: '请输入密码!' }]} style={{ marginBottom: 0 }} validateStatus={error ? 'error' : ''}>
                <Input.Password style={{ padding: '10px' }} prefix={<i className="iconfont icon-mima" />} placeholder="Password" autoComplete="off" />
              </Form.Item>

              <Form.Item<FieldType> name="remember" valuePropName="checked" style={{ margin: '10px 0' }}>
                <Checkbox>记住密码</Checkbox>
              </Form.Item>

              <Form.Item>
                <Button disabled={loading} className={styles.btn} htmlType="submit">
                  Sign In
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className={styles.containerOverlay}>
            <div className={styles.overlay} />
          </div>
        </div>
        <CopyRight />
      </div>
    </ConfigProvider>
  )
}

export default Login
