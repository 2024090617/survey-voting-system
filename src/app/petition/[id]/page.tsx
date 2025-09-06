'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type Survey = { 
  id: string; 
  title: string; 
  questionType: 'single' | 'multiple';
  options: { id: string; label: string; order: number }[];
}
type Petition = { id: string; title: string; content: string; publicId: string }

const phoneOk = (p: string) => /^1[3-9]\d{9}$/.test(p)

function useSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dataUrl, setDataUrl] = useState('')
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  
  const setupCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return false
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    
    // Set canvas size to match the display size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    
    // Set white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Configure drawing style
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    return true
  }
  
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setDataUrl('')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    let drawing = false
    let lastX = 0
    let lastY = 0
    
    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      let clientX, clientY
      
      if (e.type.includes('touch')) {
        const touchEvent = e as TouchEvent
        clientX = touchEvent.touches[0]?.clientX || touchEvent.changedTouches[0]?.clientX || 0
        clientY = touchEvent.touches[0]?.clientY || touchEvent.changedTouches[0]?.clientY || 0
      } else {
        const mouseEvent = e as MouseEvent
        clientX = mouseEvent.clientX
        clientY = mouseEvent.clientY
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      }
    }
    
    const startDrawing = (e: MouseEvent | TouchEvent) => {
      if (!isCanvasReady) return
      
      drawing = true
      const coords = getCoordinates(e)
      lastX = coords.x
      lastY = coords.y
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      
      e.preventDefault()
    }
    
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing || !isCanvasReady) return
      
      const coords = getCoordinates(e)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      
      lastX = coords.x
      lastY = coords.y
      
      e.preventDefault()
    }
    
    const stopDrawing = (e: Event) => {
      if (!drawing) return
      drawing = false
      e.preventDefault()
    }
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseout', stopDrawing)
    
    // Touch events
    canvas.addEventListener('touchstart', startDrawing, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', stopDrawing, { passive: false })
    canvas.addEventListener('touchcancel', stopDrawing, { passive: false })
    
    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseout', stopDrawing)
      canvas.removeEventListener('touchstart', startDrawing)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDrawing)
      canvas.removeEventListener('touchcancel', stopDrawing)
    }
  }, [isCanvasReady])
  
  // Initialize canvas when modal opens
  const initializeCanvas = () => {
    // Small delay to ensure canvas is rendered
    setTimeout(() => {
      if (setupCanvas()) {
        setIsCanvasReady(true)
      }
    }, 100)
  }
  
  return { canvasRef, dataUrl, setDataUrl, clearCanvas, initializeCanvas }
}

export default function PetitionPage() {
  const params = useParams()
  const petitionId = params.id as string
  
  const [petition, setPetition] = useState<Petition | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [surveyResponses, setSurveyResponses] = useState<Record<string, string[]>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [open, setOpen] = useState(false)
  const [consented, setConsented] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { canvasRef, dataUrl, setDataUrl, clearCanvas, initializeCanvas } = useSignaturePad()

  const phoneLocked = typeof window !== 'undefined' && !!sessionStorage.getItem(`signedPhone_${petitionId}`)

  useEffect(() => {
    if (petitionId) {
      fetchPetition()
    }
  }, [petitionId])

  useEffect(() => {
    const c = typeof window !== 'undefined' && localStorage.getItem('consentAccepted') === '1'
    setConsented(!!c)
    if (!c && petition) setConsentOpen(true)
  }, [petition])

  const fetchPetition = async () => {
    try {
      const res = await fetch(`/api/petition/${petitionId}`)
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || '获取请愿书失败')
        return
      }
      
      setPetition(data.petition)
      setSurveys(data.surveys)
    } catch (error) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSurveyResponse = (surveyId: string, optionId: string, checked: boolean) => {
    const survey = surveys.find(s => s.id === surveyId)
    if (!survey) return

    setSurveyResponses(prev => {
      const current = prev[surveyId] || []
      
      if (survey.questionType === 'single') {
        // 单选：替换当前选择
        return { ...prev, [surveyId]: checked ? [optionId] : [] }
      } else {
        // 多选：添加或移除选项
        if (checked) {
          return { ...prev, [surveyId]: [...current, optionId] }
    } else {
          return { ...prev, [surveyId]: current.filter(id => id !== optionId) }
        }
      }
    })
  }

  const submit = async () => {
    if (phoneLocked) return alert('此设备已完成签名')
    if (!consented) return alert('请先阅读并同意免责声明')
    if (!name.trim()) return alert('请输入姓名')
    if (!phoneOk(phone)) return alert('请输入合法手机号码')
    if (!dataUrl) return alert('请先完成签名')

    // 验证必填的调查问卷
    for (const survey of surveys) {
      const responses = surveyResponses[survey.id] || []
      if (responses.length === 0) {
        return alert('请完成所有调查问卷')
      }
    }

    // 准备调查回答数据
    const formattedResponses = Object.entries(surveyResponses).map(([surveyId, optionIds]) => ({
      surveyId,
      optionIds
    })).filter(r => r.optionIds.length > 0)

    const res = await fetch('/api/vote', { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ 
        petition_id: petition?.id, 
        name, 
        phone, 
        signatureDataUrl: dataUrl,
        surveyResponses: formattedResponses
      }) 
    })
    const json = await res.json()
    if (!res.ok) return alert(json.error || '提交失败')
    sessionStorage.setItem(`signedPhone_${petitionId}`, phone)
    alert('签名成功')
    location.href = '/results'
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <a href="/" className="text-blue-600 hover:text-blue-800">返回首页</a>
        </div>
      </main>
    )
  }

  const disabledAll = phoneLocked || !consented

  return (
    <main className="max-w-2xl mx-auto p-4">
      {/* 请愿书标题 */}
      <h1 className="text-2xl font-bold mb-6">{petition?.title || '请愿书'}</h1>
      
      {/* 请愿书内容 */}
      {petition?.content && (
        <div className="prose prose-gray max-w-none mb-8 p-6 bg-gray-50 rounded-lg border">
          <div dangerouslySetInnerHTML={{ __html: petition.content }} />
        </div>
      )}

      {/* 调查问卷 */}
      {surveys.length > 0 && (
        <div className="space-y-6 mb-8">
          <h2 className="text-lg font-semibold">调查问卷</h2>
          {surveys.map(survey => (
            <div key={survey.id} className="p-4 border rounded-lg bg-white">
              <div className="mb-4">
                <div 
                  className="font-medium text-gray-900"
                  dangerouslySetInnerHTML={{ __html: survey.title }} 
                />
                <div className="text-sm text-gray-500 mt-1">
                  {survey.questionType === 'single' ? '单选题' : '多选题'}
                </div>
              </div>
              <div className="space-y-2">
                {survey.options.map(option => {
                  const isChecked = (surveyResponses[survey.id] || []).includes(option.id)
                  return (
                    <label key={option.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input 
                        type={survey.questionType === 'single' ? 'radio' : 'checkbox'}
                        name={survey.questionType === 'single' ? `survey_${survey.id}` : undefined}
                        checked={isChecked}
                        disabled={disabledAll}
                        onChange={(e) => handleSurveyResponse(survey.id, option.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="flex-1">{option.label}</span>
          </label>
                  )
                })}
              </div>
            </div>
        ))}
      </div>
      )}

      {/* 签名信息表单 */}
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold">签名信息</h2>
        <div className="grid grid-cols-2 gap-3">
          <input 
            className="border rounded px-3 py-2" 
            placeholder="姓名" 
            disabled={disabledAll} 
            value={name} 
            onChange={e=>setName(e.target.value)} 
          />
          <input 
            className="border rounded px-3 py-2" 
            placeholder="手机号码" 
            inputMode="numeric" 
            disabled={disabledAll} 
            value={phone} 
            onChange={e=>setPhone(e.target.value)} 
          />
      </div>
        <div>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700" 
            disabled={disabledAll} 
            onClick={()=>{setOpen(true); initializeCanvas();}}
          >
            点击签名
          </button>
        {dataUrl && <img src={dataUrl} alt="签名" className="mt-2 w-40 border rounded" />}
        </div>
      </div>

      {/* 提交按钮 */}
      <button 
        className="w-full py-3 bg-green-600 text-white rounded-lg disabled:opacity-50 hover:bg-green-700 font-medium" 
        disabled={disabledAll} 
        onClick={submit}
      >
        支持请愿书并提交签名
      </button>
      
      <div className="mt-4 flex justify-center gap-4">
        <a href="/results" className="text-blue-600 hover:text-blue-800">查看支持情况</a>
        <span className="text-gray-300">|</span>
        <a href="/" className="text-gray-600 hover:text-gray-800">返回首页</a>
      </div>

      {/* 签名弹窗 */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white w-[92%] max-w-xl rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div>请在下方签名</div>
              <button className="text-sm hover:text-gray-600" onClick={()=>setOpen(false)}>关闭</button>
            </div>
            <div className="p-3">
              <div className="h-60">
                <canvas ref={canvasRef} className="w-full h-full border rounded" />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-3 border-t">
              <button 
                className="px-3 py-2 border rounded hover:bg-gray-50" 
                onClick={clearCanvas}
              >
                清除
              </button>
              <button 
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
                onClick={()=>{ const c = canvasRef.current; if (c) setDataUrl(c.toDataURL('image/png')); setOpen(false); }}
              >
                保存签名
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 免责声明弹窗 */}
      {consentOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-[92%] max-w-xl rounded-lg overflow-hidden">
            <div className="p-4 border-b text-lg font-medium">重要提示与同意</div>
            <div className="p-4 space-y-3 text-sm text-gray-700">
              <p>为实现请愿书签名统计与防重复等必要目的，系统将收集姓名、手机号码与手写签名图片，并在必要范围内处理与保存。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>同一手机号码仅可签名一次；电子系统可能存在极端情况下的技术误差。</li>
                <li>提交即表示您同意前述数据用于统计与合规留存，并遵守法律法规与公序良俗。</li>
                <li>详情请阅读<a className="text-blue-600 underline ml-1" href="/disclaimer" target="_blank">《隐私与法律声明》</a>。</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <a href="/disclaimer" className="px-3 py-2 border rounded hover:bg-gray-50" target="_blank">查看详情</a>
              <button 
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
                onClick={()=>{ localStorage.setItem('consentAccepted','1'); setConsented(true); setConsentOpen(false); }}
              >
                我已阅读并同意
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
