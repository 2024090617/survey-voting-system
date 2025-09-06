'use client'
import { useState, useEffect } from 'react'

interface QROptions {
  text: string
  size: number
  backgroundColor: string
  foregroundColor: string
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  margin: number
  logoUrl?: string
  logoSize: number
}

export default function QRGeneratorPage() {
  const [options, setOptions] = useState<QROptions>({
    text: 'https://example.com',
    size: 300,
    backgroundColor: '#ffffff',
    foregroundColor: '#000000',
    errorCorrectionLevel: 'M',
    margin: 4,
    logoSize: 60
  })
  
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append('text', options.text)
      formData.append('size', options.size.toString())
      formData.append('backgroundColor', options.backgroundColor)
      formData.append('foregroundColor', options.foregroundColor)
      formData.append('errorCorrectionLevel', options.errorCorrectionLevel)
      formData.append('margin', options.margin.toString())
      formData.append('logoSize', options.logoSize.toString())
      
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setQrCodeUrl(url)
      } else {
        console.error('Failed to generate QR code')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    generateQRCode()
  }, [options.text, options.size, options.backgroundColor, options.foregroundColor, options.errorCorrectionLevel, options.margin, options.logoSize])

  useEffect(() => {
    if (logoFile) {
      generateQRCode()
    }
  }, [logoFile])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = 'qrcode.png'
      link.click()
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-gray-600">Create customizable QR codes with colors, logos, and advanced styling options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Control Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Text/URL to encode</label>
                <textarea
                  value={options.text}
                  onChange={(e) => setOptions({ ...options, text: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter text or URL to encode..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Size & Quality</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Size: {options.size}px</label>
                <input
                  type="range"
                  min="200"
                  max="800"
                  value={options.size}
                  onChange={(e) => setOptions({ ...options, size: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Error Correction Level</label>
                <select
                  value={options.errorCorrectionLevel}
                  onChange={(e) => setOptions({ ...options, errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H' })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="L">Low (~7%)</option>
                  <option value="M">Medium (~15%)</option>
                  <option value="Q">Quartile (~25%)</option>
                  <option value="H">High (~30%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Margin: {options.margin}</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={options.margin}
                  onChange={(e) => setOptions({ ...options, margin: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Colors</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Foreground Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={options.foregroundColor}
                      onChange={(e) => setOptions({ ...options, foregroundColor: e.target.value })}
                      className="w-12 h-10 border rounded"
                    />
                    <input
                      type="text"
                      value={options.foregroundColor}
                      onChange={(e) => setOptions({ ...options, foregroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={options.backgroundColor}
                      onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                      className="w-12 h-10 border rounded"
                    />
                    <input
                      type="text"
                      value={options.backgroundColor}
                      onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Logo/Image</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {logoFile && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {logoFile.name}</p>
                )}
              </div>
              
              {logoFile && (
                <div>
                  <label className="block text-sm font-medium mb-2">Logo Size: {options.logoSize}px</label>
                  <input
                    type="range"
                    min="20"
                    max="120"
                    value={options.logoSize}
                    onChange={(e) => setOptions({ ...options, logoSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="flex flex-col items-center space-y-4">
              {isGenerating ? (
                <div className="flex items-center justify-center w-64 h-64 border rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Generated QR Code"
                  className="border rounded-lg shadow-sm"
                  style={{ maxWidth: '400px', maxHeight: '400px' }}
                />
              ) : (
                <div className="flex items-center justify-center w-64 h-64 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">QR Code will appear here</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={generateQRCode}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Regenerate'}
                </button>
                
                <button
                  onClick={downloadQRCode}
                  disabled={!qrCodeUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">Tips for better QR codes:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use high contrast colors for better scanning</li>
              <li>• Higher error correction allows for more reliable scanning with logos</li>
              <li>• Keep logos small relative to the QR code size</li>
              <li>• Test your QR code with multiple scanning apps</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</a>
      </div>
    </main>
  )
}