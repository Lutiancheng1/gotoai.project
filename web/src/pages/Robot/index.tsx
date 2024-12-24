import React, { useEffect, useRef, useState } from 'react'
import { Tooltip } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useSendMessageWithSseWithRobot } from '@/services/hooks'
import './index.css'
import '@/assets/styles/dialog.css'
import '@/assets/styles/search.css'
import robotAvatar from '@/assets/images/robot.svg'
import defaultAvatar from '@/assets/images/default-avatar.jpg'
import sendIcon from '@/assets/images/send.svg'
import logo from '@/assets/images/logo.png'
import { useAppSelector } from '@/store/hooks'
import { handleCopyClick } from '@/components/MdRender/markdownRenderer'
import { Message, Reference } from '@/types/ragflow'
import ReferenceText from '@/components/ReferenceText'
import { UUID } from '@/utils/libs'
import { createSessionWithFetch } from '@/services/ragflow'
import request from '@/utils/axios'
import { useMount } from 'ahooks'
import Toast from '@/components/Toast'
interface Props {
  right?: number
  bottom?: number
  placeholder?: string
  style?: React.CSSProperties
  onClose?: () => void
  apiKey?: string
  token?: string
}

interface CustomerServiceConfig {
  greeting: string
  apiKey: string
  apiSecret: string
}

// 转换引用数据格式
const convertIReferenceToReferences = (reference: any): Reference[] => {
  if (!reference || !reference.chunks) return []
  return reference.chunks.map((chunk: any) => ({
    content: chunk.content,
    dataset_id: chunk.dataset_id,
    document_id: chunk.document_id,
    document_name: chunk.document_name,
    id: chunk.id,
    image_id: chunk.image_id,
    positions: chunk.positions || []
  }))
}

const Robot: React.FC<Props> = ({ right = 20, bottom = 45, placeholder = '输入你的问题或需求', style, onClose }) => {
  const [inputValue, setInputValue] = useState('')
  const scrollBox = useRef<HTMLDivElement>(null)
  const innerBox = useRef<HTMLDivElement>(null)
  const sessionId = useRef('')

  // 初始化欢迎消息
  const [messages, setMessages] = useState<Message[]>([])
  const [config, setConfig] = useState<CustomerServiceConfig>({
    greeting: '您好，我是您的智能助手，请问有什么可以帮您？',
    apiKey: '',
    apiSecret: ''
  })

  // 获取客服配置
  const getCustomerServiceConfig = async () => {
    try {
      const { data } = await request.get<{ status: string; data: { config: CustomerServiceConfig } }>('/admin/config/customer-service')
      if (data.status === 'success') {
        setConfig(data.data.config)
        setMessages([
          {
            role: 'assistant',
            content: data.data.config.greeting
          }
        ])
      } else {
        Toast.notify({
          type: 'error',
          message: '获取客服配置失败'
        })
      }
    } catch (error) {
      console.error(error)
      Toast.notify({
        type: 'error',
        message: '获取客服配置失败'
      })
    }
  }

  useMount(async () => {
    await getCustomerServiceConfig()
  })

  const { send, answer, done } = useSendMessageWithSseWithRobot(config.apiKey, config.apiSecret)

  // 监听回答更新
  useEffect(() => {
    if (answer?.answer) {
      setMessages((prev) => {
        const messages = [...prev]
        const lastMessage = messages[messages.length - 1]

        // 确保最后一条消息是AI回复
        if (lastMessage && lastMessage.role === 'assistant') {
          // 更新最后一条消息的内容
          messages[messages.length - 1] = {
            ...lastMessage,
            content: answer.answer + (done ? '' : '<span class="gpt-cursor"></span>'),
            id: answer.id,
            reference: convertIReferenceToReferences(answer.reference)
          }
        }

        return messages
      })
    }
  }, [answer, done])

  // 滚动到底部
  useEffect(() => {
    if (scrollBox.current) {
      scrollBox.current.scrollTo({
        top: scrollBox.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || !done) return

    if (!config.apiKey || !config.apiSecret) {
      Toast.notify({
        type: 'error',
        message: '未找到可用的知识库应用'
      })
      return
    }

    if (!sessionId.current) {
      const response = await createSessionWithFetch(config.apiKey, config.apiSecret, {
        name: inputValue.trim().slice(0, 50) // 使用用户输入的前50个字符作为标题
      })
      if (response.code === 0) {
        sessionId.current = response.data.id
      } else {
        throw new Error('创建新对话失败')
      }
    }

    // 先添加用户消息到界面
    const userMessage: Message = {
      content: inputValue.trim(),
      role: 'user'
    }

    setInputValue('')

    // 创建一个带有光标的占位AI消息
    const placeholderMessage: Message = {
      content: '<span class="gpt-cursor"></span>',
      role: 'assistant',
      id: UUID() // 生成一个临时ID
    }

    // 添加消息
    setMessages((prev) => [...prev, userMessage, placeholderMessage])

    // 发送消息
    await send({
      question: userMessage.content,
      stream: true,
      session_id: sessionId.current
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="robot absolute h-[610px] w-[450px] bg-white animate__animated animate__fadeInUp animate__faster"
      style={{
        zIndex: 100,
        right,
        bottom,
        ...style
      }}
    >
      <div className="shrink-0 flex items-center justify-between h-14 px-4 border-b">
        <div className="flex items-center space-x-2">
          <img alt="logo" className="block w-auto h-6 undefined" src={logo} />
          <div className="text-sm font-bold">智能客服</div>
        </div>
        <div className="icon-container icon-minus-container cursor-pointer" onClick={onClose}>
          <i className="iconfont icon-jianhao" style={{ fontSize: '20px' }}></i>
        </div>
      </div>
      <div className="robot-container h-[calc(100%_-_56px)]">
        <div className="dialogue-detail" style={style}>
          <div className="session-box" ref={scrollBox}>
            <div className="" ref={innerBox}>
              {messages.map((item, index) => (
                <div className="item" key={index}>
                  {item.role === 'user' && (
                    <div className="chat chat-end">
                      <div className="chat-image avatar">
                        <div className="w-10 rounded-full">
                          <img alt="" src={defaultAvatar} />
                        </div>
                      </div>
                      <Tooltip title={'点击复制到输入框'} placement="bottom">
                        <div className="chat-bubble answer copy_content cursor-pointer" onClick={() => setInputValue(item.content)}>
                          {item.content}
                        </div>
                      </Tooltip>
                    </div>
                  )}
                  {item.role === 'assistant' && (
                    <div className="chat chat-start">
                      <div className="chat-image avatar">
                        <div className="w-10 rounded-full">
                          <img alt="" src={robotAvatar} />
                        </div>
                      </div>
                      <div className="chat-bubble answer">
                        <ReferenceText text={item.content} references={item.reference || []} />
                        <div className="interact">
                          <div className="interact-operate">
                            <Tooltip title={'点击可复制'} placement="top">
                              <i className="shim">
                                <div className="copy" onClick={() => handleCopyClick(item.content)} />
                              </i>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="last-div" />
          </div>
          <div className="search-box animate__bounceInUp">
            <div className="search-container">
              <div className="search flex">
                <div className="search-input-box">
                  <div className="input-wrap">
                    <div className="input-box-inner flex items-end">
                      <TextArea value={inputValue} onPressEnter={handleKeyDown} onChange={(e) => setInputValue(e.target.value)} placeholder={placeholder} autoSize={{ minRows: 1, maxRows: 3 }} />
                      <div className="h-[28px]">
                        <img className={`enter ${!done ? 'loading loading-spinner loading-xs' : ''}`} onClick={handleSend} src={sendIcon} alt="" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Robot
