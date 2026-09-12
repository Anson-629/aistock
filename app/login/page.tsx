'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, ArrowLeft, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleGoogleLogin = async () => {
    setErrorMsg('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google 登入失敗'
      setErrorMsg(message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-blue-950/20">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-neutral-300 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          回到首頁
        </button>

        <div className="mb-6 inline-flex rounded-2xl bg-blue-500/10 p-3 text-blue-400">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="text-3xl font-black tracking-tight">登入帳號</h1>
        <p className="mt-2 text-sm text-neutral-400">
          使用 Google 帳號快速登入，繼續使用 AI 股票研究與設定頁面。
        </p>

        {errorMsg && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Globe className="h-4 w-4" />
          {loading ? '導向 Google 登入中...' : '使用 Google 登入'}
        </button>

        <div className="mt-6 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-neutral-500">
          需要先在 Supabase 後台啟用 Google Provider，並設定 Redirect URL：
          <span className="mt-1 block break-all text-neutral-400">{typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}</span>
        </div>
      </div>
    </div>
  )
}
