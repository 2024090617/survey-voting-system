import crypto from 'crypto'

/**
 * 生成请愿书的公共ID
 * 基于标题、内容和时间戳生成SHA256哈希的前12位作为公共ID
 */
export function generatePetitionPublicId(title: string, content: string): string {
  const timestamp = Date.now().toString()
  const data = `${title}${content}${timestamp}`
  const hash = crypto.createHash('sha256').update(data).digest('hex')
  return hash.substring(0, 12) // 取前12位，足够唯一且不会太长
}

/**
 * 验证公共ID格式
 */
export function isValidPetitionId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  // Support legacy 12-hex IDs
  const hex12 = /^[a-f0-9]{12}$/
  // Support Prisma cuid() publicId: starts with 'c' and is lower-case alphanumeric
  // Typical length ~25-26, but allow a safe range to avoid false negatives
  const cuidLike = /^c[a-z0-9]{10,35}$/
  return hex12.test(id) || cuidLike.test(id)
}
