export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs'
import sharp from 'sharp'

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'signatures')
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'))
    if (files.length === 0) return new NextResponse('No signatures', { status: 404 })
    const thumb = 120
    const cols = Math.ceil(Math.sqrt(files.length))
    const rows = Math.ceil(files.length / cols)
    const composite: { input: Buffer; left: number; top: number }[] = []
    for (let i=0;i<files.length;i++){
      const row = Math.floor(i/cols)
      const col = i%cols
      const input = path.join(dir, files[i])
      const buf = await sharp(input).resize(thumb, thumb, { fit: 'contain', background: { r:255,g:255,b:255,alpha:1 } }).png().toBuffer()
      composite.push({ input: buf, left: col*thumb, top: row*thumb })
    }
    const out = await sharp({ create: { width: cols*thumb, height: rows*thumb, channels: 3, background: '#ffffff' } })
      .png()
      .composite(composite)
      .toBuffer()
    return new Response(new Uint8Array(out), { headers: { 'Content-Type': 'image/png' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}