'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, DynIcon, colorClasses, ProgressRing, EmptyState, fmtDate } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Award, CheckCircle2, Clock, ArrowRight, TrendingUp, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Enrollment } from '@/lib/types'
import { toast } from 'sonner'

export function MyLearningView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const [tab, setTab] = React.useState<'active' | 'completed'>('active')
  const [enrolments, setEnrolments] = React.useState<Enrollment[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.enrolments().then(({ enrollments }) => { setEnrolments(enrollments); setLoading(false) })
      .catch(() => { toast.error('Gagal memuat'); setLoading(false) })
  }, [])

  const filtered = enrolments.filter((e) => tab === 'active' ? e.status === 'active' : e.status === 'completed')
  const totalProgress = enrolments.length ? Math.round(enrolments.reduce((s, e) => s + e.progressPct, 0) / enrolments.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tr('myLearning', lang)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{lang === 'ms' ? 'Jejak kemajuan pembelajaran anda' : 'Track your learning progress'}</p>
        </div>
        <div className="flex gap-2">
          <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
            <ProgressRing value={totalProgress} size={44} />
            <div>
              <div className="text-xs text-muted-foreground">{tr('yourProgress', lang)}</div>
              <div className="font-semibold text-sm">{totalProgress}%</div>
            </div>
          </div>
          <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-xs text-muted-foreground">{tr('points', lang)}</div>
              <div className="font-semibold text-sm">{user.points}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { k: 'active', label: tr('inProgress', lang), icon: <Clock className="w-4 h-4" /> },
          { k: 'completed', label: tr('completed', lang), icon: <CheckCircle2 className="w-4 h-4" /> },
        ] as const).map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition', tab === t.k ? 'glass-strong text-emerald-500 shadow-sm' : 'glass text-muted-foreground hover:text-foreground')}>
            {t.icon} {t.label}
            <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded-full">{enrolments.filter((e) => t.k === 'active' ? e.status === 'active' : e.status === 'completed').length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl glass" />)}</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12">
          <EmptyState icon={<BookOpen className="w-8 h-8" />} text={lang === 'ms' ? 'Tiada kursus di sini. Terokai katalog!' : 'No courses here. Explore the catalog!'} action={() => setView('catalog')} actionLabel={tr('catalog', lang)} />
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((e) => {
            const c = colorClasses(e.course.coverColor)
            return (
              <GlassCard key={e.id} hover className="overflow-hidden" onClick={() => setView('course', { id: e.courseId })}>
                <div className={cn('relative h-24 flex items-center justify-center', c.bg)}>
                  <DynIcon name={e.course.coverIcon} className={cn('w-12 h-12', c.text)} />
                  <div className="absolute top-2 right-2">
                    <ProgressRing value={e.progressPct} size={40} stroke={4} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-mono text-muted-foreground">{e.course.code}</div>
                  <h3 className="font-semibold text-sm leading-snug mt-0.5 line-clamp-2">{e.course.title}</h3>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${e.progressPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-muted-foreground">{e.course.campus?.code}</span>
                    {e.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-emerald-500 font-medium"><Award className="w-3.5 h-3.5" /> {e.finalScore}%</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500 font-medium"><Clock className="w-3.5 h-3.5" /> {e.progressPct}%</span>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="w-full mt-3 glass text-emerald-500 hover:bg-emerald-500/10">
                    {e.status === 'completed' ? tr('viewCertificate', lang) : tr('continue', lang)} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
