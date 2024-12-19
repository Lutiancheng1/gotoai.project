import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/assets/styles/iconFont/font_4472296_fmoexnv74v.css'
import '@/assets/styles/iconFont/font_colors.css'
import './index.css'
import 'animate.css'
import App from './App'
import { Provider } from 'react-redux'
import { store } from './store'

// 根据环境变量决定是否启用严格模式
const isDevelopment = import.meta.env.MODE === 'development'

const root = createRoot(document.getElementById('root')!)

// 开发环境关闭严格模式，生产环境开启
root.render(
  <Provider store={store}>
    {isDevelopment ? (
      <App />
    ) : (
      <StrictMode>
        <App />
      </StrictMode>
    )}
  </Provider>
)
