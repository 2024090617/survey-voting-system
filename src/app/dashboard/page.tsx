'use client'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Petition {
  id: string
  publicId: string
  title: string
  content: string
  createdAt: string
  activatedAt: string | null
  _count: {
    signatures: number
  }
}

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth()
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [loadingPetitions, setLoadingPetitions] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchPetitions()
    }
  }, [isAuthenticated])

  const fetchPetitions = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch('/api/user/petitions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setPetitions(data.petitions)
      }
    } catch (error) {
      console.error('获取请愿书列表失败:', error)
    } finally {
      setLoadingPetitions(false)
    }
  }

  const deletePetition = async (publicId: string) => {
    if (!confirm('确定要删除这个请愿书吗？此操作不可撤销。')) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/petition/${publicId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        alert('请愿书已删除')
        fetchPetitions() // 重新获取列表
      } else {
        const data = await res.json()
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除请愿书失败:', error)
      alert('网络错误，请稍后重试')
    }
  }

  const copyPetitionUrl = (publicId: string) => {
    const url = `${window.location.origin}/petition/${publicId}`
    navigator.clipboard.writeText(url).then(() => {
      alert('请愿书链接已复制到剪贴板')
    })
  }

  if (loading || loadingPetitions) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null // 会被重定向
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
              <p className="text-gray-600 mt-1">欢迎，{user?.name}</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                创建请愿书
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('authToken')
                  router.push('/auth')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>

        {/* 请愿书列表 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">我的请愿书</h2>
            <p className="text-gray-600 mt-1">管理您创建的所有请愿书</p>
          </div>
          
          {petitions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-500 mb-4">您还没有创建任何请愿书</div>
              <a
                href="/admin"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                创建第一个请愿书
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      请愿书
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      签名数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {petitions.map((petition) => {
                    const isActivated = !petition.activatedAt || new Date(petition.activatedAt) <= new Date()
                    return (
                      <tr key={petition.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {petition.title}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              ID: {petition.publicId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {petition._count.signatures} 人
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isActivated 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isActivated ? '已激活' : '待激活'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(petition.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => copyPetitionUrl(petition.publicId)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              复制链接
                            </button>
                            <a
                              href={`/petition/${petition.publicId}`}
                              target="_blank"
                              className="text-green-600 hover:text-green-900"
                            >
                              查看
                            </a>
                            <a
                              href={`/edit-petition/${petition.publicId}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              编辑
                            </a>
                            <button
                              onClick={() => deletePetition(petition.publicId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-medium text-blue-900 mb-3">使用说明</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p>• 每个请愿书都有唯一的ID，可以通过链接分享给其他人</p>
            <p>• 已激活的请愿书可以接受签名，待激活的请愿书需要等到指定时间</p>
            <p>• 点击"复制链接"可以获取请愿书的分享链接</p>
            <p>• 删除请愿书将同时删除所有相关的签名和调查数据</p>
          </div>
        </div>
      </div>
    </main>
  )
}
