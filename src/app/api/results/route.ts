export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const petition = await prisma.petition.findFirst({
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
  
  if (!petition) return NextResponse.json({ petition: null, totalSignatures: 0, surveyResults: [] })
  
  const totalSignatures = await prisma.signature.count({ where: { petitionId: petition.id } })
  
  const surveyResults = await Promise.all(petition.surveys.map(async survey => {
    const optionCounts = await Promise.all(survey.options.map(async option => ({
      optionId: option.id,
      label: option.label,
      count: await prisma.surveyResponse.count({ 
        where: { 
          optionId: option.id,
          surveyId: survey.id 
        } 
      })
    })))
    
    return {
      surveyId: survey.id,
      title: survey.title,
      questionType: survey.questionType,
      options: optionCounts,
      totalResponses: optionCounts.reduce((sum, opt) => sum + opt.count, 0)
    }
  }))
  
  return NextResponse.json({ 
    petition: {
      id: petition.id,
      title: petition.title,
      content: petition.content,
      createdAt: petition.createdAt
    }, 
    totalSignatures,
    surveyResults 
  })
}