'use client'

import * as React from 'react'
import { useStore, DEMO_ACCOUNTS } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { GlassCard, Avatar, colorClasses } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  GraduationCap, Shield, Users, BookOpen, Award, ArrowRight,
  Sparkles, Building2, Globe, Lock, Loader2, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoginScreen() {
  const login = useStore((s) => s.login)
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleLogin = async (em?: string) => {
    const target = (em || email).trim()
    if (!target) { toast.error('Sila masukkan emel'); return }
    setLoading(true)
    try {
      await login(target)
      toast.success('Log masuk berjaya')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Log masuk gagal')
    } finally {
      setLoading(false)
    }
  }

  const roleIcon: Record<string, React.ReactNode> = {
    super_admin: <Shield className="w-4 h-4" />,
    admin_kampus: <Building2 className="w-4 h-4" />,
    pengajar: <Users className="w-4 h-4" />,
    pelajar: <GraduationCap className="w-4 h-4" />,
    auditor: <Lock className="w-4 h-4" />,
  }
  const roleColor: Record<string, string> = {
    super_admin: 'violet', admin_kampus: 'teal', pengajar: 'emerald', pelajar: 'amber', auditor: 'rose',
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg glow-emerald">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight text-gradient">LMS JTM</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{tr('orgShort', lang)} · TVET Malaysia</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'ms' ? 'en' : 'ms')}
            className="glass rounded-lg px-3 py-1.5 text-xs font-medium hover:scale-105 transition flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" /> {lang === 'ms' ? 'BM' : 'EN'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left — pitch */}
          <div className="space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-muted-foreground">{lang === 'ms' ? 'Platform TVET Kebangsaan · 33 Kampus ADTEC' : 'National TVET Platform · 33 ADTEC Campuses'}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              <span className="text-gradient">{lang === 'ms' ? 'Memperkasakan' : 'Empowering'}</span>
              <br />
              {lang === 'ms' ? 'Tenaga Kerja Mahir Malaysia' : 'Malaysia\'s Skilled Workforce'}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
              {lang === 'ms'
                ? 'Platform pembelajaran digital bersepadu untuk 33 kampus ADTEC di bawah Jabatan Tenaga Manusia — latihan TVET yang berkualiti, konsisten dan boleh disahkan dengan sijil digital QR.'
                : 'Integrated digital learning platform for 33 ADTEC campuses under the Department of Manpower — quality, consistent and verifiable TVET training with QR digital certificates.'}
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { icon: <Building2 className="w-5 h-5" />, label: lang === 'ms' ? '33 Kampus' : '33 Campuses', color: 'teal' },
                { icon: <BookOpen className="w-5 h-5" />, label: lang === 'ms' ? '26+ Kursus' : '26+ Courses', color: 'emerald' },
                { icon: <Award className="w-5 h-5" />, label: lang === 'ms' ? 'Sijil QR' : 'QR Certificates', color: 'amber' },
              ].map((f, i) => {
                const c = colorClasses(f.color)
                return (
                  <div key={i} className="glass rounded-xl p-3 flex flex-col items-center gap-1.5 text-center">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', c.bg, c.text)}>{f.icon}</div>
                    <div className="text-xs font-medium">{f.label}</div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {['SSO MyDigital ID', 'Multi-Tenant', 'RBAC', 'AI Tutor', 'SKM/NOSS', 'Gamifikasi'].map((tag) => (
                <span key={tag} className="glass rounded-full px-3 py-1 text-[11px] text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>

          {/* Right — login card */}
          <GlassCard strong className="p-6 sm:p-8 animate-scale-in">
            <div className="space-y-1.5 mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                {tr('ssoLogin', lang)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === 'ms' ? 'Pilih akaun demo di bawah untuk teruskan sebagai peranan berbeza.' : 'Pick a demo account below to continue as different roles.'}
              </p>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleLogin() }}
              className="flex gap-2 mb-5"
            >
              <Input
                type="email"
                placeholder={tr('email', lang)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass border-white/20 bg-white/5"
              />
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {tr('selectDemo', lang)}
              </div>
              {DEMO_ACCOUNTS.map((acc) => {
                const c = colorClasses(roleColor[acc.role])
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleLogin(acc.email)}
                    disabled={loading}
                    className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left hover:scale-[1.02] hover:border-emerald-500/40 transition-all group disabled:opacity-50"
                  >
                    <Avatar name={acc.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{acc.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{acc.desc}</div>
                    </div>
                    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium', c.bg, c.text)}>
                      {roleIcon[acc.role]}
                      {tr(`role_${acc.role}` as any, lang)}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
                  </button>
                )
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {lang === 'ms' ? 'Pematuhan PDPA · Keselamatan Siber Kebangsaan' : 'PDPA Compliant · National Cyber Security'}
            </div>
          </GlassCard>
        </div>
      </main>

      <footer className="px-4 sm:px-8 py-5 text-center text-xs text-muted-foreground">
        © 2026 {tr('org', lang)} · {tr('footerNote', lang)} · {tr('poweredBy', lang)} Z.ai GLM
      </footer>
    </div>
  )
}
