// Simple test script to verify QR generation functionality
const { createCanvas, loadImage } = require('canvas');
const QRCode = require('qrcode');

async function testQRGeneration() {
  try {
    console.log('🧪 Testing QR code generation with Canvas...');
    
    const text = 'https://example.com/test';
    const size = 300;
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    console.log('✅ QR code generated successfully');
    
    // Create canvas for combining QR code
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Load QR code image
    const qrImage = await loadImage(qrDataUrl);
    ctx.drawImage(qrImage, 0, 0, size, size);
    
    console.log('✅ QR code drawn to canvas successfully');
    
    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');
    console.log('✅ Canvas buffer generated:', buffer.length, 'bytes');
    
    console.log('🎉 All QR generation tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testQRGeneration();