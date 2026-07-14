'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar, fmtNum } from '@/components/lms/primitives'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Flame, Sparkles, Award, Crown, Medal, BookOpen, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types'

export function LeaderboardView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const [scope, setScope] = React.useState<'campus' | 'global'>('campus')
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    api.leaderboard(scope).then(({ leaderboard }) => { setEntries(leaderboard); setLoading(false) })
  }, [scope])

  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)
  const myRank = entries.findIndex((e) => e.isMe)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" /> {tr('leaderboard', lang)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{lang === 'ms' ? 'Pelajar teratas berdasarkan mata gamifikasi' : 'Top learners by gamification points'}</p>
        </div>
        <div className="flex gap-1 glass rounded-xl p-1">
          {(['campus', 'global'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition', scope === s ? 'glass-strong text-emerald-500' : 'text-muted-foreground')}>
              {s === 'campus' ? (lang === 'ms' ? 'Kampus Saya' : 'My Campus') : (lang === 'ms' ? 'Global' : 'Global')}
            </button>
          ))}
        </div>
      </div>

      {/* My rank card */}
      {myRank >= 0 && (
        <GlassCard strong className="p-4 flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">#{myRank + 1}</div>
            <div className="text-[10px] text-muted-foreground">{tr('rank', lang)}</div>
          </div>
          <Avatar name={user.name} src={user.avatarUrl} size={44} />
          <div className="flex-1">
            <div className="font-semibold">{user.name} <span className="text-xs text-emerald-500">({lang === 'ms' ? 'Anda' : 'You'})</span></div>
            <div className="text-xs text-muted-foreground">{user.campus?.name}</div>
          </div>
          <div className="flex gap-4 text-center">
            <div><div className="font-bold text-amber-500 flex items-center gap-0.5 justify-center"><Sparkles className="w-3.5 h-3.5" />{fmtNum(user.points)}</div><div className="text-[10px] text-muted-foreground">{tr('points', lang)}</div></div>
            <div><div className="font-bold text-rose-500 flex items-center gap-0.5 justify-center"><Flame className="w-3.5 h-3.5" />{user.streak}</div><div className="text-[10px] text-muted-foreground">{tr('streak', lang)}</div></div>
          </div>
        </GlassCard>
      )}

      {/* Podium */}
      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl glass" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 0, 2].map((idx) => {
            const e = podium[idx]
            if (!e) return <div key={idx} />
            const styles = idx === 0
              ? { ring: 'ring-amber-500/40', bg: 'from-amber-500/20 to-amber-500/5', icon: <Crown className="w-5 h-5 text-amber-500" />, label: '🥇', size: 'sm:order-2 sm:-mt-4', h: 'h-48' }
              : idx === 1 ? { ring: 'ring-slate-400/40', bg: 'from-slate-400/20 to-slate-400/5', icon: <Medal className="w-5 h-5 text-slate-400" />, label: '🥈', size: 'sm:order-1', h: 'h-44' }
              : { ring: 'ring-orange-600/40', bg: 'from-orange-600/20 to-orange-600/5', icon: <Medal className="w-5 h-5 text-orange-600" />, label: '🥉', size: 'sm:order-3', h: 'h-40' }
            return (
              <GlassCard key={e.userId} strong className={cn('p-5 text-center relative overflow-hidden bg-gradient-to-b', styles.bg, styles.size, styles.h, 'flex flex-col justify-end')}>
                <div className={cn('absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center ring-2', styles.ring, 'glass-strong')}>
                  {styles.icon}
                </div>
                <div className="text-3xl mb-1">{styles.label}</div>
                <Avatar name={e.name} src={e.avatarUrl} size={56} />
                <div className="font-semibold text-sm mt-2 truncate">{e.name}</div>
                <div className="text-[10px] text-muted-foreground">{e.campusCode}</div>
                <div className="mt-2 text-xl font-bold text-amber-500 flex items-center justify-center gap-1"><Sparkles className="w-4 h-4" />{fmtNum(e.points)}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-2 mt-1">
                  <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />{e.coursesCompleted}</span>
                  <span className="flex items-center gap-0.5"><Award className="w-3 h-3" />{e.badges}</span>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      {/* Rest */}
      <GlassCard className="overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-sm">{lang === 'ms' ? 'Kedudukan Penuh' : 'Full Ranking'}</h3>
        </div>
        <div className="divide-y divide-white/5">
          {rest.map((e) => (
            <div key={e.userId} className={cn('flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition', e.isMe && 'bg-emerald-500/5')}>
              <div className="w-8 text-center font-bold text-muted-foreground tabular-nums">{e.rank}</div>
              <Avatar name={e.name} src={e.avatarUrl} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{e.name} {e.isMe && <span className="text-[10px] text-emerald-500">(Anda)</span>}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                  <span>{e.campusCode}</span>
                  <span className="flex items-center gap-0.5"><BookOpen className="w-2.5 h-2.5" />{e.coursesCompleted}</span>
                  <span className="flex items-center gap-0.5"><Award className="w-2.5 h-2.5" />{e.badges}</span>
                  <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />{e.streak}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-amber-500 flex items-center gap-0.5 justify-end"><Sparkles className="w-3.5 h-3.5" />{fmtNum(e.points)}</div>
                <div className="text-[10px] text-muted-foreground">{tr('points', lang)}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
