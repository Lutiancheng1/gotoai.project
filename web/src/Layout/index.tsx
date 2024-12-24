import { ConfigProvider, Menu, MenuProps, Popover, Tooltip, Layout, Modal, FloatButton } from 'antd'
import { Route, Routes, useLocation } from 'react-router-dom'
import Sider from 'antd/es/layout/Sider'
import React, { Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { menuConfig } from '@/utils/constants'
import './index.css'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import GlobalLoading from '@/components/Loading'
import exitIcon from '@/assets/images/exit.svg'
import blogIcon from '@/assets/images/blog.svg'
import reportIcon from '@/assets/images/report.svg'
import userImg from '@/assets/images/user.jpeg'
import { useMount } from 'ahooks'
import { fetchUserInfo, logout } from '@/store/slice/authSlice'
import KnowledgeData from '@/pages/KnowledgeData'
import { MenuItemType } from 'antd/es/menu/hooks/useItems'
import Robot from '@/pages/Robot'

// 导入子路由
const NotFound = React.lazy(() => import('@/pages/NotFound'))
const Loading = React.lazy(() => import('@/pages/Loading'))

type Props = {}
const Index = ({}: Props) => {
  const [categoryCollapsed, setCategoryCollapsed] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false)
  const navagate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const siteConfig = window.__SITE_CONFIG__
  const { user, loading } = useAppSelector((state) => state.auth)
  // 聊天机器人是否折叠展开
  const [isRobotCollapsed, setIsRobotCollapsed] = useState(false)

  // 通过 siteConfig 的disabledMenus 数组 控制隐藏的菜单
  const categoryItems: MenuItemType[] = menuConfig.map((item) => {
    return {
      key: item.key,
      icon: <i className={`iconfont ${item.icon}`}></i>,
      label: item.label,
      disabled: item.disabled
    }
  })

  const menuGo: MenuProps['onClick'] = async ({ key }) => {
    navagate(`/${key}`)
  }
  const logoutHandler = () => {
    setIsLogoutModalVisible(true)
  }
  const handleLogoutConfirm = async () => {
    dispatch(logout())
    navagate('/login', { replace: true })
  }
  useEffect(() => {
    setCurrentPath(location.pathname.substr(1))
  }, [location])

  useMount(() => {
    dispatch(fetchUserInfo())
  })
  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            siderBg: '#fff',
            // headerBg: '#fff',
            triggerBg: '#fff',
            triggerColor: '#606773',
            triggerHeight: 80
          },
          Menu: {
            itemHeight: 60,
            // itemSelectedColor: '#dcddde',
            itemSelectedBg: '#dcddde',
            itemSelectedColor: '#212936',
            iconSize: 32,
            itemPaddingInline: '0px !important'
          },
          Input: {
            activeShadow: ''
          }
        }
      }}
    >
      <div
        className="h-10 flex items-center"
        style={{
          backgroundColor: 'rgba(31, 135, 232, 1)'
        }}
      >
        <img className="ml-10" src={siteConfig?.logo} alt="" style={{ height: 28 }} />
      </div>
      <Layout style={{ height: 'calc(100vh - 40px)' }}>
        <div className="home layout" style={{ height: '100%' }}>
          <Modal title="提示" width={300} open={isLogoutModalVisible} onOk={handleLogoutConfirm} onCancel={() => setIsLogoutModalVisible(false)} centered okText="确认" cancelText="取消" okType="primary" maskClosable>
            确定退出登录吗?
          </Modal>
          <Sider
            trigger={
              <div className="logout">
                <Popover
                  overlayInnerStyle={{ padding: 0, borderRadius: 16 }}
                  className="user-popover"
                  arrow={false}
                  content={
                    <div className="my-popper" role="tooltip" onClick={(e) => e.stopPropagation()}>
                      <div className="panda-tooltip panda-tooltip-isNoBeta">
                        <div className="head">
                          <div className="head-icon">
                            <img alt="" src={userImg} />
                            <div className="updateAvatar">
                              <div className="innerIcon" />
                            </div>
                            <p className="head-icon-logo head-icon-logo-isNoBeta" />
                            <input
                              accept=".jpg,.jpeg,.png,.bmp,.tif,.tiff,.webp,.svg"
                              style={{
                                display: 'none'
                              }}
                              type="file"
                            />
                          </div>
                          <div className="head-info">
                            <div className="head-name">
                              <p className="dot name">
                                用户_{user?.username} {user?.departments && user?.departments?.length > 0 ? `(${user?.departments?.map((item) => item.name).join(',')})` : ''}
                              </p>
                              <div className="icon-box">
                                {/* <div className="edit" /> */}
                                <Tooltip placement="top" title={user?.email}>
                                  <div className="email" />
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="actions">
                          <Tooltip placement="top" title={`发至邮箱：${siteConfig?.feedback}`}>
                            <div className="action flex flex-x-between">
                              <div className="flex flex-x-between flex-y-center" onClick={() => window.open(`mailto:${siteConfig?.feedback}?subject=意见反馈`)}>
                                <img src={reportIcon} alt="反馈" className="action-icon" />
                                <p className="action-text">意见反馈</p>
                              </div>
                            </div>
                          </Tooltip>
                          <div className="action flex flex-x-between" onClick={() => window.open(siteConfig?.aboutUs)}>
                            <div className="flex flex-x-between flex-y-center">
                              <img src={blogIcon} alt="关于" className="action-icon" />
                              <p className="action-text">关于我们</p>
                            </div>
                          </div>

                          <div className="action flex flex-x-between" onClick={() => logoutHandler()}>
                            <div className="flex flex-x-between flex-y-center">
                              <img src={exitIcon} alt="退出" className="action-icon" />
                              <p className="action-text">退出登录</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className="popper__arrow"
                        style={{
                          left: '38px'
                        }}
                        x-arrow=""
                      />
                    </div>
                  }
                >
                  <i onClick={(e) => e.stopPropagation()} style={{ fontSize: categoryCollapsed ? 20 : 30, marginRight: categoryCollapsed ? 10 : 20 }} className="iconfont icon-user cursor-pointer"></i>
                </Popover>
                {!categoryCollapsed ? (
                  <Tooltip placement="right" title={'收起'}>
                    <i className="iconfont icon-zhedie"></i>
                  </Tooltip>
                ) : (
                  <Tooltip placement="right" title={'展开'}>
                    <i style={{ fontSize: 10 }} className="iconfont icon-zhankai"></i>
                  </Tooltip>
                )}
              </div>
            }
            style={{
              overflow: 'auto',
              height: '100%',
              borderInlineEnd: '1px solid rgba(5, 5, 5, 0.06)',
              position: 'relative',
              zIndex: 99
            }}
            width={160}
            collapsible
            collapsed={categoryCollapsed}
            onCollapse={(value) => setCategoryCollapsed(value)}
          >
            <div className="category">
              {/* <div className="logo h-10">
                <img src={siteConfig?.logo || logo} alt="" style={{ height: categoryCollapsed ? 25 : 40 }} />
              </div> */}
              <section className="my-menu">{currentPath && <Menu theme="light" onClick={(e) => menuGo(e)} className="h-full text-sm w-34" mode="inline" defaultSelectedKeys={[currentPath]} items={categoryItems} />}</section>
            </div>
          </Sider>
          {/* 右侧需要变化的区域 */}
          <div className="home-content w-full h-full relative">
            {loading && (
              <div id="mask" className="w-full h-full opacity-30" style={{ position: 'absolute', zIndex: 999, backgroundColor: '#fff' }}>
                <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <GlobalLoading></GlobalLoading>
                </div>
              </div>
            )}
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/knowledgeData" element={<KnowledgeData />} />
                <Route path="/*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
          {/* 客服机器人 */}
          <FloatButton
            type="primary"
            style={{
              bottom: 160,
              width: 50,
              height: 50,
              zIndex: 2
            }}
            icon={<i className="iconfont icon-kefu"></i>}
            tooltip={<span>GotoAI 智能客服</span>}
            onClick={() => {
              setIsRobotCollapsed(!isRobotCollapsed)
            }}
          />
          <Robot
            style={{
              display: isRobotCollapsed ? '' : 'none'
            }}
            onClose={() => setIsRobotCollapsed(false)}
          />
        </div>
      </Layout>
      <div className="absolute bottom-0 h-[10px] w-full z-[999]" style={{ backgroundColor: 'rgba(31, 135, 232, 1)' }}></div>
    </ConfigProvider>
  )
}
export default Index
