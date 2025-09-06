export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth'
import { isValidPetitionId } from '@/lib/utils'

const prisma = new PrismaClient()

// 获取请愿书详情用于编辑
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = params
  
  if (!isValidPetitionId(id)) {
    return NextResponse.json({ error: '无效的请愿书ID' }, { status: 400 })
  }

  try {
    const petition = await prisma.petition.findUnique({
      where: { publicId: id },
      include: {
        surveys: {
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!petition) {
      return NextResponse.json({ error: '请愿书不存在' }, { status: 404 })
    }

    if (petition.creatorId !== user.userId) {
      return NextResponse.json({ error: '无权限编辑此请愿书' }, { status: 403 })
    }

    return NextResponse.json({ petition })
  } catch (error) {
    console.error('获取请愿书详情失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新请愿书
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = params
  
  if (!isValidPetitionId(id)) {
    return NextResponse.json({ error: '无效的请愿书ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { title, content, activatedAt } = body as { 
      title?: string; 
      content?: string;
      activatedAt?: string | null
    }
    
    if (!title || !content) {
      return NextResponse.json({ error: 'title and content required' }, { status: 400 })
    }

    // 检查请愿书是否存在且属于当前用户
    const petition = await prisma.petition.findUnique({
      where: { publicId: id }
    })

    if (!petition) {
      return NextResponse.json({ error: '请愿书不存在' }, { status: 404 })
    }

    if (petition.creatorId !== user.userId) {
      return NextResponse.json({ error: '无权限编辑此请愿书' }, { status: 403 })
    }

    // 更新请愿书
    const updatedPetition = await prisma.petition.update({
      where: { publicId: id },
      data: {
        title,
        content,
        activatedAt: activatedAt ? new Date(activatedAt) : null
      }
    })

    return NextResponse.json({ petition: updatedPetition })
  } catch (error) {
    console.error('更新请愿书失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
