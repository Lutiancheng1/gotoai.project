import React, { useState } from 'react'
import { Layout, Menu, Button, theme, Dropdown, Popconfirm, Avatar } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined, DashboardOutlined, TeamOutlined, SettingOutlined, ApartmentOutlined, AppstoreOutlined, LinkOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/slices/auth.slice'
import type { RootState } from '@/store'
import { MenuItemType } from 'antd/es/menu/interface'
import { getIframeParentOrigin, isInIframe } from '@/utils/libs'
import { useMount } from 'ahooks'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state: RootState) => state.auth)
  const notInIframe = !isInIframe()

  const {
    token: { colorBgContainer }
  } = theme.useToken()

  // 基础菜单项
  const baseMenuItems: MenuItemType[] = [
    ...(notInIframe
      ? [
          {
            key: '/',
            icon: <DashboardOutlined />,
            label: '仪表盘'
          }
        ]
      : []),
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
  ]

  // 系统设置子菜单
  const settingsChildren: MenuItemType[] = []

  if (notInIframe) {
    settingsChildren.push(
      {
        key: '/settings/auto-login-generator',
        icon: <LinkOutlined />,
        label: '自动登录'
      },
      {
        key: '/settings/customer-service',
        icon: <CustomerServiceOutlined />,
        label: '客服配置'
      }
    )
  }

  // 如果系统设置有子菜单，则添加系统设置
  const menuItems = [...baseMenuItems]
  if (settingsChildren.length > 0) {
    menuItems.push({
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      children: settingsChildren
    } as MenuItemType)
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate('/admin' + key)
  }

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      navigate('/admin/login', { replace: true })
    }
  }

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/admin/profile')
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
      <Sider trigger={null} collapsible collapsed={collapsed} className="bg-white border-r border-gray-200">
        {/* 只在开发环境显示Logo */}
        {notInIframe && (
          <div className="h-8 m-4 bg-gray-100 flex justify-center items-center">
            <span className="text-gray-800 font-medium">后台管理系统</span>
          </div>
        )}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname.replace('/admin', '')]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0" // 移除右侧边框
        />
      </Sider>
      <Layout>
        {/* 只在开发环境显示Header */}
        {notInIframe && (
          <Header className="bg-white px-4 flex justify-between items-center border-b border-gray-200">
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="flex items-center cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span className="ml-2">{user?.username}</span>
              </div>
            </Dropdown>
          </Header>
        )}
        <Content className={`bg-white overflow-hidden ${notInIframe ? 'm-6 p-6 h-[calc(100vh-112px)]' : 'h-screen'}`}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
