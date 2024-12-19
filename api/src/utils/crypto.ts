import bcrypt from 'bcryptjs';

/**
 * 对密码进行加密
 * @param password 原始密码
 * @returns 加密后的密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 比较密码是否匹配
 * @param password 原始密码
 * @param hashedPassword 加密后的密码
 * @returns 是否匹配
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
}; 