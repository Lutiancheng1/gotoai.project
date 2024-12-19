/*
* Formats a number with comma separators.
 formatNumber(1234567) will return '1,234,567'
 formatNumber(1234567.89) will return '1,234,567.89'
*/
export const formatNumber = (num: number | string) => {
  if (!num) return num
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export const formatFileSize = (num: number) => {
  if (!num) return num
  const units = ['', 'K', 'M', 'G', 'T', 'P']
  let index = 0
  while (num >= 1024 && index < units.length) {
    num = num / 1024
    index++
  }
  return `${num.toFixed(2)}${units[index]}B`
}

export const formatTime = (num: number) => {
  if (!num) return num
  const units = ['sec', 'min', 'h']
  let index = 0
  while (num >= 60 && index < units.length) {
    num = num / 60
    index++
  }
  return `${num.toFixed(2)} ${units[index]}`
}

export const formatDate = (timeStr: string | number) => {
  const date = new Date(timeStr)
  
  // 获取年月日
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  // 获取时分秒
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
export function formatFileType(mimeType: string): string {
  const typeMap: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (docx)',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (xlsx)',
    'text/csv': 'CSV',
    'image/jpeg': 'JPEG 图片',
    'image/png': 'PNG 图片',
    'image/gif': 'GIF 图片',
    'text/plain': '文本文件',
    'application/zip': 'ZIP 压缩文件',
    'application/x-rar-compressed': 'RAR 压缩文件',
    'application/x-7z-compressed': '7z 压缩文件',
    'video/mp4': 'MP4 视频',
    'audio/mpeg': 'MP3 音频',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint (pptx)',
    'application/x-msdownload': '可执行文件',
    'application/json': 'JSON 文件',
    'application/xml': 'XML 文件',
    'text/html': 'HTML 文件'
    // 更多文件类型...
  }

  return typeMap[mimeType] || '未知格式'
}

// 解析Uint8Array 转为json 返回
export const parsePack = (str: string) => {
  // 定义正则表达式匹配模式
  const pattern = /data:\s*({.*?})\s*\n/g
  // 定义一个数组来存储所有匹 配到的 JSON 对象
  const result = []
  // 使用正则表达式匹配完整的 JSON 对象并解析它们
  let match
  while ((match = pattern.exec(str)) !== null) {
    const jsonStr = match[1]
    try {
      const json = JSON.parse(jsonStr)
      result.push(json)
    } catch (e) {
      console.log(e)
    }
  }
  // 输出所有解析出的 JSON 对象
  return result
}