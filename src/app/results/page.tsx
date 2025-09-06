export const dynamic = 'force-dynamic'

async function getResults() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/results`, { cache: 'no-store' })
  return res.json()
}

export default async function ResultsPage() {
  const { petition, totalSignatures, surveyResults } = await getResults()
  
  return (
    <main className="max-w-4xl mx-auto p-4 space-y-8">
      {/* 请愿书标题和支持人数 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{petition?.title || '请愿书支持情况'}</h1>
        <div className="text-3xl font-bold text-green-600 mb-2">{totalSignatures}</div>
        <div className="text-gray-600">人支持此请愿书</div>
        {petition?.createdAt && (
          <div className="text-sm text-gray-500 mt-2">
            发起时间：{new Date(petition.createdAt).toLocaleString('zh-CN')}
          </div>
        )}
      </div>

      {/* 请愿书内容 */}
      {petition?.content && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">请愿书内容</h2>
          <div 
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: petition.content }} 
          />
        </div>
      )}

      {/* 调查问卷结果 */}
      {surveyResults && surveyResults.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">调查问卷结果</h2>
          {surveyResults.map((survey: any, index: number) => (
            <div key={survey.surveyId} className="bg-white p-6 border rounded-lg">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">
                  问题 {index + 1}
                  <span className="ml-2 text-sm text-gray-500">
                    ({survey.questionType === 'single' ? '单选' : '多选'})
                  </span>
                </h3>
                <div 
                  className="text-gray-700 mb-2"
                  dangerouslySetInnerHTML={{ __html: survey.title }} 
                />
                <div className="text-sm text-gray-500">
                  共 {survey.totalResponses} 人参与回答
                </div>
              </div>
              
              <div className="space-y-3">
                {survey.options.map((option: any) => {
                  const percentage = survey.totalResponses > 0 
                    ? Math.round((option.count / survey.totalResponses) * 100) 
                    : 0
                  return (
                    <div key={option.optionId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{option.label}</span>
                        <div className="text-sm text-gray-600">
                          {option.count} 票 ({percentage}%)
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 签名拼图 */}
      <div className="bg-white p-6 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">签名拼图</h2>
        <img 
          src="/api/signatures/mosaic" 
          alt="签名拼图" 
          className="w-full border rounded-lg"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 justify-center print:hidden">
        <a 
          href="/" 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          支持此请愿书
        </a>
        <button 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" 
          onClick={() => window.print()}
        >
          打印结果
        </button>
      </div>

      {/* 打印样式 */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </main>
  )
}