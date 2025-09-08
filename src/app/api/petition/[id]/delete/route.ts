export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth'
import { isValidPetitionId } from '@/lib/utils'

const prisma = new PrismaClient()

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { id } = params
  
  // 验证ID格式
  if (!isValidPetitionId(id)) {
    return NextResponse.json({ error: '无效的请愿书ID' }, { status: 400 })
  }

  try {
    // 检查请愿书是否存在且属于当前用户
    const petition = await prisma.petition.findUnique({
      where: { publicId: id }
    })

    if (!petition) {
      return NextResponse.json({ error: '请愿书不存在' }, { status: 404 })
    }

    if (petition.creatorId !== user.userId) {
      return NextResponse.json({ error: '无权限删除此请愿书' }, { status: 403 })
    }

    // 删除请愿书（级联删除相关数据）
    await prisma.petition.delete({
      where: { publicId: id }
    })

    return NextResponse.json({ message: '请愿书已删除' })
  } catch (error) {
    console.error('删除请愿书失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
