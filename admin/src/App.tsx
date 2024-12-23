import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { store } from '@/store'
import Login from '@/pages/Login'
import MainLayout from '@/layouts/MainLayout'
import AuthGuard from '@/components/AuthGuard'
import Profile from '@/pages/Profile'
import Users from '@/pages/Users'
import Departments from '@/pages/Departments'
import Applications from '@/pages/Applications'
import Dashboard from '@/pages/Dashboard'
import AutoLogin from '@/pages/AutoLogin'
import AutoLoginGenerator from '@/pages/AutoLoginGenerator'

// 导入axios配置
import '@/utils/axios'

function App() {
  const isDevelopment = import.meta.env.MODE === 'development'

  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/auto-login" element={<AutoLogin />} />
            <Route
              path="/admin/"
              element={
                <AuthGuard>
                  <MainLayout />
                </AuthGuard>
              }
            >
              {/* 根路径重定向 */}
              <Route index element={isDevelopment ? <Dashboard /> : <Navigate to="/admin/users" replace />} />
              <Route path="users" element={<Users />} />
              <Route path="departments" element={<Departments />} />
              <Route path="applications" element={<Applications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings">
                <Route path="auto-login-generator" element={<AutoLoginGenerator />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/admin/" replace />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  )
}

export default App
