'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type PollOption = { id: string; label: string; imageUrl?: string | null }
type Poll = { id: string; title: string }

const phoneOk = (p: string) => /^1[3-9]\d{9}$/.test(p)

function useSignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dataUrl, setDataUrl] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  
  const setupCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const DPR = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    // 设置canvas的实际像素尺寸
    canvas.width = rect.width * DPR
    canvas.height = rect.height * DPR
    
    // 设置canvas的显示尺寸
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    
    // 缩放绘图上下文以匹配设备像素比
    ctx.scale(DPR, DPR)
    
    // 设置绘图样式
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
  
  const getEventPos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const touch = (e as TouchEvent).touches?.[0]
    const clientX = touch ? touch.clientX : (e as MouseEvent).clientX
    const clientY = touch ? touch.clientY : (e as MouseEvent).clientY
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDrawing(true)
    const pos = getEventPos(e.nativeEvent)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    e.stopPropagation()
    
    const pos = getEventPos(e.nativeEvent)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }
  
  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDrawing(false)
  }
  
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    setDataUrl('')
  }
  
  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dataURL = canvas.toDataURL('image/png')
    setDataUrl(dataURL)
  }
  
  // 当canvas引用变化时重新设置
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // 延迟设置以确保DOM已渲染
    const timer = setTimeout(() => {
      setupCanvas()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [canvasRef.current])
  
  return { 
    canvasRef, 
    dataUrl, 
    setDataUrl, 
    clearCanvas, 
    saveSignature,
    startDrawing,
    draw,
    stopDrawing
  }
}

export default function Page() {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [options, setOptions] = useState<PollOption[]>([])
  const [optionId, setOptionId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [open, setOpen] = useState(false)
  const [consented, setConsented] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const { canvasRef, dataUrl, setDataUrl, clearCanvas, saveSignature, startDrawing, draw, stopDrawing } = useSignaturePad()

  const phoneLocked = typeof window !== 'undefined' && !!sessionStorage.getItem('votedPhone')

  useEffect(() => {
    fetch('/api/poll').then(r=>r.json()).then(d=>{ setPoll(d.poll); setOptions(d.options) })
  }, [])

  useEffect(() => {
    const c = typeof window !== 'undefined' && localStorage.getItem('consentAccepted') === '1'
    setConsented(!!c)
    if (!c) setConsentOpen(true)
  }, [])

  // 当签名模态框打开时阻止页面滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [open])

  const submit = async () => {
    if (phoneLocked) return alert('此设备已完成投票')
    if (!consented) return alert('请先阅读并同意免责声明')
    if (!optionId) return alert('请选择一个选项')
    if (!name.trim()) return alert('请输入姓名')
    if (!phoneOk(phone)) return alert('请输入合法手机号码')
    if (!dataUrl) return alert('请先完成签名')
    const res = await fetch('/api/vote', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ poll_id: poll?.id, option_id: optionId, name, phone, signatureDataUrl: dataUrl }) })
    const json = await res.json()
    if (!res.ok) return alert(json.error || '提交失败')
    sessionStorage.setItem('votedPhone', phone)
    alert('投票成功')
    location.href = '/results'
  }

  const disabledAll = phoneLocked || !consented

  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">{poll?.title || '暂无投票'}</h1>
      <div className="space-y-3">
        {options.map(o => (
          <label key={o.id} className="flex gap-3 p-3 border rounded-lg items-center">
            <input type="radio" name="option" value={o.id} disabled={disabledAll} onChange={()=>setOptionId(o.id)} />
            {o.imageUrl && (
              <Image src={o.imageUrl} alt={o.label} width={64} height={64} className="rounded-md border object-cover" />
            )}
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 my-4">
        <input className="border rounded px-3 py-2" placeholder="姓名" disabled={disabledAll} value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="手机号码" inputMode="numeric" disabled={disabledAll} value={phone} onChange={e=>setPhone(e.target.value)} />
      </div>
      <div className="my-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={disabledAll} onClick={()=>setOpen(true)}>点击签名</button>
        {dataUrl && <img src={dataUrl} alt="签名" className="mt-2 w-40 border rounded" />}
      </div>
      <button className="w-full py-3 bg-blue-600 text-white rounded disabled:opacity-50" disabled={disabledAll} onClick={submit}>提交投票</button>
      <div className="mt-4 text-center">
        <a href="/results" className="text-blue-600">查看结果</a>
      </div>

      {open && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ touchAction: 'none' }}
          onTouchMove={(e) => e.preventDefault()}
        >
          <div className="bg-white w-[92%] max-w-xl rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div>请在下方签名</div>
              <button className="text-sm" onClick={()=>setOpen(false)}>关闭</button>
            </div>
            <div className="p-3">
              <div className="h-60">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full border rounded cursor-crosshair touch-none select-none"
                  style={{ touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-3 border-t">
              <button className="px-3 py-2 border rounded" onClick={clearCanvas}>清除</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>{ saveSignature(); setOpen(false); }}>保存签名</button>
            </div>
          </div>
        </div>
      )}

      {consentOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-[92%] max-w-xl rounded-lg overflow-hidden">
            <div className="p-4 border-b text-lg font-medium">重要提示与同意</div>
            <div className="p-4 space-y-3 text-sm text-gray-700">
              <p>为实现投票统计与防重复等必要目的，系统将收集姓名、手机号码与手写签名图片，并在必要范围内处理与保存。</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>同一手机号码仅可投票一次；电子系统可能存在极端情况下的技术误差。</li>
                <li>提交即表示您同意前述数据用于统计与合规留存，并遵守法律法规与公序良俗。</li>
                <li>详情请阅读<a className="text-blue-600 underline ml-1" href="/disclaimer" target="_blank">《隐私与法律声明》</a>。</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <a href="/disclaimer" className="px-3 py-2 border rounded" target="_blank">查看详情</a>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>{ localStorage.setItem('consentAccepted','1'); setConsented(true); setConsentOpen(false); }}>我已阅读并同意</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}