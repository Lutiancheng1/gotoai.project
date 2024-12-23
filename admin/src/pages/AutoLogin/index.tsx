import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@/store'
import { login } from '@/store/slices/auth.slice'
import Loading from '@/components/Loading'

const AutoLogin: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const autoLogin = async () => {
      try {
        const token = searchParams.get('token')

        if (!token) {
          return
        }

        // 解码 Base64
        const decodedToken = atob(token)
        const [email, password] = decodedToken.split(':')

        if (!email || !password) {
          return
        }

        // 尝试登录
        await dispatch(login({ email, password })).unwrap()
        navigate('/admin/')
      } catch (error) {
        console.log(error)
      }
    }

    autoLogin()
  }, [dispatch, navigate, searchParams])

  return <Loading />
}

export default AutoLogin
