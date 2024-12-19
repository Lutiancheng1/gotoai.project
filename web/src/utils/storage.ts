import CryptoJS from 'crypto-js';

const SECRET_KEY = 'your-secret-key-2024'; // 建议使用环境变量存储
// 用户 Token 的本地缓存键名
const TOKEN_KEY = 'goto-ai-key'
export interface StoredCredentials {
  username: string;
  password: string;
  remember: boolean;
}

export class SecureStorage {
  private static readonly CREDENTIALS_KEY = 'stored_credentials';
  
  // 加密数据
  private static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  }
  
  // 解密数据
  private static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  
  // 保存凭证
  static saveCredentials(credentials: StoredCredentials): void {
    if (credentials.remember) {
      const encryptedData = this.encrypt(JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        remember: true
      }));
      localStorage.setItem(this.CREDENTIALS_KEY, encryptedData);
    } else {
      // 如果不记住密码，清除之前存储的凭证
      this.clearCredentials();
    }
  }
  
  // 获取存储的凭证
  static getCredentials(): StoredCredentials | null {
    try {
      const encryptedData = localStorage.getItem(this.CREDENTIALS_KEY);
      if (!encryptedData) return null;
      
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error getting credentials:', error);
      this.clearCredentials();
      return null;
    }
  }
  
  // 清除存储的凭证
  static clearCredentials(): void {
    localStorage.removeItem(this.CREDENTIALS_KEY);
  }
  
  // 检查是否有存储的凭证
  static hasStoredCredentials(): boolean {
    return !!localStorage.getItem(this.CREDENTIALS_KEY);
  }
} 

/**
 * 从本地缓存中获取 Token 信息
 */
export const getTokenInfo = (): string => {
  return localStorage.getItem(TOKEN_KEY) ||  ''
}

/**
 * 将 Token 信息存入缓存
 * @param {string} tokenInfo 从后端获取到的 Token 信息
 */
export const setTokenInfo = (tokenInfo: string) => {
  localStorage.setItem(TOKEN_KEY, tokenInfo)
}

/**
 * 删除本地缓存中的 Token 信息
 */
export const removeTokenInfo = () => {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 判断本地缓存中是否存在 Token 信息
 */
export const hasToken = (): boolean => {
  return !!getTokenInfo()
}
