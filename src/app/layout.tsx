import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '问卷投票', description: '单选投票+签名' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-amber-100 text-amber-900 text-sm">
          <div className="max-w-3xl mx-auto px-4 py-2 text-center">
            重要法务提示：为保障各方权益，请在投票前仔细阅读并同意
            <a href="/disclaimer" className="underline underline-offset-4 font-medium ml-1">《隐私与法律声明》</a>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}