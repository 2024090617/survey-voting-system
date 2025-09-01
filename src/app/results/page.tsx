export const dynamic = 'force-dynamic'

async function getResults() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/results`, { cache: 'no-store' })
  return res.json()
}

export default async function ResultsPage() {
  const { poll, counts, total } = await getResults()
  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">{poll?.title || '结果'}</h1>
      <div className="grid gap-3">
        {counts?.map((c: any) => (
          <div key={c.option_id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>{c.label}</div>
              <div>{c.count}</div>
            </div>
            <div className="h-2 bg-gray-100 rounded mt-2">
              <div className="h-2 bg-blue-600 rounded" style={{ width: `${total ? Math.round((c.count||0)/total*100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h2 className="font-medium mb-2">签名拼图</h2>
        <img src="/api/signatures/mosaic" alt="签名拼图" className="w-full border" />
      </div>
      <div className="mt-4 text-center print:hidden">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => window.print()}>打印</button>
      </div>
    </main>
  )
}