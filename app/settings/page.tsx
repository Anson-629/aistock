'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, Database, Globe, LogOut, MoonStar, RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveUserPreferences } from '@/lib/supabase/database'

type SettingsState = {
  marketColorMode: 'red-up-green-down' | 'green-up-red-down'
  autoRefresh: boolean
  aiSummary: boolean
  pushAlerts: boolean
  defaultSource: 'TWSE' | 'AI Insights'
}

const defaultSettings: SettingsState = {
  marketColorMode: 'red-up-green-down',
  autoRefresh: true,
  aiSummary: true,
  pushAlerts: false,
  defaultSource: 'TWSE',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [authError, setAuthError] = useState('')
  const hasSupabaseAuth = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(() => {
    const saved = localStorage.getItem('alpha-research-settings')
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) })
      } catch {
        setSettings(defaultSettings)
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!hasSupabaseAuth) return

    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [hasSupabaseAuth])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('alpha-research-settings', JSON.stringify(settings))
  }, [settings, mounted])

  useEffect(() => {
    if (!mounted || !session?.user?.id) return

    saveUserPreferences(session.user.id, settings).catch((err) => {
      console.error('同步使用者設定到 Supabase 失敗:', err)
    })
  }, [settings, session?.user?.id, mounted])

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const toggleRows = [
    {
      key: 'autoRefresh',
      title: '自動刷新行情',
      description: '每 5 分鐘自動更新大盤與焦點股資料',
      icon: RefreshCw,
    },
    {
      key: 'aiSummary',
      title: 'AI 智慧摘要',
      description: '在儀表板中顯示 OpenRouter 生成的市場觀點',
      icon: Sparkles,
    },
    {
      key: 'pushAlerts',
      title: '價格提醒通知',
      description: '當目標價或漲跌幅超過阈值時提醒您',
      icon: Bell,
    },
  ] as const

  const handleGoogleLogin = async () => {
    if (!hasSupabaseAuth) {
      setAuthError('尚未設定 Supabase 環境變數，請先填入 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }

    setAuthError('')

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
      setAuthError(err instanceof Error ? err.message : 'Google 登入失敗')
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '登出失敗')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">Preferences</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">設定中心</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-white/10"
          >
            回到儀表板
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-blue-950/20">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Account</p>
                <h2 className="text-lg font-bold">Google 帳號</h2>
              </div>
            </div>

            {session?.user ? (
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  已登入
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-neutral-200 transition hover:bg-white/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  登出
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-100"
              >
                <Globe className="h-3.5 w-3.5" />
                Google 登入
              </button>
            )}
          </div>

          {session?.user ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-100">
              <div className="font-semibold">登入帳號</div>
              <div className="mt-1 text-emerald-200/90">{session.user.email || 'Google 使用者'}</div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-neutral-300">
              目前尚未登入，點擊 Google 登入即可綁定帳號並啟用個人化設定。
            </div>
          )}

          {authError && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {authError}
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-blue-950/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/10 p-2 text-blue-400">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold">市場顏色設定</h2>
                <p className="text-xs text-neutral-400">依據台股慣例調整價格顯示方式</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => updateSetting('marketColorMode', 'red-up-green-down')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  settings.marketColorMode === 'red-up-green-down'
                    ? 'border-red-500/40 bg-red-500/10 text-red-300'
                    : 'border-white/10 bg-slate-950/60 text-neutral-300 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </span>
                  紅漲 / 綠跌
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => updateSetting('marketColorMode', 'green-up-red-down')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  settings.marketColorMode === 'green-up-red-down'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-slate-950/60 text-neutral-300 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                  </span>
                  綠漲 / 紅跌
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-violet-950/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-violet-500/10 p-2 text-violet-400">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold">資料來源</h2>
                <p className="text-xs text-neutral-400">設定預設行情與分析來源</p>
              </div>
            </div>

            <div className="space-y-3">
              {(['TWSE', 'AI Insights'] as const).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => updateSetting('defaultSource', source)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    settings.defaultSource === source
                      ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                      : 'border-white/10 bg-slate-950/60 text-neutral-300 hover:border-white/20'
                  }`}
                >
                  <span>{source}</span>
                  <span className="text-xs text-neutral-400">
                    {source === 'TWSE' ? '即時股價資料' : 'AI 分析摘要'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-400">
              <MoonStar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">個人化偏好</h2>
              <p className="text-xs text-neutral-400">控制 dashboard 與提醒行為</p>
            </div>
          </div>

          <div className="space-y-3">
            {toggleRows.map(({ key, title, description, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/5 p-2 text-neutral-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-xs text-neutral-400">{description}</div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={title}
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                    settings[key] ? 'border-blue-500/60 bg-blue-500/60' : 'border-white/15 bg-white/5'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition ${
                      settings[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Account Safety</span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-white">偏好設定已同步到本機</h3>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              已保存
            </div>
          </div>
          <p className="mt-3 text-sm text-emerald-100/80">
            本頁設定將保存在瀏覽器本地儲存空間，供下次開啟時直接套用。
          </p>
        </section>
      </div>
    </div>
  )
}
