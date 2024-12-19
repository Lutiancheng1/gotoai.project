import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// 根据环境变量决定是否启用严格模式
const isDevelopment = import.meta.env.MODE === 'development'

const root = createRoot(document.getElementById('root')!)

// 开发环境关闭严格模式，生产环境开启
root.render(
  isDevelopment ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  )
)
