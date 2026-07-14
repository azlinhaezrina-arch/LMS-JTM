'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, StatCard, ProgressRing, Avatar, Pill, DynIcon, colorClasses, fmtNum, fmtDate, timeAgo } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, BookOpen, Award, TrendingUp, Flame, Sparkles, ArrowRight,
  Bot, Trophy, ShieldCheck, Activity, Clock, CheckCircle2, Zap,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalyticsSummary, Enrollment, LeaderboardEntry } from '@/lib/types'

export function DashboardView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const [analytics, setAnalytics] = React.useState<AnalyticsSummary | null>(null)
  const [enrolments, setEnrolments] = React.useState<Enrollment[]>([])
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    Promise.all([
      api.analytics().catch(() => null),
      user.role === 'pelajar' || user.role === 'pengajar' ? api.enrolments().catch(() => ({ enrollments: [] })) : Promise.resolve({ enrollments: [] }),
      api.leaderboard('campus').catch(() => ({ leaderboard: [] })),
    ]).then(([a, e, l]) => {
      if (!active) return
      if (a) setAnalytics(a.analytics)
      if (e) setEnrolments(e.enrollments)
      if (l) setLeaderboard(l.leaderboard)
      setLoading(false)
    })
    return () => { active = false }
  }, [user.role])

  const t = analytics?.totals
  const isLearner = user.role === 'pelajar' || user.role === 'pengajar'
  const activeEnrolments = enrolments.filter((e) => e.status === 'active')
  const completedEnrolments = enrolments.filter((e) => e.status === 'completed')
  const myRank = leaderboard.findIndex((l) => l.userId === user.id)

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <GlassCard strong className="p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-3xl" />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500" /> {user.streak} {tr('streak', lang)}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> {fmtNum(user.points)} {tr('points', lang)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {tr('welcomeBack', lang)}, <span className="text-gradient">{user.name.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
              {lang === 'ms'
                ? `Anda logged in sebagai ${tr(`role_${user.role}` as any, lang)} di ${user.campus?.name || 'JTM HQ'}.`
                : `You're signed in as ${tr(`role_${user.role}` as any, lang)} at ${user.campus?.name || 'JTM HQ'}.`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setView('ai')} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
              <Bot className="w-4 h-4" /> {tr('aiAssistant', lang)}
            </Button>
            {isLearner && (
              <Button variant="outline" onClick={() => setView('catalog')} className="glass border-white/20">
                <BookOpen className="w-4 h-4" /> {tr('catalog', lang)}
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Stats grid — role aware */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl glass" />)
        ) : isLearner ? (
          <>
            <StatCard icon={<BookOpen className="w-5 h-5" />} label={tr('myLearning', lang)} value={fmtNum(activeEnrolments.length)} sub={`${completedEnrolments.length} ${tr('completed', lang).toLowerCase()}`} color="emerald" />
            <StatCard icon={<Award className="w-5 h-5" />} label={tr('certificates', lang)} value={fmtNum(completedEnrolments.length)} color="amber" />
            <StatCard icon={<Sparkles className="w-5 h-5" />} label={tr('points', lang)} value={fmtNum(user.points)} sub={`${user.streak} ${tr('streak', lang).toLowerCase()}`} color="teal" />
            <StatCard icon={<Trophy className="w-5 h-5" />} label={tr('rank', lang)} value={myRank >= 0 ? `#${myRank + 1}` : '—'} sub={user.campus?.code} color="violet" />
          </>
        ) : (
          <>
            <StatCard icon={<Users className="w-5 h-5" />} label={tr('totalUsers', lang)} value={fmtNum(t?.users || 0)} sub={`${t?.activeLearners || 0} aktif`} color="emerald" />
            <StatCard icon={<BookOpen className="w-5 h-5" />} label={tr('totalCourses', lang)} value={fmtNum(t?.courses || 0)} color="teal" />
            <StatCard icon={<Activity className="w-5 h-5" />} label={tr('totalEnrollments', lang)} value={fmtNum(t?.enrollments || 0)} sub={`${t?.completionRate || 0}% selesai`} color="amber" />
            <StatCard icon={<Award className="w-5 h-5" />} label={tr('totalCertificates', lang)} value={fmtNum(t?.certificates || 0)} color="violet" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Continue learning / recent activity */}
        <div className="lg:col-span-2 space-y-6">
          {isLearner ? (
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-500" /> {tr('continueLearning', lang)}</h2>
                <button onClick={() => setView('myLearning')} className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
                  {tr('view', lang)} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {activeEnrolments.length === 0 ? (
                <EmptyState icon={<BookOpen className="w-8 h-8" />} text={lang === 'ms' ? 'Tiada kursus aktif. Daftar kursus sekarang!' : 'No active courses. Enroll now!'} action={() => setView('catalog')} actionLabel={tr('catalog', lang)} />
              ) : (
                <div className="space-y-3">
                  {activeEnrolments.slice(0, 3).map((e) => {
                    const c = colorClasses(e.course.coverColor)
                    return (
                      <button key={e.id} onClick={() => setView('course', { id: e.courseId })} className="w-full glass rounded-xl p-3 flex items-center gap-4 hover:scale-[1.01] hover:border-emerald-500/30 transition text-left">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1', c.bg, c.text, c.ring)}>
                          <DynIcon name={e.course.coverIcon} className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{e.course.title}</div>
                          <div className="text-xs text-muted-foreground">{e.course.code} · {e.course.campus?.code}</div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${e.progressPct}%` }} />
                          </div>
                        </div>
                        <ProgressRing value={e.progressPct} size={52} />
                      </button>
                    )
                  })}
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="p-5">
              <h2 className="font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-emerald-500" /> {tr('enrollmentsTrend', lang)}</h2>
              {analytics && <TrendChart data={analytics.enrollmentsTrend} />}
            </GlassCard>
          )}

          {/* Quick actions */}
          <GlassCard className="p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-amber-500" /> {tr('quickActions', lang)}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <BookOpen className="w-5 h-5" />, label: tr('catalog', lang), color: 'emerald', view: 'catalog' as const },
                { icon: <Bot className="w-5 h-5" />, label: tr('aiAssistant', lang), color: 'teal', view: 'ai' as const },
                { icon: <MessageSquare className="w-5 h-5" />, label: tr('forum', lang), color: 'amber', view: 'forum' as const },
                { icon: <ShieldCheck className="w-5 h-5" />, label: tr('competencies', lang), color: 'violet', view: 'competencies' as const },
              ].map((a, i) => {
                const c = colorClasses(a.color)
                return (
                  <button key={i} onClick={() => setView(a.view)} className="glass rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 hover:border-emerald-500/30 transition group">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center ring-1 group-hover:scale-110 transition', c.bg, c.text, c.ring)}>{a.icon}</div>
                    <span className="text-xs font-medium text-center">{a.label}</span>
                  </button>
                )
              })}
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* My progress (learner) */}
          {isLearner && (
            <GlassCard className="p-5">
              <h2 className="font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-emerald-500" /> {tr('yourProgress', lang)}</h2>
              <div className="flex items-center justify-center py-2">
                <ProgressRing value={activeEnrolments.length ? Math.round(activeEnrolments.reduce((s, e) => s + e.progressPct, 0) / activeEnrolments.length) : 0} size={120} stroke={10} label={tr('progress', lang)} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><div className="text-lg font-bold">{activeEnrolments.length}</div><div className="text-[10px] text-muted-foreground">{tr('inProgress', lang)}</div></div>
                <div><div className="text-lg font-bold">{completedEnrolments.length}</div><div className="text-[10px] text-muted-foreground">{tr('completed', lang)}</div></div>
                <div><div className="text-lg font-bold">{user.points}</div><div className="text-[10px] text-muted-foreground">{tr('points', lang)}</div></div>
              </div>
            </GlassCard>
          )}

          {/* Leaderboard preview */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> {tr('leaderboard', lang)}</h2>
              <button onClick={() => setView('leaderboard')} className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
                {tr('view', lang)} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((l, i) => (
                <div key={l.userId} className={cn('flex items-center gap-3 p-2 rounded-lg', l.isMe ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : '')}>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-amber-500/20 text-amber-500' : i === 1 ? 'bg-slate-400/20 text-slate-400' : i === 2 ? 'bg-orange-600/20 text-orange-600' : 'bg-muted text-muted-foreground')}>
                    {i + 1}
                  </div>
                  <Avatar name={l.name} size={30} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.name} {l.isMe && <span className="text-[10px] text-emerald-500">(Anda)</span>}</div>
                    <div className="text-[10px] text-muted-foreground">{l.campusCode}</div>
                  </div>
                  <div className="text-xs font-semibold text-amber-500 flex items-center gap-0.5"><Sparkles className="w-3 h-3" />{fmtNum(l.points)}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Completion by region (admin) */}
          {!isLearner && analytics && (
            <GlassCard className="p-5">
              <h2 className="font-semibold flex items-center gap-2 mb-4"><ShieldCheck className="w-4 h-4 text-violet-500" /> {tr('regionPerformance', lang)}</h2>
              <div className="space-y-2.5">
                {analytics.regionPerformance.slice(0, 5).map((r) => (
                  <div key={r.region}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{r.region} <span className="text-muted-foreground">({r.campuses})</span></span>
                      <span className="text-muted-foreground">{r.completion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full" style={{ width: `${r.completion}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, text, action, actionLabel }: { icon: React.ReactNode; text: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-muted-foreground mb-3">{icon}</div>
      <p className="text-sm text-muted-foreground mb-3">{text}</p>
      {action && actionLabel && (
        <Button onClick={action} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  )
}

function TrendChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end justify-between gap-2 h-40 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition">{d.value}</div>
          <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500/40 to-teal-500 hover:from-emerald-500/60 hover:to-teal-400 transition-all relative overflow-hidden" style={{ height: `${(d.value / max) * 100}%`, minHeight: '4px' }}>
            <div className="absolute inset-0 shimmer opacity-30" />
          </div>
          <div className="text-[10px] text-muted-foreground">{d.label}</div>
        </div>
      ))}
    </div>
  )
}
