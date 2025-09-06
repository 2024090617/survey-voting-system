'use client'
import { useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      setToken(storedToken)
      fetchUser(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        // Token无效，清除本地存储
        localStorage.removeItem('authToken')
        setToken(null)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      localStorage.removeItem('authToken')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
  }

  return {
    user,
    loading,
    token,
    isAuthenticated: !!user && !!token,
    logout
  }
}