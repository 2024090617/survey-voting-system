'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type PollOption = { id: string; label: string; imageUrl?: string | null }
type Poll = { id: string; title: string }

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
  const [poll, setPoll] = useState<Poll | null>(null)
  const [options, setOptions] = useState<PollOption[]>([])
  const [optionId, setOptionId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [open, setOpen] = useState(false)
  const [consented, setConsented] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const { canvasRef, dataUrl, setDataUrl } = useSignaturePad()

  const phoneLocked = typeof window !== 'undefined' && !!sessionStorage.getItem('votedPhone')

  useEffect(() => {
    fetch('/api/poll').then(r=>r.json()).then(d=>{ setPoll(d.poll); setOptions(d.options) })
  }, [])

  useEffect(() => {
    const c = typeof window !== 'undefined' && localStorage.getItem('consentAccepted') === '1'
    setConsented(!!c)
    if (!c) setConsentOpen(true)
  }, [])

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-[92%] max-w-xl rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div>请在下方签名</div>
              <button className="text-sm" onClick={()=>setOpen(false)}>关闭</button>
            </div>
            <div className="p-3">
              <div className="h-60">
                <canvas ref={canvasRef} className="w-full h-full border rounded" />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-3 border-t">
              <button className="px-3 py-2 border rounded" onClick={()=>setDataUrl('')}>清除</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>{ const c = canvasRef.current; if (c) setDataUrl(c.toDataURL('image/png')); setOpen(false); }}>保存签名</button>
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