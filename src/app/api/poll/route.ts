export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const poll = await prisma.poll.findFirst()
  if (!poll) return NextResponse.json({ poll: null, options: [] })
  const options = await prisma.pollOption.findMany({ where: { pollId: poll.id } })
  return NextResponse.json({ poll, options })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { title, options } = body as { title?: string; options?: { label: string; imageUrl?: string | null }[] }
  if (!title || !options || options.length < 2) {
    return NextResponse.json({ error: 'title and >=2 options required' }, { status: 400 })
  }
  // Reset single poll
  await prisma.vote.deleteMany()
  await prisma.pollOption.deleteMany()
  await prisma.poll.deleteMany()
  const poll = await prisma.poll.create({ data: { title } })
  for (const o of options) {
    await prisma.pollOption.create({ data: { label: o.label, imageUrl: o.imageUrl, pollId: poll.id } })
  }
  return NextResponse.json({ ok: true, id: poll.id })
}