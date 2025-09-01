'use client'
import { useState } from 'react'

type Opt = { label: string; imageUrl?: string | null }

export default function AdminPage() {
  const [title, setTitle] = useState('投票标题')
  const [options, setOptions] = useState<Opt[]>([{ label: '选项A' }, { label: '选项B' }])
  const [busy, setBusy] = useState(false)

  const addOption = () => setOptions(p => [...p, { label: '' }])
  const setLabel = (i: number, v: string) => setOptions(p => p.map((o, idx) => idx===i? { ...o, label: v } : o))
  const setImage = async (i: number, file: File | null) => {
    if (!file) return
    const fd = new FormData(); fd.append('image', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (res.ok) setOptions(p => p.map((o, idx) => idx===i? { ...o, imageUrl: json.url } : o))
    else alert(json.error || '上传失败')
  }
  const submit = async () => {
    if (!title.trim()) return alert('请输入标题')
    const opts = options.filter(o => o.label.trim())
    if (opts.length < 2) return alert('至少两个选项')
    setBusy(true)
    const res = await fetch('/api/poll', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, options: opts }) })
    setBusy(false)
    const json = await res.json()
    if (!res.ok) return alert(json.error || '创建失败')
    alert('创建成功')
  }

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">创建投票</h1>
      <input className="w-full border rounded px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} />
      <div className="space-y-3">
        {options.map((o, i) => (
          <div key={i} className="p-3 border rounded space-y-2">
            <input className="w-full border rounded px-3 py-2" placeholder={`选项${i+1}`} value={o.label} onChange={e=>setLabel(i, e.target.value)} />
            <div className="flex items-center gap-3">
              {o.imageUrl ? <img src={o.imageUrl} alt="opt" className="w-20 h-20 object-cover border rounded" /> : <div className="w-20 h-20 grid place-items-center border rounded text-gray-400">无图</div>}
              <input type="file" accept="image/*" onChange={e=>setImage(i, e.target.files?.[0] || null)} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button className="px-3 py-2 border rounded" onClick={addOption}>添加选项</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={busy} onClick={submit}>{busy? '提交中…':'提交'}</button>
      </div>
      <div className="text-sm text-gray-600">提示：创建新投票会清空旧投票及其投票数据</div>
    </main>
  )
}