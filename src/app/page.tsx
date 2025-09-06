'use client'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/auth')
      }
    }
  }, [loading, isAuthenticated, router])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div>加载中...</div>
      </div>
    </main>
  )
}