import CryptoJS from 'crypto-js';

// 加密密钥，建议使用环境变量
const SECRET_KEY = 'your-secret-key-2024';

/**
 * 加密数据
 * @param data 要加密的数据
 * @returns 加密后的字符串
 */
export const encrypt = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

/**
 * 解密数据
 * @param encryptedData 加密后的字符串
 * @returns 解密后的数据
 */
export const decrypt = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * 加密对象
 * @param data 要加密的对象
 * @returns 加密后的字符串
 */
export const encryptObject = (data: object): string => {
  return encrypt(JSON.stringify(data));
};

/**
 * 解密对象
 * @param encryptedData 加密后的字符串
 * @returns 解密后的对象
 */
export const decryptObject = <T>(encryptedData: string): T => {
  const decryptedStr = decrypt(encryptedData);
  return JSON.parse(decryptedStr);
}; 