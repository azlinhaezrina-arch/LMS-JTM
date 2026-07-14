'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, StatCard, fmtNum, fmtDate } from '@/components/lms/primitives'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts'
import {
  Users, BookOpen, Award, Activity, TrendingUp, Building2, Star, MapPin,
} from 'lucide-react'
import type { AnalyticsSummary } from '@/lib/types'

export function AnalyticsView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const [analytics, setAnalytics] = React.useState<AnalyticsSummary | null>(null)
  const [campuses, setCampuses] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      api.analytics(),
      user.role === 'super_admin' || user.role === 'auditor' ? api.campusAnalytics() : Promise.resolve({ campuses: [] }),
    ]).then(([a, c]) => { setAnalytics(a.analytics); setCampuses(c.campuses); setLoading(false) })
  }, [user.role])

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl glass" />)}</div>
  if (!analytics) return null
  const t = analytics.totals
  const isHQ = user.role === 'super_admin' || user.role === 'auditor'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tr('analytics', lang)}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isHQ ? (lang === 'ms' ? 'Pandangan menyeluruh 33 kampus ADTEC' : 'Helicopter view across 33 ADTEC campuses') : (lang === 'ms' ? `Analitik untuk ${user.campus?.name}` : `Analytics for ${user.campus?.name}`)}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label={tr('totalUsers', lang)} value={fmtNum(t.users)} sub={`${t.activeLearners} aktif 7 hari`} color="emerald" trend={{ value: 12, positive: true }} />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label={tr('totalCourses', lang)} value={fmtNum(t.courses)} color="teal" />
        <StatCard icon={<Activity className="w-5 h-5" />} label={tr('totalEnrollments', lang)} value={fmtNum(t.enrollments)} sub={`${t.completionRate}% selesai`} color="amber" />
        <StatCard icon={<Award className="w-5 h-5" />} label={tr('totalCertificates', lang)} value={fmtNum(t.certificates)} sub={`${tr('avgScore', lang)}: ${t.avgScore}`} color="violet" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="glass">
          <TabsTrigger value="overview">{lang === 'ms' ? 'Gambaran' : 'Overview'}</TabsTrigger>
          {isHQ && <TabsTrigger value="campuses">{tr('crossCampusCompare', lang)}</TabsTrigger>}
          <TabsTrigger value="courses">{tr('topCourses', lang)}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Trend */}
            <GlassCard className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-emerald-500" /> {tr('enrollmentsTrend', lang)}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={analytics.enrollmentsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                  <XAxis dataKey="label" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'rgba(20,30,28,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 3 }} activeDot={{ r: 5 }} name={tr('totalEnrollments', lang)} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Status pie */}
            <GlassCard className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-amber-500" /> {tr('statusBreakdown', lang)}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={analytics.statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {analytics.statusBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(20,30,28,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Category distribution */}
            <GlassCard className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><BookOpen className="w-4 h-4 text-teal-500" /> {tr('categoryDistribution', lang)}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics.categoryDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#888" fontSize={10} width={90} />
                  <Tooltip contentStyle={{ background: 'rgba(20,30,28,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {analytics.categoryDistribution.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Region performance */}
            <GlassCard className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-violet-500" /> {tr('regionPerformance', lang)}</h3>
              <div className="space-y-3">
                {analytics.regionPerformance.map((r) => (
                  <div key={r.region}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{r.region} <span className="text-muted-foreground">({r.campuses} kampus)</span></span>
                      <span className="text-muted-foreground">{r.completion}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 via-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${r.completion}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Completion by campus (top 8) */}
          <GlassCard className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4"><Building2 className="w-4 h-4 text-emerald-500" /> {tr('completionByCampus', lang)}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.completionByCampus.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                <XAxis dataKey="code" stroke="#888" fontSize={10} angle={-35} textAnchor="end" height={70} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: 'rgba(20,30,28,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                <Bar dataKey="rate" fill="#059669" radius={[6, 6, 0, 0]} name={`${tr('completionRate', lang)} %`} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </TabsContent>

        {isHQ && (
          <TabsContent value="campuses" className="mt-4">
            <GlassCard className="p-5 overflow-hidden">
              <h3 className="font-semibold mb-4">{tr('crossCampusCompare', lang)} ({campuses.length} kampus)</h3>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-white/10">
                      <th className="py-2 px-3">{tr('campus', lang)}</th>
                      <th className="py-2 px-3">{tr('region', lang)}</th>
                      <th className="py-2 px-3 text-right">{tr('totalUsers', lang)}</th>
                      <th className="py-2 px-3 text-right">{tr('totalCourses', lang)}</th>
                      <th className="py-2 px-3 text-right">{tr('totalEnrollments', lang)}</th>
                      <th className="py-2 px-3 text-right">{tr('completed', lang)}</th>
                      <th className="py-2 px-3 text-right">{tr('completionRate', lang)}</th>
                      <th className="py-2 px-3 text-right">{tr('certificates', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campuses.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-2.5 px-3"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground font-mono">{c.code}</div></td>
                        <td className="py-2.5 px-3"><span className="text-xs glass px-2 py-0.5 rounded-full">{c.region}</span></td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{fmtNum(c.users)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{fmtNum(c.courses)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{fmtNum(c.enrollments)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-emerald-500">{fmtNum(c.completed)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${c.completionRate}%` }} /></div>
                            <span className="tabular-nums font-medium w-8 text-right">{c.completionRate}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{fmtNum(c.certificates)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>
        )}

        <TabsContent value="courses" className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topCourses.map((c, i) => (
              <GlassCard key={c.id} className="p-4" hover>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center text-amber-500 font-bold shrink-0 ring-1 ring-amber-500/30">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2">{c.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {c.rating}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {fmtNum(c.enrolled)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
