'use client'
import { useEffect, useRef, useState } from 'react'

type Survey = { 
  id: string; 
  title: string; 
  questionType: 'single' | 'multiple';
  options: { id: string; label: string; order: number }[];
}
type Petition = { id: string; title: string; content: string }

const phoneOk = (p: string) => /^1[3-9]\d{9}$/.test(p)

function useSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dataUrl, setDataUrl] = useState('')
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const DPR = window.devicePixelRatio || 1
    function setup() {
      const c = canvasRef.current
      if (!c) return
      const rect = c.getBoundingClientRect()
      c.width = Math.max(1, rect.width * DPR)
      c.height = Math.max(1, 240 * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0,0,Math.max(1, rect.width),240)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    setup()
    let drawing = false
    let last: {x:number,y:number} | null = null
    const pos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const t = (e as TouchEvent).touches?.[0]
      const x = (t? t.clientX : (e as MouseEvent).clientX) - rect.left
      const y = (t? t.clientY : (e as MouseEvent).clientY) - rect.top
      return { x, y }
    }
    const start = (e: any) => { drawing = true; last = pos(e) }
    const move = (e: any) => {
      if (!drawing || !last) return
      const p = pos(e)
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p
      e.preventDefault()
    }
    const end = () => { drawing = false; last = null }
    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end)
    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [])
  return { canvasRef, dataUrl, setDataUrl }
}

export default function Page() {
  const [petition, setPetition] = useState<Petition | null>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [surveyResponses, setSurveyResponses] = useState<Record<string, string[]>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [open, setOpen] = useState(false)
  const [consented, setConsented] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const { canvasRef, dataUrl, setDataUrl } = useSignaturePad()

  const phoneLocked = typeof window !== 'undefined' && !!sessionStorage.getItem('signedPhone')

  useEffect(() => {
    fetch('/api/poll').then(r=>r.json()).then(d=>{ setPetition(d.petition); setSurveys(d.surveys) })
  }, [])

  useEffect(() => {
    const c = typeof window !== 'undefined' && localStorage.getItem('consentAccepted') === '1'
    setConsented(!!c)
    if (!c) setConsentOpen(true)
  }, [])

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
    sessionStorage.setItem('signedPhone', phone)
    alert('签名成功')
    location.href = '/results'
  }

  const disabledAll = phoneLocked || !consented

  return (
    <main className="max-w-2xl mx-auto p-4">
      {/* 请愿书标题 */}
      <h1 className="text-2xl font-bold mb-6">{petition?.title || '暂无请愿书'}</h1>
      
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
            onClick={()=>setOpen(true)}
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
      
      <div className="mt-4 text-center">
        <a href="/results" className="text-blue-600 hover:text-blue-800">查看支持情况</a>
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
                onClick={()=>setDataUrl('')}
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