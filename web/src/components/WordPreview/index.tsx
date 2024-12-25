import React, { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import './index.css'
import Loading from '../Loading'
import Toast from '../Toast'
import pageUpIcon from '../PDFViewer/images/pageup.svg'
import pageDownIcon from '../PDFViewer/images/pagedown.svg'
import minusIcon from '../PDFViewer/images/minus.svg'
import plusIcon from '../PDFViewer/images/plus.svg'
import { useDebounceFn, useMount, useScroll, useUnmount, useUpdateEffect } from 'ahooks'

interface WordPreviewProps {
  url: string // 仅支持 URL
  handleMouseUp?: (event: MouseEvent) => void
  hasTools?: boolean
  targetViewContainer?: HTMLDivElement // 手动指定容器
  initialScale?: number
}

/**
 * WordPreview 组件的属性定义
 * @interface WordPreviewProps
 * @property {string} url - DOCX 文件的 URL 地址
 * @property {(event: MouseEvent) => void} [handleMouseUp] - 鼠标抬起事件处理函数，通常用于处理文本选择
 * @property {boolean} [hasTools=false] - 是否显示工具栏（包括缩放、翻页等功能）
 * @property {HTMLDivElement} [targetViewContainer] - 手动指定滚动容器，用于检测页面滚动。如果不指定，将尝试查找 .preview-container 元素
 * @property {number} [initialScale=0.8] - 初始缩放比例，默认为 0.8
 */

const WordPreview: React.FC<WordPreviewProps> = ({ url, handleMouseUp, hasTools = true, targetViewContainer, initialScale = 0.8 }) => {
  const viewContainer = useRef<HTMLDivElement | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [scale, setScale] = useState(initialScale) // 初始缩放比例为.8
  const loadingBarRef = useRef<HTMLDivElement | null>(null)
  const [numPages, setNumPages] = useState<number>(1)

  // 检查滚动容器是否存在
  useEffect(() => {
    if (!targetViewContainer && !document.querySelector('.preview-container')) {
      console.warn('PDFViewer: No scroll container found. Please either provide targetViewContainer prop or ensure .preview-container exists in the DOM. This may affect page detection during scrolling.')
    }
  }, [targetViewContainer])

  // 当前页面
  const [pageNumber, setPageNumber] = useState(1)
  const scroll = useScroll(viewContainer)!
  const { run: updatePageNumber } = useDebounceFn(
    (pageNum) => {
      setPageNumber(pageNum)
    },
    { wait: 100 } // 100毫秒内的多次调用将被合并为一次
  )
  const zoomPages = (scale: number) => {
    const pages = previewRef.current!.getElementsByClassName('docx') as HTMLCollectionOf<HTMLDivElement>
    Array.from(pages).forEach((page, index) => {
      ;(pages[index].style as any).zoom = scale.toString()
    })
  }
  const zoomIn = () => {
    setScale((prevScale) => {
      const newScale = parseFloat((prevScale * 1.1).toFixed(1)) // 放大10%，保留1位小数
      zoomPages(newScale)
      return newScale
    })
  }

  const zoomOut = () => {
    setScale((prevScale) => {
      const newScale = parseFloat((prevScale / 1.1).toFixed(1)) // 缩小10%，保留1位小数
      zoomPages(newScale)
      return newScale
    })
  }
  const goToPreviousPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1))
    scrollToPage(pageNumber - 1)
  }
  const goToNextPage = () => {
    setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages))
    scrollToPage(pageNumber + 1)
  }

  const scrollToPage = (pageNum: number) => {
    requestAnimationFrame(() => {
      let pageContainer = (viewContainer.current ?? document).querySelector(`.docx[data-page-number="${pageNum}"]`) as HTMLDivElement | null
      if (pageContainer && viewContainer.current) {
        const zoomFactor = parseFloat((pageContainer.style as any).zoom)
        const topPosition = pageContainer.getBoundingClientRect().top * zoomFactor + window.pageYOffset - previewRef.current!.getBoundingClientRect().top
        viewContainer.current.scrollTo({ top: topPosition, behavior: 'smooth' })
      }
    })
  }
  useEffect(() => {
    const loadDocument = () => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'blob' // 以 Blob 的形式接收数据
      setLoading(true)
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          if (loadingBarRef.current) {
            loadingBarRef.current.style.setProperty('--progressBar-percent', `${percentComplete}%`)
            if (loadingBarRef.current.classList.contains('hidden')) {
              loadingBarRef.current.classList.remove('hidden') // 显示进度条
            }
            if (percentComplete === 100) {
              loadingBarRef.current.classList.add('hidden') // 隐藏进度条
            }
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response
          renderAsync(blob, previewRef.current!, undefined, {
            className: 'docx',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderChanges: false,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
            debug: false
          })
            .then(async () => {
              const pages = previewRef.current!.getElementsByClassName('docx') as HTMLCollectionOf<HTMLDivElement>
              setNumPages(pages.length)
              Array.from(pages).forEach((page, index) => {
                // 为每个页面元素添加一个唯一的 data-page-id 属性
                pages[index].setAttribute('data-page-number', `${index + 1}`)
                // 设置每个页面元素的缩放
                ;(pages[index].style as any).zoom = scale.toString()
              })
              setLoading(false)
            })
            .catch(console.error)
        }
      }

      xhr.onerror = () => {
        setLoading(false)
        console.error('Error loading Word file')
        Toast.notify({ type: 'error', message: '文档加载失败' })
      }

      xhr.send()
    }

    loadDocument()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  // 创建 handleScroll 函数
  const handleScroll = () => {
    const containerTop = scroll && scroll.top
    const containerCenter = viewContainer.current!.offsetHeight / 2 + containerTop!
    let closestPageNum = 1
    let minDistance = Infinity
    let closestPageNumOnBoundary = 1
    let minDistanceOnBoundary = Infinity

    const pages = previewRef.current!.getElementsByClassName('docx') as HTMLCollectionOf<HTMLDivElement>

    Array.from(pages).forEach((page, index) => {
      const zoomFactor = parseFloat((page.style as any).zoom)
      const pageTop = page.offsetTop * zoomFactor
      const pageHeight = page.clientHeight * zoomFactor
      const pageBottom = pageTop + pageHeight
      const pageCenter = pageTop + pageHeight / 2
      const distance = Math.abs(containerCenter - pageCenter)

      // 考虑页面的上下边界与容器中心的距离
      if (pageTop <= containerCenter && pageBottom >= containerCenter && distance < minDistance) {
        closestPageNum = index + 1
        minDistance = distance
      }

      // 考虑滚动到两个页面的分界线时
      if (distance < minDistanceOnBoundary) {
        closestPageNumOnBoundary = index + 1
        minDistanceOnBoundary = distance
      }
    })

    // 如果closestPageNum仍然为1，那么就将其设置为当前滚动位置最接近的页面编号
    if (closestPageNum === 1) {
      closestPageNum = closestPageNumOnBoundary
    }

    // 如果页面的顶部超过了容器中心，将页码更新为下一页
    if (pages[closestPageNum - 1] && pages[closestPageNum - 1].offsetTop * parseFloat((pages[closestPageNum - 1].style as any).zoom) > containerCenter) {
      closestPageNum += 1
    }

    updatePageNumber(closestPageNum)
  }

  useUpdateEffect(() => {
    handleScroll()
  }, [scroll])

  useMount(() => {
    handleMouseUp && previewRef.current?.addEventListener('mouseup', handleMouseUp)
    viewContainer.current = targetViewContainer ?? (document.querySelector('.preview-container')! as HTMLDivElement)
  })

  useUnmount(() => {
    handleMouseUp && previewRef.current?.removeEventListener('mouseup', handleMouseUp)
  })
  return (
    <>
      {loading && (
        <div id="mask" className="w-full h-full" style={{ position: 'absolute' }}>
          <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <Loading></Loading>
          </div>
        </div>
      )}
      <div className="word-preview-containe relative">
        <div
          ref={previewRef}
          style={{
            // zoom: scale, // 使用 zoom 属性应用缩放
            width: '100%', // 确保容器宽度是100%，以便缩放时内容能够正确显示
            height: '100%' // 同样确保容器高度是100%
          }}
        ></div>
      </div>
      <div id="toolbarContainer">
        {hasTools && (
          <div id="toolbarViewer" style={{ pointerEvents: loading ? 'none' : 'auto' }}>
            <div id="toolbarViewerLeft">
              <div
                className="splitToolbarButton hiddenSmallView"
                style={{
                  alignItems: 'center',
                  display: 'flex'
                }}
              >
                <button className="toolbarButton" id="previous" disabled={pageNumber === 1} title="上一页" onClick={goToPreviousPage}>
                  <img src={pageUpIcon} alt="" />
                </button>
                <div
                  style={{
                    float: 'left',
                    marginLeft: '10px',
                    marginRight: '1px'
                  }}
                >
                  <span
                    id="pageNumberValue"
                    style={{
                      color: '#1a2029',
                      fontSize: '14px',
                      fontWeight: '600',
                      padding: '7px 0px'
                    }}
                  >
                    {pageNumber}
                  </span>
                  <span
                    className="toolbarLabel"
                    id="numPages"
                    style={{
                      marginLeft: '6px',
                      paddingLeft: '0px'
                    }}
                  >
                    / {numPages}
                  </span>
                </div>
                <button className="toolbarButton" id="next" disabled={pageNumber === numPages} title="下一页" onClick={goToNextPage}>
                  <img src={pageDownIcon} alt="" />
                </button>
              </div>
            </div>
            <div id="toolbarViewerMiddle">
              <div
                className="splitToolbarButton"
                style={{
                  alignItems: 'center',
                  display: 'flex'
                }}
              >
                <button className="toolbarButton" id="zoomOut" title="缩小" disabled={scale === 0.5} onClick={zoomOut}>
                  <img src={minusIcon} alt="" />
                </button>
                <div
                  id="zoomValue"
                  style={{
                    color: '#1a2029',
                    float: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '0 10px'
                  }}
                >
                  {parseInt((scale * 100).toFixed(0)) + '%'}
                </div>
                <button className="toolbarButton" id="zoomIn" title="放大" onClick={zoomIn}>
                  <img src={plusIcon} alt="" />
                </button>
              </div>
            </div>
          </div>
        )}
        <div
          id="loadingBar"
          style={{
            bottom: !hasTools ? '0' : ''
          }}
          ref={loadingBarRef}
        >
          <div className="progress">
            <div className="glimmer"></div>
          </div>
        </div>
      </div>
    </>
  )
}

export default WordPreview
