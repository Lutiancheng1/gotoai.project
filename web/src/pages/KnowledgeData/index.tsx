import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip, Modal, Input } from 'antd'
import sendIcon from '@/assets/images/send.svg'
import InfiniteScroll from 'react-infinite-scroll-component'
import Toast from '@/components/Toast'
import defaultAvatar from '@/assets/images/default-avatar.jpg'
import rebotAvatar from '@/assets/images/robot.svg'
import stopIcon from '@/assets/images/session_stop_icon2.svg'
import refreshIcon from '@/assets/images/refresh.png'
import './index.css'
import '@/assets/styles/history.css'
import '@/assets/styles/dialog.css'
import '@/assets/styles/search.css'
import TextArea from 'antd/es/input/TextArea'
import { UUID } from '@/utils/libs'
import { handleCopyClick, renderMarkdown } from '@/components/MdRender/markdownRenderer'
import Footer from '@/components/Footer'
import { formatDate } from '@/utils/format'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { RagflowService } from '@/services/ragflow'
import type { Message, Reference, Session } from '@/types/ragflow'
import { toggleLoading } from '@/store/slice/authSlice'
import { IReference, useSendMessageWithSse } from '@/services/hooks'

type Props = {}

// 添加文件相关的类型定义
interface FileInfo {
  uuid: string
  name: string
  size: number
  type: string
  loading?: boolean
  error?: boolean
}

// 添加转换函数
const convertIReferenceToReferences = (iReference: IReference): Reference[] => {
  if (!iReference?.chunks) return []

  return iReference.chunks.map((chunk: any) => ({
    content: chunk.content || '',
    dataset_id: chunk.dataset_id || '',
    document_id: chunk.document_id || '',
    document_name: chunk.document_name || '',
    id: chunk.id || '',
    image_id: chunk.image_id || '',
    positions: chunk.positions || [],
    similarity: chunk.similarity || 0,
    term_similarity: chunk.term_similarity || 0,
    vector_similarity: chunk.vector_similarity || 0
  }))
}

const KnowledgeData: React.FC<Props> = () => {
  // 获取当前用户的ragflow应用
  const { user } = useAppSelector((state) => state.auth)
  const ragflowApp = useMemo(() => {
    return user?.departments?.[0]?.applications?.find((app) => app.type === 'ragflow')
  }, [user])
  const dispatch = useAppDispatch()
  const [historyList, setHistoryList] = useState<Session[]>([])
  const [currentChat, setCurrentChat] = useState<Session | null>(null)
  const [historyCollapsed, setHistoryCollapsed] = useState(false)
  const historyDivRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const ITEM_HEIGHT = 75 // 每个历史记录项的高度

  // 计算每页显示的条目数
  const PAGE_SIZE = useMemo(() => {
    const viewportHeight = window.innerHeight - 108 // 减去头部高度
    const itemsPerPage = Math.floor(viewportHeight / ITEM_HEIGHT) + 1
    return Math.max(itemsPerPage, 1) // 确保至少显示1条
  }, [])

  // 对话相关状态
  const [sendValue, setSendValue] = useState('')
  const [messageLoading, setMessageLoading] = useState(false)
  const [showRefresh, setShowRefresh] = useState(false)
  const scrollBox = useRef<HTMLDivElement>(null)
  const [controller, setController] = useState<AbortController>()

  // 添加文件相关状态
  const [fileList, setFileList] = useState<FileInfo[]>([])
  const uploadRef = useRef<HTMLInputElement>(null)

  // 切换历史记录示状态
  const toggleHistory = (flag: boolean) => {
    if (flag) {
      historyDivRef.current!.style.display = 'none'
    } else {
      historyDivRef.current!.style.display = ''
    }
    setHistoryCollapsed(!historyCollapsed)
  }

  // 修改加载历史记录的实现
  const loadHistoryList = async (pageIndex = 1, keepExisting = false) => {
    if (!ragflowApp) {
      Toast.notify({ type: 'error', message: '未找到可用的知识库应用' })
      return
    }

    // 只有在不保留现有数据且是第一页时才清空列表
    if (pageIndex === 1 && !keepExisting) {
      setLoading(true)
    }

    try {
      const response = await RagflowService.listSessions(ragflowApp.apiKey, {
        page: pageIndex,
        page_size: PAGE_SIZE, // 使用动态计算的页大小
        orderby: 'update_time',
        desc: true
      })

      if (response.code === 0) {
        setHistoryList((prev) => (pageIndex === 1 ? response.data : [...prev, ...response.data]))
        setHasMore(response.data.length === PAGE_SIZE)
        setCurrentPage(pageIndex)
      } else {
        Toast.notify({ type: 'error', message: response.message || '获取历史记录失败' })
        setHasMore(false)
      }
    } catch (error: any) {
      console.error('Load history failed:', error)
      Toast.notify({ type: 'error', message: error.message || '获取历史记录失败' })
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  // 修改加载更多的实现
  const loadMore = () => {
    if (loading || !hasMore) return
    loadHistoryList(currentPage + 1)
  }

  // 修改创建新会话的实现，只清空当前选中的对话
  const createNewChat = () => {
    setCurrentChat(null)
    // 可选：滚动到顶部或其他位置
    if (scrollBox.current) {
      scrollBox.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  // 修改删除历史记录的实现
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  // 显示删除确认弹窗
  const showDeleteModal = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setDeletingSessionId(sessionId)
    setDeleteModalVisible(true)
  }

  const delHistory = async () => {
    if (!ragflowApp || !deletingSessionId) {
      return
    }

    try {
      dispatch(toggleLoading(true))
      const response = await RagflowService.deleteSessions(ragflowApp.apiKey, {
        ids: [deletingSessionId]
      })

      if (response.code === 0) {
        // 直接从列表中移除删除的会话
        setHistoryList((prev) => prev.filter((item) => item.id !== deletingSessionId))
        if (currentChat?.id === deletingSessionId) {
          setCurrentChat(null)
        }
        Toast.notify({ type: 'success', message: '删除成功' })
      } else {
        Toast.notify({ type: 'error', message: '删除失败' })
      }
    } catch (error) {
      console.error('Delete history failed:', error)
      Toast.notify({ type: 'error', message: '删除失败' })
    } finally {
      dispatch(toggleLoading(false))
      setDeleteModalVisible(false)
      setDeletingSessionId(null)
    }
  }

  // 获取对话详情
  const getConversationDetail = async (item: Session) => {
    if (currentChat?.id === item.id) return
    dispatch(toggleLoading(true))
    setCurrentChat(null)
    try {
      setCurrentChat(item)
      dispatch(toggleLoading(false))
    } catch (error) {
      setCurrentChat(null)
      console.error('Get conversation detail failed:', error)
      Toast.notify({ type: 'error', message: '获取对话详情失败' })
      dispatch(toggleLoading(false))
    }
  }

  const { send, answer, done, setDone } = useSendMessageWithSse(ragflowApp?.apiKey || '')

  // 监听回答更新
  useEffect(() => {
    if (answer?.answer && currentChat) {
      // 更新当前会话的消息列表
      setCurrentChat((prev) => {
        if (!prev) return null
        const messages = [...(prev.messages || [])]
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

        return {
          ...prev,
          messages
        }
      })
    }
  }, [answer, done])

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (scrollBox.current) {
      scrollBox.current.scrollTo({
        top: scrollBox.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  // 监听消息更新，自动滚动到底部
  useEffect(() => {
    if (answer?.answer) {
      scrollToBottom()
    }
  }, [answer])

  // 监听当前会话变化，自动滚动到底部
  useEffect(() => {
    if (currentChat) {
      scrollToBottom()
    }
  }, [currentChat])

  // 发送消息
  const sendMessage = async () => {
    if (!sendValue.trim() || messageLoading || !ragflowApp) {
      return
    }

    setMessageLoading(true)
    const abortController = new AbortController()
    setController(abortController)

    try {
      let targetChat = currentChat

      // 如果没有选中的对话，创建一个新的
      if (!targetChat) {
        const response = await RagflowService.createSession(ragflowApp.apiKey, {
          name: sendValue.trim().slice(0, 50) // 使用用户输入的前50个字符作为标题
        })

        if (response.code === 0) {
          targetChat = response.data
          // 添加到历史记录列表顶部
          setHistoryList((prev) => [response.data, ...prev])
          setCurrentChat(response.data)
        } else {
          throw new Error('创建新对话失败')
        }
      }

      // 先添加用户消息到界面
      const userMessage: Message = {
        content: sendValue.trim(),
        role: 'user'
      }

      // 创建一个带有光标的占位AI消息
      const placeholderMessage: Message = {
        content: '<span class="gpt-cursor"></span>',
        role: 'assistant',
        id: UUID() // 生成一个临时ID
      }

      setCurrentChat((prev) => {
        if (!prev) return targetChat
        return {
          ...prev,
          messages: [...(prev.messages || []), userMessage, placeholderMessage]
        }
      })

      // 清空输入框
      setSendValue('')

      // 添加用户消息后滚动到底部
      setTimeout(scrollToBottom, 100)

      // 发送消息
      await send(
        {
          question: userMessage.content,
          session_id: targetChat.id
        },
        abortController
      )
    } catch (error: any) {
      if (error?.message !== 'aborted') {
        Toast.notify({ type: 'error', message: error?.message || '发送失败' })
      }
    } finally {
      setMessageLoading(false)
      setController(undefined)
    }
  }

  // 停止生成
  const stopMessage = () => {
    controller?.abort()
    setMessageLoading(false)
    setDone(true)
  }

  // 重新生成消息
  const regenerateMessage = async () => {
    if (messageLoading || !currentChat?.messages?.length || !ragflowApp) return

    // 获取最后一条用户消息
    const lastUserMessage = [...currentChat.messages].reverse().find((msg) => msg.role === 'user')
    if (!lastUserMessage) return

    setMessageLoading(true)
    const abortController = new AbortController()
    setController(abortController)

    try {
      // 移除最后一条助手消息
      setCurrentChat((prev) => {
        if (!prev) return null
        const messages = [...prev.messages]
        if (messages[messages.length - 1].role === 'assistant') {
          messages.pop()
        }
        return {
          ...prev,
          messages
        }
      })

      // 重新发送消息
      await send(
        {
          question: lastUserMessage.content,
          session_id: currentChat.id
        },
        abortController
      )
    } catch (error: any) {
      if (error?.message !== 'aborted') {
        Toast.notify({ type: 'error', message: '重新生成失败' })
      }
    } finally {
      setMessageLoading(false)
      setController(undefined)
    }
  }

  // 文件上传处理
  const uploadHandle = async (e: React.ChangeEvent<HTMLInputElement> | undefined) => {
    if (!e?.target.files) return
    const files = Array.from(e.target.files)

    // 处理文件上传逻辑
    const newFiles: FileInfo[] = files.map((file) => ({
      uuid: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      loading: true
    }))

    setFileList((prev) => [...prev, ...newFiles])

    // TODO: 实现实的文件上传API
    try {
      // 文件上传逻辑
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  useEffect(() => {
    if (ragflowApp) {
      loadHistoryList()
    }
  }, [ragflowApp]) // 依赖ragflowApp，当它变化时重新加载

  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [renamingSession, setRenamingSession] = useState<Session | null>(null)
  const [newSessionName, setNewSessionName] = useState('')

  // 打开重命名弹窗
  const showRenameModal = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation()
    setRenamingSession(session)
    setNewSessionName(session.name)
    setRenameModalVisible(true)
  }

  // 处理重命名
  const handleRename = async () => {
    if (!ragflowApp || !renamingSession || !newSessionName.trim()) {
      return
    }

    try {
      dispatch(toggleLoading(true))
      const response = await RagflowService.updateSession(ragflowApp.apiKey, renamingSession.id, {
        name: newSessionName.trim()
      })

      if (response.code === 0) {
        // 更新列表中的会话名称
        setHistoryList((prev) => prev.map((item) => (item.id === renamingSession.id ? { ...item, name: newSessionName.trim() } : item)))
        // 如果是当前会话，也更新当前会话
        if (currentChat?.id === renamingSession.id) {
          setCurrentChat((prev) => (prev ? { ...prev, name: newSessionName.trim() } : null))
        }
        Toast.notify({ type: 'success', message: '重命名成功' })
      } else {
        Toast.notify({ type: 'error', message: '重命名失败' })
      }
    } catch (error) {
      console.error('Rename session failed:', error)
      Toast.notify({ type: 'error', message: '重命名失败' })
    } finally {
      dispatch(toggleLoading(false))
      setRenameModalVisible(false)
      setRenamingSession(null)
      setNewSessionName('')
    }
  }

  // 添加引用信息弹窗状态
  const [referenceModalVisible, setReferenceModalVisible] = useState(false)
  const [currentReference, setCurrentReference] = useState<Reference[]>([])

  // 显示引用信息弹窗
  const showReferenceModal = (references: Reference[]) => {
    setCurrentReference(references)
    setReferenceModalVisible(true)
  }

  return (
    <>
      <div className="knowledge-data-page">
        {/* 左侧历史记录 */}
        <div ref={historyDivRef} className="history animate__animated animate__fadeInLeft animate__faster">
          <div className="histroy-header">
            <div className="left-header-block-up">
              <span>历史记录</span>
              <div className="fold" onClick={() => toggleHistory(true)}>
                <i className="iconfont icon-fold icon-zhedie cursor-pointer"></i>
              </div>
            </div>
            <div className="new-session-button-wrap" onClick={createNewChat}>
              <div className="new-session-button">
                <span>开始新对话</span>
              </div>
            </div>
          </div>
          <div className="history-list" id="scrollableDiv">
            {loading && currentPage === 1 ? (
              <div className="w-full h-full flex justify-center items-center">
                <span className="loading loading-dots loading-lg"></span>
              </div>
            ) : (
              <InfiniteScroll
                dataLength={historyList.length}
                next={loadMore}
                hasMore={hasMore}
                loader={
                  loading && (
                    <div className="flex justify-center mt-3 items-center">
                      <span className="loading loading-dots loading-lg"></span>
                    </div>
                  )
                }
                scrollableTarget="scrollableDiv"
                endMessage={historyList.length > 0 ? <p className="flex justify-center items-center p-3 text-gray-500">没有更多了</p> : !loading ? <p className="flex justify-center items-center p-3 text-gray-500">暂无数据</p> : null}
              >
                {historyList.map((item) => (
                  <div key={item.id} onClick={() => getConversationDetail(item)} className={`history-item ${currentChat?.id === item.id ? 'active' : ''}`}>
                    <div className="title" title={item.name}>
                      <span className="text-ellipsis overflow-hidden">{item.name}</span>
                    </div>
                    <div className="time">
                      <span>{formatDate(item.update_time)}</span>
                      <div className="flex gap-1">
                        <Tooltip placement="top" title="重命名">
                          <i className="iconfont icon-bianji cursor-pointer hidden" onClick={(e) => showRenameModal(e, item)} />
                        </Tooltip>
                        <Tooltip placement="top" title="删除">
                          <i className="iconfont icon-shanchu cursor-pointer hidden" onClick={(e) => showDeleteModal(e, item.id)} />
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </InfiniteScroll>
            )}
          </div>
        </div>

        {/* 折叠时的侧边栏也需要修改提示文案 */}
        {historyCollapsed && (
          <div className="expand-bar">
            <Tooltip placement="right" title="开始新对话">
              <div className="add-session-icon" onClick={createNewChat}></div>
            </Tooltip>
            <Tooltip placement="right" title="展开历史记录">
              <div className="expand-icon" onClick={() => toggleHistory(false)}></div>
            </Tooltip>
          </div>
        )}

        {/* 右侧对话区域 */}
        <div className="dialogue-container">
          <div className="dialogue-detail">
            {!currentChat ? (
              <div className="init_page animate__animated animate__fadeIn animate__faster">
                <div className="title-box">
                  <p className="title">知识库</p>
                  <p className="sub-title">
                    我是利用企业内部私有数据学习、训练后生成的企业级AI智能体，并且与企业内部数、业流程、管理系统集(如ERP,MES,RPA,CRM...)，为每位员工、每个部门提供包括文档检索、知问答、自助服务、业务流程、企业运营和分析等端到端的一站式服务，致力成为驱动企业业务变革和提升企业生产力的平台。立即开始体验吧！{' '}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="session-box" ref={scrollBox}>
                  {currentChat?.messages.map((message, index) => (
                    <div className="item" key={index}>
                      {message.role === 'user' && (
                        <div className="chat chat-end">
                          <div className="chat-image avatar">
                            <div className="w-10 rounded-full">
                              <img alt="" src={defaultAvatar} />
                            </div>
                          </div>
                          <Tooltip title={'点击复制到输入框'} placement="bottom">
                            <div className="chat-bubble answer copy_content cursor-pointer" onClick={() => setSendValue(message.content || '')}>
                              {message.content}
                            </div>
                          </Tooltip>
                        </div>
                      )}
                      {message.role === 'assistant' && (
                        <div className="chat chat-start">
                          <div className="chat-image avatar">
                            <div className="w-10 rounded-full">
                              <img alt="" src={rebotAvatar} />
                            </div>
                          </div>
                          <div className="chat-bubble answer">
                            <div
                              className="markdown-body"
                              id={message.id}
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(message.content || '')
                              }}
                            />
                            <div className="interact">
                              <div className="interact-operate">
                                {message.reference && message.reference.length > 0 && (
                                  <Tooltip title={'查看引用信息'} placement="top">
                                    <i className="shim cursor-pointer iconfont icon-chakan" onClick={() => showReferenceModal(message.reference || [])}></i>
                                  </Tooltip>
                                )}
                                <Tooltip title={'点击可复制'} placement="top">
                                  <i className="shim">
                                    <div className="copy" onClick={() => handleCopyClick(message.content || '')} />
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
                <div className="last-div">
                  {showRefresh && (
                    <div className="input-msg flex" onClick={regenerateMessage}>
                      <div>
                        <img src={refreshIcon} alt="" />
                        <span>重新生成</span>
                      </div>
                    </div>
                  )}
                  {messageLoading && (
                    <div className="input-msg flex">
                      <div onClick={stopMessage}>
                        <img src={stopIcon} alt="" />
                        <span>停止生成</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="search-box animate__bounceInUp">
              <div className="search-container">
                <div className="search flex">
                  <div className="search-input-box">
                    {fileList.length > 0 && (
                      <div className="file-list-box">
                        {fileList.map((item) => (
                          <div className="file-box" key={item.uuid}>
                            <div className="file">
                              <div className="icon icon-img">
                                {item.error && (
                                  <div className="answer-error-icon file-retry-cover">
                                    <p className="file-retry-icon" />
                                  </div>
                                )}
                              </div>
                              <div className="file-info">
                                <p className="name dot text-ellipsis" title={item.name}>
                                  {item.name}
                                </p>
                                <div className="status">
                                  {item.loading && (
                                    <p className="flex text-xs">
                                      <span className="loading loading-spinner loading-xs mr-2"></span>上传中
                                    </p>
                                  )}
                                  {!item.error && !item.loading && (
                                    <div className="success">
                                      <p className="type">{item.type}</p>
                                      <p className="size">{item.size}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="close" onClick={() => setFileList((prev) => prev.filter((f) => f.uuid !== item.uuid))} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="input-wrap">
                      <div className="input-box-inner">
                        <TextArea
                          value={sendValue}
                          onChange={(e) => setSendValue(e.target.value)}
                          placeholder="输入您的问题..."
                          autoSize={{ minRows: 1, maxRows: 9 }}
                          onPressEnter={(e) => {
                            if (!e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                        />
                      </div>
                      <div className="search-interactive">
                        <div className="upload-image-wrap">
                          <Tooltip title={<span className="text-12">最多支持十文件,格式 txt md html word pdf ppt csv excel image</span>}>
                            <input onChange={uploadHandle} ref={uploadRef} type="file" style={{ display: 'none' }} multiple />
                            <div className="upload-image-btn hidden" onClick={() => uploadRef.current?.click()} />
                          </Tooltip>
                        </div>
                        <div className="search-operation">
                          <div className={`enter ${messageLoading ? 'loading loading-spinner loading-xs' : ''}`} onClick={sendMessage}>
                            <img src={sendIcon} alt="" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名会话"
        open={renameModalVisible}
        onOk={handleRename}
        onCancel={() => {
          setRenameModalVisible(false)
          setRenamingSession(null)
          setNewSessionName('')
        }}
        okText="确认"
        cancelText="取消"
      >
        <Input value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} placeholder="请输入新的会话名称" maxLength={50} autoFocus />
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="删除确认"
        open={deleteModalVisible}
        onOk={delHistory}
        onCancel={() => {
          setDeleteModalVisible(false)
          setDeletingSessionId(null)
        }}
        okType="danger"
        okText="确认"
        cancelText="取消"
      >
        <p>确定要删除这个会话吗？此操作不可恢复。</p>
      </Modal>

      {/* 引用信息弹窗 */}
      <Modal title="引用信息" open={referenceModalVisible} onCancel={() => setReferenceModalVisible(false)} footer={null} width={700}>
        <div className="max-h-[60vh] overflow-y-auto">
          {currentReference.map((ref, index) => (
            <div key={ref.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-base">📄 {ref.document_name}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-sm text-gray-500">
                <div className="flex flex-col">
                  <span className="font-medium">综合相似度 {(ref.similarity * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">术语相似度 {(ref.term_similarity * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">向量相似度 {(ref.vector_similarity * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap border-t border-gray-200 pt-3">{ref.content}</div>
              {index < currentReference.length - 1 && <div className="border-b border-gray-200 my-4"></div>}
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}

export default KnowledgeData
