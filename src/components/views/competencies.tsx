'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Pill, ProgressRing, fmtDate } from '@/components/lms/primitives'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck, Award, BookOpen, CheckCircle2, Clock, Circle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CompetenciesView() {
  const lang = useStore((s) => s.lang)
  const [comps, setComps] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.competencies().then(({ competencies }) => { setComps(competencies); setLoading(false) })
  }, [])

  const achieved = comps.filter((c) => c.status === 'achieved')
  const inProgress = comps.filter((c) => c.status === 'in_progress')
  const notStarted = comps.filter((c) => c.status === 'not_started')
  const byFramework = {
    SKM: comps.filter((c) => c.framework === 'SKM'),
    NOSS: comps.filter((c) => c.framework === 'NOSS'),
  }

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl glass" />)}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-500" /> {tr('competencies', lang)}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{lang === 'ms' ? 'Penjejakan kompetensi berasaskan SKM/NOSS' : 'Competency tracking based on SKM/NOSS framework'}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <ProgressRing value={comps.length ? Math.round((achieved.length / comps.length) * 100) : 0} size={64} color="#059669" />
          <div><div className="text-2xl font-bold">{achieved.length}/{comps.length}</div><div className="text-xs text-muted-foreground">{tr('achieved', lang)}</div></div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          <div><div className="text-2xl font-bold">{inProgress.length}</div><div className="text-xs text-muted-foreground">{tr('inProgress', lang)}</div></div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center"><Award className="w-5 h-5" /></div>
          <div><div className="text-2xl font-bold">{byFramework.SKM.length}</div><div className="text-xs text-muted-foreground">SKM</div></div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
          <div><div className="text-2xl font-bold">{byFramework.NOSS.length}</div><div className="text-xs text-muted-foreground">NOSS</div></div>
        </GlassCard>
      </div>

      {/* Competency list */}
      <div className="space-y-3">
        {comps.map((c) => {
          const statusConfig = {
            achieved: { color: 'emerald', icon: <CheckCircle2 className="w-4 h-4" />, label: tr('achieved', lang) },
            in_progress: { color: 'amber', icon: <Clock className="w-4 h-4" />, label: tr('inProgressShort', lang) },
            not_started: { color: 'rose', icon: <Circle className="w-4 h-4" />, label: tr('notStarted', lang) },
          }[c.status as 'achieved' | 'in_progress' | 'not_started'] || { color: 'rose', icon: <Circle className="w-4 h-4" />, label: c.status }
          return (
            <GlassCard key={c.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1', `bg-${statusConfig.color}-500/15 text-${statusConfig.color}-500 ring-${statusConfig.color}-500/30`)}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-emerald-500">{c.code}</span>
                    <Pill color={c.framework === 'SKM' ? 'teal' : 'violet'}>{c.framework} Tahap {c.level}</Pill>
                    {c.sector && <Pill color="amber">{c.sector}</Pill>}
                    <Pill color={statusConfig.color} className="ml-auto flex items-center gap-1">{statusConfig.icon}{statusConfig.label}</Pill>
                  </div>
                  <h3 className="font-semibold text-sm mt-1.5">{c.name}</h3>
                  {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                  {c.status === 'achieved' && c.achievedAt && (
                    <div className="text-xs text-emerald-500 mt-2 flex items-center gap-1"><Award className="w-3 h-3" /> {lang === 'ms' ? 'Dicapai pada' : 'Achieved on'} {fmtDate(c.achievedAt, lang)}</div>
                  )}
                  {c.courses?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3" /> {c.courses.length} {tr('modules', lang).toLowerCase()} berkaitan
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
