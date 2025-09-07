'use client'
import { useAuth } from '@/hooks/useAuth'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// 动态导入 ReactQuill 以避免 SSR 问题
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

// 简化的横线处理函数
const insertHorizontalRule = () => {
  // 查找当前页面的Quill编辑器实例
  const quillElement = document.querySelector('.ql-container')
  if (quillElement && (quillElement as any).__quill) {
    const quill = (quillElement as any).__quill
    const range = quill.getSelection()
    if (range) {
      // 插入换行符和横线文本
      quill.insertText(range.index, '\n', 'user')
      quill.insertText(range.index + 1, '────────────────────────────────', 'user')
      quill.insertText(range.index + 33, '\n', 'user')
      quill.setSelection(range.index + 34, 0)
    }
  }
}

interface Petition {
  id: string
  publicId: string
  title: string
  content: string
  activatedAt: string | null
  surveys: any[]
}

export default function EditPetitionPage() {
  const { user, loading, isAuthenticated } = useAuth()
  const params = useParams()
  const router = useRouter()
  const petitionId = params.id as string
  
  const [petition, setPetition] = useState<Petition | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [activatedAt, setActivatedAt] = useState('')
  const [loadingPetition, setLoadingPetition] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    // 为横线按钮添加图标样式
    if (typeof document !== 'undefined') {
      const style = document.createElement('style')
      style.innerHTML = `
        .ql-hr:before {
          content: '─';
          font-weight: bold;
        }
        .ql-hr {
          width: 30px;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && petitionId) {
      fetchPetition()
    }
  }, [isAuthenticated, petitionId])


  const fetchPetition = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/petition/${petitionId}/edit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || '获取请愿书失败')
        return
      }
      
      const p = data.petition
      setPetition(p)
      setTitle(p.title)
      setContent(p.content)
      setActivatedAt(p.activatedAt ? new Date(p.activatedAt).toISOString().slice(0, 16) : '')
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoadingPetition(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('请输入标题')
      return
    }

    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/petition/${petitionId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          activatedAt: activatedAt || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '保存失败')
        return
      }

      alert('保存成功')
      router.push('/dashboard')
    } catch (error) {
      console.error('保存失败:', error)
      alert('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingPetition) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            返回个人中心
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 页面头部 */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">编辑请愿书</h1>
              <p className="text-gray-600 mt-1">ID: {petition?.publicId}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请愿书标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入请愿书标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请愿书内容 *
              </label>
              <ReactQuill
                value={content}
                onChange={setContent}
                className="bg-white"
                modules={{
                  toolbar: {
                    container: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      ['blockquote', 'code-block'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'align': [] }],
                      ['link'],
                      ['hr'],
                      ['clean']
                    ],
                    handlers: {
                      'hr': insertHorizontalRule
                    }
                  }
                }}
                style={{ height: '400px', marginBottom: '50px' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                激活时间
              </label>
              <input
                type="datetime-local"
                value={activatedAt}
                onChange={(e) => setActivatedAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                留空表示立即激活，设置时间表示在指定时间后激活
              </p>
            </div>
          </div>

          {/* 注意事项 */}
          {petition?.surveys && petition.surveys.length > 0 && (
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">注意事项</h3>
              <p className="text-sm text-yellow-700">
                此请愿书已包含 {petition.surveys.length} 个调查问卷。当前编辑功能仅支持修改请愿书基本信息，
                如需修改调查问卷，请联系管理员或重新创建请愿书。
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
