export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const poll = await prisma.poll.findFirst()
  if (!poll) return NextResponse.json({ poll: null, counts: [], total: 0 })
  const options = await prisma.pollOption.findMany({ where: { pollId: poll.id } })
  const counts = await Promise.all(options.map(async o => ({
    option_id: o.id, label: o.label, image_url: o.imageUrl, count: await prisma.vote.count({ where: { optionId: o.id } })
  })))
  const total = counts.reduce((s, r) => s + (r.count || 0), 0)
  return NextResponse.json({ poll, counts, total })
}