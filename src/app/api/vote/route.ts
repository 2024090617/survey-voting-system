export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'

const prisma = new PrismaClient()

const signaturesDir = path.join(process.cwd(), 'public', 'signatures')
if (!fs.existsSync(signaturesDir)) fs.mkdirSync(signaturesDir, { recursive: true })

export async function POST(req: Request) {
  const body = await req.json()
  const { petition_id, name, phone, signatureDataUrl, surveyResponses } = body as {
    petition_id: string;
    name: string;
    phone: string;
    signatureDataUrl: string;
    surveyResponses?: { surveyId: string; optionIds: string[] }[];
  }
  
  if (!petition_id || !name || !phone || !signatureDataUrl) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }
  
  const phoneOk = /^1[3-9]\d{9}$/.test(phone)
  if (!phoneOk) return NextResponse.json({ error: 'invalid phone' }, { status: 400 })

  // Check if phone already signed this petition
  const exists = await prisma.signature.findFirst({ where: { petitionId: petition_id, phone } })
  if (exists) return NextResponse.json({ error: 'phone already signed' }, { status: 409 })

  // Save signature image
  const base64 = signatureDataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
  const buf = Buffer.from(base64, 'base64')
  const filename = `${randomUUID()}.png`
  const filePath = path.join(signaturesDir, filename)
  await sharp(buf).png().toFile(filePath)

  // Create signature record
  const signature = await prisma.signature.create({ 
    data: { 
      petitionId: petition_id, 
      name: String(name).trim(), 
      phone, 
      signaturePath: `/signatures/${filename}` 
    } 
  })

  // Save survey responses if provided
  if (surveyResponses && surveyResponses.length > 0) {
    for (const response of surveyResponses) {
      for (const optionId of response.optionIds) {
        await prisma.surveyResponse.create({
          data: {
            signatureId: signature.id,
            surveyId: response.surveyId,
            optionId: optionId
          }
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}