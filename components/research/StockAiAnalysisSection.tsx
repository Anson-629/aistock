'use client'

import { useState } from 'react'
import { TwseStockData } from '@/lib/twse'
import { StockAiAnalysis } from '@/lib/gemini'
import { Sparkles, Bot, Loader2, RefreshCw } from 'lucide-react'

export default function StockAiAnalysisSection({ stock }: { stock: TwseStockData }) {
  const [analysis, setAnalysis] = useState<StockAiAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stock', symbol: stock.symbol }),
      })
      const data = await res.json()

      if (data.success) {
        setAnalysis(data.analysis)
      } else {
        setError(data.error || '無法取得生成式 AI 整理結果')
      }
    } catch (err) {
      setError('網路請求失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* 頂部控制列：評分與觸發按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 apple-card p-6 rounded-3xl border border-blue-500/20 bg-blue-500/[0.02]">
        <div>
          <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
            <Bot className="w-4 h-4" /> 生成式 AI 整理
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">生成式 AI 整理與多維度評價</h2>
          <p className="text-neutral-400 text-xs mt-1">
            點擊右側按鈕即可運用生成式 AI 整理最新 TWSE 行情與深度推論。
          </p>
        </div>

        {/* 按鈕與 AI 評分區塊 */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {analysis && (
            <div className="text-right border-r border-white/10 pr-4">
              <div className="text-[10px] font-bold text-blue-400 uppercase">生成式 AI 評分</div>
              <div className="text-2xl font-black text-white">
                {analysis.aiScore} <span className="text-xs font-normal text-neutral-500">/ 100</span>
              </div>
            </div>
          )}

          <button
            onClick={handleFetchAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>生成式 AI 整理中...</span>
              </>
            ) : analysis ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>重新整理</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>生成式 AI 整理</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 尚未生成時的預設提示區 */}
      {!analysis && !loading && !error && (
        <div className="apple-card rounded-3xl p-12 text-center space-y-3 border-dashed border-white/10">
          <Sparkles className="w-8 h-8 text-blue-400 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-white">尚未生成生成式 AI 整理結果</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            為了節省 API 額度並加速頁面載入，請點擊上方按鈕，即刻讓生成式 AI 整理 {stock.name} ({stock.symbol}) 的最新市場訊息與判斷。
          </p>
        </div>
      )}

      {/* 生成後的 AI 研報內容 */}
      {analysis && (
        <div className="space-y-6">
          <div className="apple-card rounded-3xl p-8 space-y-6">
            <p className="text-sm font-medium text-neutral-200 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              {analysis.summary}
            </p>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold text-emerald-400 uppercase px-2.5 py-0.5 bg-emerald-500/10 rounded-full inline-block">
                  Positive Factors
                </span>
                <ul className="text-xs text-neutral-300 space-y-2 leading-relaxed">
                  {analysis.positives.map((p, i) => <li key={i}>• {p}</li>)}
                </ul>
              </div>

              <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold text-neutral-400 uppercase px-2.5 py-0.5 bg-white/10 rounded-full inline-block">
                  Valuation Status
                </span>
                <ul className="text-xs text-neutral-300 space-y-2 leading-relaxed">
                  {analysis.valuationStatus.map((v, i) => <li key={i}>• {v}</li>)}
                </ul>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold text-amber-400 uppercase px-2.5 py-0.5 bg-amber-500/10 rounded-full inline-block">
                  Risk Points
                </span>
                <ul className="text-xs text-neutral-300 space-y-2 leading-relaxed">
                  {analysis.risks.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* 證據鏈系統 */}
          <div className="apple-card rounded-3xl p-8 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">生成式 AI 整理證據鏈驗證 (Zero Hallucination)</h3>
            <div className="space-y-3 text-xs text-neutral-300">
              <p>• <strong className="text-white">產業觀點：</strong>{analysis.peerInsight}</p>
              <p>• <strong className="text-white">數據證明：</strong>{analysis.evidenceSummary}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
