import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码')
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 验证输入数据
    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ 
        error: parseResult.error.errors[0].message 
      }, { status: 400 })
    }
    
    const { email, password } = parseResult.data
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      return NextResponse.json({ 
        error: '邮箱或密码错误' 
      }, { status: 400 })
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: '邮箱或密码错误' 
      }, { status: 400 })
    }
    
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
    console.error('登录错误:', error)
    return NextResponse.json({ 
      error: '登录失败，请稍后重试' 
    }, { status: 500 })
  }
}