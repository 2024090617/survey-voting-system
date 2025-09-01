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
  const { poll_id, option_id, name, phone, signatureDataUrl } = body as any
  if (!poll_id || !option_id || !name || !phone || !signatureDataUrl) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }
  const phoneOk = /^1[3-9]\d{9}$/.test(phone)
  if (!phoneOk) return NextResponse.json({ error: 'invalid phone' }, { status: 400 })

  const exists = await prisma.vote.findFirst({ where: { pollId: poll_id, phone } })
  if (exists) return NextResponse.json({ error: 'phone already voted' }, { status: 409 })

  const base64 = signatureDataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
  const buf = Buffer.from(base64, 'base64')
  const filename = `${randomUUID()}.png`
  const filePath = path.join(signaturesDir, filename)
  await sharp(buf).png().toFile(filePath)

  await prisma.vote.create({ data: { pollId: poll_id, optionId: option_id, name: String(name).trim(), phone, signaturePath: `/signatures/${filename}` } })
  return NextResponse.json({ ok: true })
}