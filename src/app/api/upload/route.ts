export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })
  const bytes = Buffer.from(await file.arrayBuffer())
  const dir = path.join(process.cwd(), 'public', 'uploads')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const name = `${Date.now()}-${Math.random().toString(16).slice(2)}-${file.name || 'image'}`
  const filePath = path.join(dir, name)
  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(filePath)
    out.on('error', reject)
    out.on('finish', () => resolve())
    out.write(bytes)
    out.end()
  })
  return NextResponse.json({ url: `/uploads/${name}` })
}