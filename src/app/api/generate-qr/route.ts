import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'

// Ensure Node.js runtime for sharp
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const text = formData.get('text') as string
    const size = parseInt(formData.get('size') as string) || 300
    const backgroundColor = formData.get('backgroundColor') as string || '#ffffff'
    const foregroundColor = formData.get('foregroundColor') as string || '#000000'
    const errorCorrectionLevel = formData.get('errorCorrectionLevel') as 'L' | 'M' | 'Q' | 'H' || 'M'
    const margin = parseInt(formData.get('margin') as string) || 4
    const logoSize = parseInt(formData.get('logoSize') as string) || 60
    const logoFile = formData.get('logo') as File | null

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Generate QR code options
    const qrOptions = {
      width: size,
      height: size,
      margin: margin,
      color: {
        dark: foregroundColor,
        light: backgroundColor,
      },
      errorCorrectionLevel: errorCorrectionLevel,
    }

    // Generate base QR code
    const qrCodeDataUrl = await QRCode.toDataURL(text, qrOptions)
    
    // If no logo, return the basic QR code
    if (!logoFile) {
      const base64Data = qrCodeDataUrl.split(',')[1]
  const buffer = Buffer.from(base64Data, 'base64')
  const body = new Uint8Array(buffer)
  return new Response(body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Compose using sharp (no native cairo/pixman needed)
    const baseQRBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')

    // Prepare base image from QR buffer
    let image = sharp(baseQRBuffer).resize(size, size)

    // Prepare logo as a circle with optional white background circle
    const rawLogo = Buffer.from(await logoFile.arrayBuffer())
    const resizedLogo = await sharp(rawLogo)
      .resize(logoSize, logoSize, { fit: 'cover' })
      .toBuffer()

    // Create circular mask SVG for the logo
    const r = Math.floor(logoSize / 2)
    const circleMaskSvg = Buffer.from(
      `<svg width="${logoSize}" height="${logoSize}">
         <circle cx="${r}" cy="${r}" r="${r}" fill="white" />
       </svg>`
    )
    const circularLogo = await sharp(resizedLogo)
      .composite([{ input: circleMaskSvg, blend: 'dest-in' }])
      .toBuffer()

    // Optional white background circle behind the logo for contrast
    const logoBackgroundSize = logoSize + 10
    const bgR = Math.floor(logoBackgroundSize / 2)
    const bgCircleSvg = Buffer.from(
      `<svg width="${logoBackgroundSize}" height="${logoBackgroundSize}">
         <circle cx="${bgR}" cy="${bgR}" r="${bgR}" fill="${backgroundColor}" />
       </svg>`
    )

    const composites: sharp.OverlayOptions[] = []

    // Center positions
    const bgLeft = Math.round((size - logoBackgroundSize) / 2)
    const bgTop = Math.round((size - logoBackgroundSize) / 2)
    const logoLeft = Math.round((size - logoSize) / 2)
    const logoTop = Math.round((size - logoSize) / 2)

    // Add background circle then the circular logo
    composites.push({ input: bgCircleSvg, left: bgLeft, top: bgTop })
    composites.push({ input: circularLogo, left: logoLeft, top: logoTop })

  const buffer = await image.composite(composites).png().toBuffer()
  const body = new Uint8Array(buffer)
  return new Response(body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}