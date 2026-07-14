'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar, Pill, fmtDateTime, fmtDate } from '@/components/lms/primitives'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Users, FileText, Search, Activity, Settings, Lock, ScrollText, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const [tab, setTab] = React.useState('users')
  const [users, setUsers] = React.useState<any[]>([])
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    Promise.all([
      api.adminUsers().catch(() => ({ users: [] })),
      api.auditLogs().catch(() => ({ logs: [] })),
    ]).then(([u, l]) => { setUsers(u.users); setLogs(l.logs); setLoading(false) })
  }, [])

  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  const roleColor: Record<string, string> = { super_admin: 'violet', admin_kampus: 'teal', pengajar: 'emerald', pelajar: 'amber', auditor: 'rose' }
  const actionColor: Record<string, string> = { 'user.login': 'emerald', 'user.logout': 'teal', 'course.publish': 'amber', 'certificate.issue': 'amber', 'enrollment.create': 'emerald', 'badge.award': 'violet' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Settings className="w-6 h-6 text-violet-500" /> {tr('admin', lang)}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {tr('rbac', lang)} · {user.role === 'super_admin' ? tr('multiTenant', lang) : user.campus?.name}
        </p>
      </div>

      {/* Access info banner */}
      <GlassCard className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-500 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
        <div className="flex-1">
          <div className="text-sm font-medium">{lang === 'ms' ? 'Akses Pentadbiran' : 'Administrative Access'}</div>
          <div className="text-xs text-muted-foreground">
            {user.role === 'super_admin'
              ? (lang === 'ms' ? 'Anda mempunyai akses penuh merentas semua 33 kampus ADTEC.' : 'You have full access across all 33 ADTEC campuses.')
              : (lang === 'ms' ? `Akses anda terhad kepada kampus ${user.campus?.name}.` : `Your access is limited to ${user.campus?.name}.`)}
          </div>
        </div>
        <Pill color="violet">{tr(`role_${user.role}` as any, lang)}</Pill>
      </GlassCard>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass">
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" /> {tr('userManagement', lang)} ({users.length})</TabsTrigger>
          <TabsTrigger value="audit"><ScrollText className="w-4 h-4 mr-1.5" /> {tr('auditLog', lang)} ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <GlassCard className="p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr('search', lang)} className="glass bg-white/5 pl-10" />
            </div>
          </GlassCard>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl glass" />)}</div>
          ) : (
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-white/10">
                      <th className="py-2.5 px-3">{lang === 'ms' ? 'Pengguna' : 'User'}</th>
                      <th className="py-2.5 px-3">{tr('level', lang)}</th>
                      <th className="py-2.5 px-3">{tr('campus', lang)}</th>
                      <th className="py-2.5 px-3 text-right">{tr('points', lang)}</th>
                      <th className="py-2.5 px-3">{tr('lastSignIn', lang)}</th>
                      <th className="py-2.5 px-3">{tr('status', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 50).map((u) => {
                      const c = roleColor[u.role] || 'amber'
                      return (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.name} size={32} />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{u.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3"><Pill color={c}>{tr(`role_${u.role}` as any, lang)}</Pill></td>
                          <td className="py-2.5 px-3"><span className="text-xs font-mono">{u.campus?.code || '—'}</span></td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-medium">{u.points}</td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{u.lastSignInAt ? fmtDateTime(u.lastSignInAt, lang) : '—'}</td>
                          <td className="py-2.5 px-3">
                            <span className={cn('inline-flex items-center gap-1 text-xs', u.status === 'active' ? 'text-emerald-500' : 'text-rose-500')}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500')} />
                              {u.status === 'active' ? tr('active', lang) : tr('suspended', lang)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl glass" />)}</div>
          ) : (
            <GlassCard className="overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="font-semibold text-sm">{tr('auditLog', lang)}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{logs.length} {lang === 'ms' ? 'rekod' : 'records'}</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto scrollbar-thin divide-y divide-white/5">
                {logs.map((l) => {
                  const c = actionColor[l.action] || 'teal'
                  return (
                    <div key={l.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', `bg-${c}-500/15 text-${c}-500`)}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium">{l.action}</span>
                          {l.entity && <span className="text-[10px] text-muted-foreground">{l.entity}:{l.entityId?.slice(-6)}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {l.user && <span>{l.user.name}</span>}
                          {l.campus && <span className="flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />{l.campus.code}</span>}
                          <span>·</span>
                          <span>{fmtDateTime(l.createdAt, lang)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
