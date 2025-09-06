import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(1, '请输入姓名')
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 验证输入数据
    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ 
        error: parseResult.error.errors[0].message 
      }, { status: 400 })
    }
    
    const { email, password, name } = parseResult.data
    
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ 
        error: '该邮箱已注册' 
      }, { status: 400 })
    }
    
    // 创建用户
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })
    
    // 生成token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name
    })
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
    
  } catch (error) {
    console.error('注册错误:', error)
    return NextResponse.json({ 
      error: '注册失败，请稍后重试' 
    }, { status: 500 })
  }
}
