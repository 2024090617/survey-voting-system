import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ 
        error: '未登录' 
      }, { status: 401 })
    }
    
    // 获取最新的用户信息
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })
    
    if (!dbUser) {
      return NextResponse.json({ 
        error: '用户不存在' 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      user: dbUser
    })
    
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json({ 
      error: '获取用户信息失败' 
    }, { status: 500 })
  }
}
