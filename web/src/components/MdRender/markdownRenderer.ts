// markdownRenderer.ts
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { imgLazyload } from '@mdit/plugin-img-lazyload'
import copy from 'copy-to-clipboard'
import './md.css'
import Toast from '../Toast'

export const handleCopyClick = async (text: string) => {
  if (copy(text)) {
    Toast.notify({ type: 'success', message: '复制成功' })
  } else {
    Toast.notify({ type: 'error', message: '复制失败' })
  }
}

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (__) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
}).use(imgLazyload)

const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrPush(['target', '_blank'])
  tokens[idx].attrPush(['rel', 'noopener noreferrer'])
  return defaultRender(tokens, idx, options, env, self)
}

md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx]
  const src = token.attrGet('src')
  const alt = token.attrGet('alt')
  const title = token.attrGet('title')
  return `<a href="${src}" target="_blank" class="img-preview"><img src="${src}" alt="${alt}" title="${title}" style="width: 300px; height: 300px;"/></a>`
}

let includeCopyButtonGlobal = false // 新增全局变量

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const langClass = token.info ? `language-${token.info}` : ''
  const lines = token.content.split('\n').slice(0, -1)
  const lineNumbers = lines.map((line, i) => `<span>${i + 1}</span>`).join('\n')
  const pure = hljs.highlight(token.content, { language: token.info || 'md', ignoreIllegals: true })
  const hasCursor = pure.code?.includes('<span class="gpt-cursor"></span>')
  const pureCode = pure.code?.replace('<span class="gpt-cursor"></span>', '')
  const content = hljs.highlight(pureCode!, { language: token.info || 'md', ignoreIllegals: true }).value + `${hasCursor ? '<span class="gpt-cursor"></span>' : ''}`
  const uniqueId = `copy-button-${Date.now()}-${Math.random()}`

  if (includeCopyButtonGlobal) {
    // 使用 MutationObserver 来监听 DOM 变化
    setTimeout(() => {
      const observer = new MutationObserver((mutations, obs) => {
        const copybutton = document.getElementById(uniqueId)
        if (copybutton) {
          copybutton.addEventListener('click', () => handleCopyClick(token.content))
          obs.disconnect() // 找到按钮后停止观察
        }
      })

      // 开始观察 document.body 的子树变化
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      // 5秒后如果还没找到按钮，停止观察
      setTimeout(() => observer.disconnect(), 5000)
    }, 0)
  }
  const finallyText = includeCopyButtonGlobal
    ? `
    <div class="${langClass}">
      <div class="top"> <div class="language">${token.info}</div><div class="copy-button" id="${uniqueId}">复制</div></div>
      <pre class="hljs"><code><span class="line-numbers-rows">${lineNumbers}</span>${content}</code></pre>
    </div>
    `
    : ` <pre class="hljs ${langClass}"><code>${content}</code></pre>`

  return finallyText
}

// 导出 render 函数
export const renderMarkdown = (markdownText: string, includeCopyButton: boolean = true): string => {
  includeCopyButtonGlobal = includeCopyButton // 更新全局变量
  return md.render(markdownText)
}
