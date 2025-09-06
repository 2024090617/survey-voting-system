export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { isValidPetitionId } from '@/lib/utils'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  // 验证ID格式
  if (!isValidPetitionId(id)) {
    return NextResponse.json({ error: '无效的请愿书ID' }, { status: 400 })
  }
  
  try {
    const petition = await prisma.petition.findUnique({
      where: { 
        publicId: id,
        OR: [
          { activatedAt: null }, // 立即激活
          { activatedAt: { lte: new Date() } } // 已到激活时间
        ]
      },
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
      return NextResponse.json({ error: '请愿书不存在或暂未激活' }, { status: 404 })
    }
    
    return NextResponse.json({ petition, surveys: petition.surveys })
  } catch (error) {
    console.error('获取请愿书失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}