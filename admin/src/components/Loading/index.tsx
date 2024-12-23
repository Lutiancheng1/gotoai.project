import React from 'react'
import { Spin } from 'antd'

interface LoadingProps {
  tip?: string
}

const Loading: React.FC<LoadingProps> = ({ tip = '加载中...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin tip={tip} size="large" />
    </div>
  )
}

export default Loading
