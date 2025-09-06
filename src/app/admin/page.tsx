'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 动态导入富文本编辑器，避免SSR问题
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

type SurveyOption = { label: string }
type Survey = { 
  title: string; 
  questionType: 'single' | 'multiple'; 
  options: SurveyOption[] 
}

export default function AdminPage() {
  const [title, setTitle] = useState('请愿书标题')
  const [content, setContent] = useState('<p>请在此输入请愿书内容...</p>')
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [busy, setBusy] = useState(false)

  // 添加调查问卷
  const addSurvey = () => {
    setSurveys(prev => [...prev, {
      title: '调查问题标题',
      questionType: 'single',
      options: [{ label: '选项1' }, { label: '选项2' }]
    }])
  }

  // 删除调查问卷
  const removeSurvey = (index: number) => {
    setSurveys(prev => prev.filter((_, i) => i !== index))
  }

  // 更新调查问卷标题
  const updateSurveyTitle = (index: number, newTitle: string) => {
    setSurveys(prev => prev.map((s, i) => i === index ? { ...s, title: newTitle } : s))
  }

  // 更新调查问卷类型
  const updateSurveyType = (index: number, questionType: 'single' | 'multiple') => {
    setSurveys(prev => prev.map((s, i) => i === index ? { ...s, questionType } : s))
  }

  // 添加选项
  const addSurveyOption = (surveyIndex: number) => {
    setSurveys(prev => prev.map((s, i) => 
      i === surveyIndex 
        ? { ...s, options: [...s.options, { label: '' }] }
        : s
    ))
  }

  // 删除选项
  const removeSurveyOption = (surveyIndex: number, optionIndex: number) => {
    setSurveys(prev => prev.map((s, i) => 
      i === surveyIndex 
        ? { ...s, options: s.options.filter((_, j) => j !== optionIndex) }
        : s
    ))
  }

  // 更新选项标签
  const updateSurveyOptionLabel = (surveyIndex: number, optionIndex: number, label: string) => {
    setSurveys(prev => prev.map((s, i) => 
      i === surveyIndex 
        ? { ...s, options: s.options.map((o, j) => j === optionIndex ? { ...o, label } : o) }
        : s
    ))
  }

  const submit = async () => {
    if (!title.trim()) return alert('请输入标题')
    if (!content.trim()) return alert('请输入请愿书内容')
    
    // 验证调查问卷
    for (const survey of surveys) {
      if (!survey.title.trim()) return alert('所有调查问题都需要标题')
      const validOptions = survey.options.filter(o => o.label.trim())
      if (validOptions.length < 2) return alert('每个调查问题至少需要2个选项')
    }

    setBusy(true)
    const res = await fetch('/api/poll', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        title, 
        content, 
        surveys: surveys.map(s => ({
          ...s,
          options: s.options.filter(o => o.label.trim())
        }))
      }) 
    })
    setBusy(false)
    const json = await res.json()
    if (!res.ok) return alert(json.error || '创建失败')
    alert('创建成功')
  }

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">创建请愿书</h1>
      
      {/* 请愿书标题 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">请愿书标题</label>
        <input 
          className="w-full border rounded px-3 py-2" 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          placeholder="输入请愿书标题" 
        />
      </div>

      {/* 请愿书内容 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">请愿书内容</label>
        <div className="border rounded">
          <ReactQuill 
            value={content}
            onChange={setContent}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link'],
                ['clean']
              ]
            }}
            style={{ height: '200px', marginBottom: '42px' }}
          />
        </div>
      </div>

      {/* 调查问卷部分 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">调查问卷</h2>
          <button 
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={addSurvey}
          >
            添加调查问题
          </button>
        </div>

        {surveys.map((survey, surveyIndex) => (
          <div key={surveyIndex} className="p-4 border rounded-lg space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">问题 {surveyIndex + 1}</span>
              <button 
                className="text-red-600 hover:text-red-800"
                onClick={() => removeSurvey(surveyIndex)}
              >
                删除问题
              </button>
            </div>

            {/* 问题标题 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">问题标题</label>
              <div className="border rounded bg-white">
                <ReactQuill 
                  value={survey.title}
                  onChange={(value) => updateSurveyTitle(surveyIndex, value)}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'color': [] }],
                      ['clean']
                    ]
                  }}
                  style={{ height: '80px', marginBottom: '42px' }}
                />
              </div>
            </div>

            {/* 问题类型 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">答题类型</label>
              <select 
                value={survey.questionType} 
                onChange={e => updateSurveyType(surveyIndex, e.target.value as 'single' | 'multiple')}
                className="border rounded px-3 py-2"
              >
                <option value="single">单选</option>
                <option value="multiple">多选</option>
              </select>
            </div>

            {/* 选项列表 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">选项</label>
                <button 
                  className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => addSurveyOption(surveyIndex)}
                >
                  添加选项
                </button>
              </div>
              
              <div className="space-y-2">
                {survey.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <span className="w-8 text-sm text-gray-500">
                      {survey.questionType === 'single' ? '○' : '☐'}
                    </span>
                    <input 
                      className="flex-1 border rounded px-3 py-2" 
                      value={option.label}
                      onChange={e => updateSurveyOptionLabel(surveyIndex, optionIndex, e.target.value)}
                      placeholder={`选项 ${optionIndex + 1}`}
                    />
                    {survey.options.length > 2 && (
                      <button 
                        className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                        onClick={() => removeSurveyOption(surveyIndex, optionIndex)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {surveys.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>暂无调查问卷，点击"添加调查问题"开始创建</p>
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-3">
        <button 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700" 
          disabled={busy} 
          onClick={submit}
        >
          {busy ? '提交中…' : '发布请愿书'}
        </button>
      </div>

      <div className="text-sm text-gray-600">
        提示：创建新请愿书会清空现有的请愿书及其签名数据
      </div>
    </main>
  )
}