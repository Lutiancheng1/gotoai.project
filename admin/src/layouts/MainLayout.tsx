import React, { useState } from 'react'
import { Layout, Menu, Button, theme, Dropdown, Popconfirm, Avatar } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined, DashboardOutlined, TeamOutlined, SettingOutlined, ApartmentOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/slices/auth.slice'
import type { RootState } from '@/store'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state: RootState) => state.auth)

  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户管理'
    },
    {
      key: '/departments',
      icon: <ApartmentOutlined />,
      label: '部门管理'
    },
    {
      key: '/applications',
      icon: <AppstoreOutlined />,
      label: '应用管理'
    }
    // {
    //   key: '/settings',
    //   icon: <SettingOutlined />,
    //   label: '系统设置'
    // }
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      navigate('/login', { replace: true })
    } catch (error) {
      navigate('/login', { replace: true })
    }
  }

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: (
        <Popconfirm title="确认退出登录" description="您确定要退出登录吗？" onConfirm={handleLogout} okText="确认" cancelText="取消">
          <span>退出登录</span>
        </Popconfirm>
      )
    }
  ]

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="h-8 m-4 bg-white/10 flex justify-center items-center">
          <span className="text-white">后台管理系统</span>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex justify-between items-center">
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div className="flex items-center cursor-pointer">
              <Avatar icon={<UserOutlined />} />
              <span className="ml-2">{user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="m-6 p-6 bg-white">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
