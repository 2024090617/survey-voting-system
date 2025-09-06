import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'

export interface JWTPayload {
  userId: string
  email: string
  name: string
}

// 生成JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 验证JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// 加密密码
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// 从请求中获取用户信息
export function getUserFromRequest(request: Request): JWTPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  return verifyToken(token)
}