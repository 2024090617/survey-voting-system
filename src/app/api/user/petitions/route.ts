export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth'

const prisma = new PrismaClient()

// 获取用户的所有请愿书
export async function GET(request: Request) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const petitions = await prisma.petition.findMany({
      where: {
        creatorId: user.userId
      },
      include: {
        _count: {
          select: {
            signatures: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ petitions })
  } catch (error) {
    console.error('获取请愿书列表失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
