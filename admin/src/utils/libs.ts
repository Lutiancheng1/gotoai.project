/**
 * 判断当前页面是否在iframe中
 * @returns {boolean} true表示在iframe中，false表示不在iframe中
 */
export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    // 如果因为跨域问题访问window.top报错，那么也说明是在iframe中
    return true;
  }
}

/**
 * 获取iframe的来源域名
 * @returns {string|null} 返回父页面的域名，如果不在iframe中或获取失败则返回null
 */
export const getIframeParentOrigin = (): string | null => {
  try {
    if (!isInIframe()) return null;
    return document.referrer ? new URL(document.referrer).origin : null;
  } catch (e) {
    return null;
  }
} 