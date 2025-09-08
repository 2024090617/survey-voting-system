import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createCanvas, loadImage } from 'canvas'

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
      
      return new Response(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Create canvas for combining QR code with logo
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Load and draw base QR code
    const qrImage = await loadImage(qrCodeDataUrl)
    ctx.drawImage(qrImage, 0, 0, size, size)

    // Load and process logo
    const logoBuffer = await logoFile.arrayBuffer()
    const logoImage = await loadImage(Buffer.from(logoBuffer))

    // Calculate logo position (center)
    const logoX = (size - logoSize) / 2
    const logoY = (size - logoSize) / 2

    // Create white background circle for logo (optional)
    const logoBackgroundSize = logoSize + 10
    const logoBackgroundX = (size - logoBackgroundSize) / 2
    const logoBackgroundY = (size - logoBackgroundSize) / 2

    ctx.fillStyle = backgroundColor
    ctx.beginPath()
    ctx.arc(
      logoBackgroundX + logoBackgroundSize / 2,
      logoBackgroundY + logoBackgroundSize / 2,
      logoBackgroundSize / 2,
      0,
      2 * Math.PI
    )
    ctx.fill()

    // Draw logo
    ctx.save()
    ctx.beginPath()
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, 2 * Math.PI)
    ctx.clip()
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)
    ctx.restore()

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png')

    return new Response(buffer as BodyInit, {
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