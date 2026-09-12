import { NextResponse } from 'next/server'
import { getTwseStockInfo, getRealtimeMarketOverview } from '@/lib/twse'
import { generateStockAnalysis, generateMarketOverviewAnalysis } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, symbol } = body

    // 1. 大盤動態分析
    if (type === 'market') {
      const { indices } = await getRealtimeMarketOverview()
      const analysis = await generateMarketOverviewAnalysis(indices)
      return NextResponse.json({ success: true, analysis })
    }

    // 2. 個股深度研報分析
    if (!symbol) {
      return NextResponse.json({ success: false, error: '缺少股票代號' }, { status: 400 })
    }

    const stock = await getTwseStockInfo(symbol)
    const analysis = await generateStockAnalysis(stock)

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('[API Analyze Error]:', error)
    return NextResponse.json({ success: false, error: 'AI 分析生成失敗，請稍後再試' }, { status: 500 })
  }
}
