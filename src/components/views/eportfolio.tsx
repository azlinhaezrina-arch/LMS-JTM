'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar, Pill, DynIcon, colorClasses, fmtDate, fmtNum } from '@/components/lms/primitives'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Award, FolderOpen, ShieldCheck, Trophy, Sparkles, BookOpen, Share2, Download,
  Calendar, MapPin, TrendingUp, Star, ExternalLink,
} from 'lucide-react'

export function EPortfolioView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.portfolio(user.id).then(({ portfolio }) => { setData(portfolio); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user.id])

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl glass" />)}</div>
  if (!data) return null
  const stats = data.stats

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header card */}
      <GlassCard strong className="p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <Avatar name={data.user.name} src={data.user.avatarUrl} size={88} />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ring-2 ring-background">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{data.user.name}</h1>
              <Pill color="emerald">{tr(`role_${data.user.role}` as any, lang)}</Pill>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {data.user.campus?.name}</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> {fmtNum(data.user.points)} {tr('points', lang)}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {lang === 'ms' ? 'Ahli sejak' : 'Member since'} {fmtDate(data.user.createdAt, lang)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="glass border-white/20" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/?portfolio=${user.id}`); toast.success(lang === 'ms' ? 'Pautan ePortfolio disalin' : 'ePortfolio link copied') }}>
              <Share2 className="w-4 h-4" /> {tr('share', lang)}
            </Button>
            <Button variant="outline" className="glass border-white/20" onClick={() => toast.success('Dieksport')}><Download className="w-4 h-4" /> {lang === 'ms' ? 'Eksport' : 'Export'}</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {[
            { label: tr('certificates', lang), value: stats.certificates, icon: <Award className="w-4 h-4" />, color: 'amber' },
            { label: tr('badge', lang), value: stats.badges, icon: <Trophy className="w-4 h-4" />, color: 'violet' },
            { label: tr('competencies', lang), value: stats.competencies, icon: <ShieldCheck className="w-4 h-4" />, color: 'emerald' },
            { label: tr('completed', lang), value: stats.coursesCompleted, icon: <BookOpen className="w-4 h-4" />, color: 'teal' },
            { label: tr('credits', lang), value: stats.totalCredits, icon: <TrendingUp className="w-4 h-4" />, color: 'rose' },
          ].map((s, i) => {
            const c = colorClasses(s.color)
            return (
              <div key={i} className="glass rounded-xl p-3 text-center">
                <div className={cn2(c.bg, c.text, 'w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1')}>{s.icon}</div>
                <div className="text-xl font-bold">{fmtNum(s.value)}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Certificates */}
        <GlassCard className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Award className="w-4 h-4 text-amber-500" /> {tr('certificates', lang)}</h2>
          {data.certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{tr('noData', lang)}</p>
          ) : (
            <div className="space-y-2">
              {data.certificates.map((cert: any) => (
                <button key={cert.id} onClick={() => setView('certificate', { id: cert.id })} className="w-full glass rounded-lg p-3 flex items-center gap-3 hover:scale-[1.01] transition text-left">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center"><Award className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{cert.course.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{cert.certNumber} · {cert.grade}</div>
                  </div>
                  <div className="text-right"><div className="text-sm font-bold text-emerald-500">{cert.score}%</div><div className="text-[10px] text-muted-foreground">{fmtDate(cert.issuedAt, lang)}</div></div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Badges */}
        <GlassCard className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-violet-500" /> {tr('badges', lang)}</h2>
          {data.badges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{tr('noData', lang)}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {data.badges.map((b: any) => {
                const c = colorClasses(b.color)
                return (
                  <div key={b.id} className="glass rounded-lg p-3 flex items-center gap-2">
                    <div className={cn2(c.bg, c.text, 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1', c.ring)}><DynIcon name={b.icon} className="w-4 h-4" /></div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{b.name}</div>
                      <div className="text-[9px] text-muted-foreground">{fmtDate(b.awardedAt, lang)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>

        {/* Competencies */}
        <GlassCard className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><ShieldCheck className="w-4 h-4 text-emerald-500" /> {tr('competencies', lang)}</h2>
          {data.competencies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{tr('noData', lang)}</p>
          ) : (
            <div className="space-y-2">
              {data.competencies.map((comp: any) => (
                <div key={comp.id} className="glass rounded-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-emerald-500">{comp.code}</div>
                    <div className="text-sm font-medium truncate">{comp.name}</div>
                  </div>
                  <Pill color="emerald">{comp.framework} L{comp.level}</Pill>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Completed courses */}
        <GlassCard className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><BookOpen className="w-4 h-4 text-teal-500" /> {tr('completed', lang)} {tr('modules', lang)}</h2>
          {data.completedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{tr('noData', lang)}</p>
          ) : (
            <div className="space-y-2">
              {data.completedCourses.map((e: any) => (
                <div key={e.id} className="glass rounded-lg p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center"><BookOpen className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.course.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{e.course.code} · {e.course.credits} {tr('credits', lang)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

// helper to avoid cn import collision risk
function cn2(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
