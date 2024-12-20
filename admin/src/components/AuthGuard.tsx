import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAppDispatch, type RootState } from '@/store'
import { fetchUserInfo } from '@/store/slices/auth.slice'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { token, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // 如果有token但没有用户信息，获取用户信息
    if (token && !user) {
      dispatch(fetchUserInfo())
      return
    }

    // 如果是登录页面，不需要进行验证
    if (location.pathname === '/admin/login') {
      return
    }

    // 如果没有token或用户信息，重定向到登录页面
    if (!token || !user) {
      navigate('/admin/login', {
        replace: true,
        state: { from: location.pathname }
      })
    }
  }, [token, user, location.pathname, navigate, dispatch])

  // 如果是登录页面且已经登录，重定向到首页
  if (location.pathname === '/admin/login' && token && user) {
    navigate('/admin/', { replace: true })
    return null
  }

  // 如果不是登录页面且未登录，返回 null
  if (location.pathname !== '/admin/login' && (!token || !user)) {
    return null
  }

  return <>{children}</>
}

export default AuthGuard
