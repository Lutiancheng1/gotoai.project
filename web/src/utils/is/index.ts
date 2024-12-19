export function isNumber<T extends number>(value: T | unknown): value is number {
  return Object.prototype.toString.call(value) === '[object Number]'
}

export function isString<T extends string>(value: T | unknown): value is string {
  return Object.prototype.toString.call(value) === '[object String]'
}

export function isBoolean<T extends boolean>(value: T | unknown): value is boolean {
  return Object.prototype.toString.call(value) === '[object Boolean]'
}

export function isNull<T extends null>(value: T | unknown): value is null {
  return Object.prototype.toString.call(value) === '[object Null]'
}

export function isUndefined<T extends undefined>(value: T | unknown): value is undefined {
  return Object.prototype.toString.call(value) === '[object Undefined]'
}

export function isObject<T extends object>(value: T | unknown): value is object {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function isArray<T extends any[]>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Array]'
}

export function isFunction<T extends (...args: any[]) => any | void | never>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Function]'
}

export function isDate<T extends Date>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Date]'
}

export function isRegExp<T extends RegExp>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object RegExp]'
}

export function isPromise<T extends Promise<any>>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Promise]'
}

export function isSet<T extends Set<any>>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Set]'
}

export function isMap<T extends Map<any, any>>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Map]'
}

export function isFile<T extends File>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object File]'
}

export function isExcelFile(fileName: string): boolean {
  return /\.(xlsx|xls)$/i.test(fileName)
}

export function isWordFile(fileName: string): boolean {
  return /\.(docx|doc)$/i.test(fileName)
}

export function isPdfFile(fileName: string): boolean {
  return /\.pdf$/i.test(fileName)
}
export function isCsvFile(fileName: string): boolean {
  return /\.csv$/i.test(fileName)
}
export function isPptFile(fileName: string): boolean {
  return /\.(ppt|pptx)$/i.test(fileName)
}

export function isTxtFile(fileName: string): boolean {
  return /\.txt$/i.test(fileName)
}

export function isXmlFile(fileName: string): boolean {
  return /\.xml$/i.test(fileName)
}

export function isHtmlFile(fileName: string): boolean {
  return /\.(htm|html)$/i.test(fileName)
}

const shortTypeToMimeType: { [key: string]: string[] } = {
  image: ['jpeg', 'jpg', 'png', 'gif'],
  word: ['doc', 'docx'],
  excel: ['xls', 'xlsx'],
  pdf: ['pdf'],
  csv: ['csv'],
  video: ['mp4', 'avi', 'mkv', 'mov', 'wmv'],
  audio: ['mp3', 'wav', 'flac', 'aac'],
  text: ['txt'],
  zip: ['zip', 'rar', '7z'],
  html: ['html', 'htm'] // 添加HTML文件类型
}

// 判断是否为图片文件
export function isImageFileType(fileType: string): boolean {
  return shortTypeToMimeType.image.includes(fileType)
}

// 判断是否为Word文件
export function isWordFileType(fileType: string): boolean {
  return shortTypeToMimeType.word.includes(fileType)
}

// 判断是否为Excel文件
export function isExcelFileType(fileType: string): boolean {
  return shortTypeToMimeType.excel.includes(fileType)
}

// 判断是否为PDF文件
export function isPdfFileType(fileType: string): boolean {
  return shortTypeToMimeType.pdf.includes(fileType)
}

// 判断是否为CSV文件
export function isCsvFileType(fileType: string): boolean {
  return shortTypeToMimeType.csv.includes(fileType)
}

// 判断是否为视频文件
export function isVideoFileType(fileType: string): boolean {
  return shortTypeToMimeType.video.includes(fileType)
}

// 判断是否为音频文件
export function isAudioFileType(fileType: string): boolean {
  return shortTypeToMimeType.audio.includes(fileType)
}

// 判断是否为文本文件
export function isTextFileType(fileType: string): boolean {
  return shortTypeToMimeType.text.includes(fileType)
}

// 判断是否为压缩文件
export function isZipFileType(fileType: string): boolean {
  return shortTypeToMimeType.zip.includes(fileType)
}
// 判断是否为HTML文件
export function isHtmlFileType(fileType: string): boolean {
  return shortTypeToMimeType.html.includes(fileType)
}
