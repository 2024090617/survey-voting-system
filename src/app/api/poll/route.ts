export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  const petition = await prisma.petition.findFirst({
    where: {
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
  if (!petition) return NextResponse.json({ petition: null, surveys: [] })
  return NextResponse.json({ petition, surveys: petition.surveys })
}

export async function POST(req: Request) {
  // 验证用户身份
  const user = getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await req.json()
  const { title, content, surveys, activatedAt } = body as { 
    title?: string; 
    content?: string;
    surveys?: { title: string; questionType: 'single' | 'multiple'; options: { label: string; }[] }[]
    activatedAt?: string | null
  }
  
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content required' }, { status: 400 })
  }

  // Reset existing data
  await prisma.surveyResponse.deleteMany()
  await prisma.signature.deleteMany()
  await prisma.surveyOption.deleteMany()
  await prisma.survey.deleteMany()
  await prisma.petition.deleteMany()

  // Create new petition
  const petition = await prisma.petition.create({ 
    data: { 
      title, 
      content, 
      creatorId: user.userId,
      activatedAt: activatedAt ? new Date(activatedAt) : null
    } 
  })

  // Create surveys if provided
  if (surveys && surveys.length > 0) {
    for (let i = 0; i < surveys.length; i++) {
      const survey = surveys[i]
      const createdSurvey = await prisma.survey.create({
        data: {
          title: survey.title,
          questionType: survey.questionType,
          order: i,
          petitionId: petition.id
        }
      })

      // Create survey options
      for (let j = 0; j < survey.options.length; j++) {
        await prisma.surveyOption.create({
          data: {
            label: survey.options[j].label,
            order: j,
            surveyId: createdSurvey.id
          }
        })
      }
    }
  }

  return NextResponse.json({ ok: true, id: petition.id })
}