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

// 导入axios配置
import '@/utils/axios'

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin/"
              element={
                <AuthGuard>
                  <MainLayout />
                </AuthGuard>
              }
            >
              {/* 在这里添加子路由 */}
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="departments" element={<Departments />} />
              <Route path="applications" element={<Applications />} />
              <Route path="settings" element={<div>Settings</div>} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin/" replace />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  )
}

export default App
