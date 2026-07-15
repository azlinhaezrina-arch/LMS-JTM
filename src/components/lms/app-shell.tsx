'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import type { ViewKey } from '@/lib/store'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Avatar, colorClasses } from './primitives'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, BookOpen, GraduationCap, MessageSquare, Award,
  FolderOpen, BarChart3, Bot, Trophy, ShieldCheck, Settings,
  Bell, Search, Sun, Moon, Globe, LogOut, Menu, X, ChevronRight,
  Building2, Sparkles, CheckCheck,
} from 'lucide-react'
import { toast } from 'sonner'

interface NavItem { key: ViewKey; label: string; icon: React.ReactNode; roles?: Role[] }

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

function NavSection({ title, items, view, setView, onClose }: {
  title?: string; items: NavItem[]
  view: { key: string }; setView: (k: any, p?: Record<string, string>) => void; onClose: () => void
}) {
  return (
    <div className="space-y-1">
      {title && <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</div>}
      {items.map((item) => {
        const active = view.key === item.key || (item.key === 'catalog' && view.key === 'course') || (item.key === 'forum' && view.key === 'thread') || (item.key === 'certificates' && (view.key === 'certificate' || view.key === 'verify'))
        return (
          <button
            key={item.key}
            onClick={() => { setView(item.key); onClose() }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
              active
                ? 'glass-strong text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
            )}
          >
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-600" />}
            <span className={cn('transition-transform group-hover:scale-110', active && 'text-emerald-500')}>{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {active && <ChevronRight className="w-4 h-4" />}
          </button>
        )
      })}
    </div>
  )
}

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const user = useStore((s) => s.user)!
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const lang = useStore((s) => s.lang)

  const navMain: NavItem[] = [
    { key: 'dashboard', label: tr('dashboard', lang), icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { key: 'catalog', label: tr('catalog', lang), icon: <BookOpen className="w-[18px] h-[18px]" /> },
    { key: 'myLearning', label: tr('myLearning', lang), icon: <GraduationCap className="w-[18px] h-[18px]" />, roles: ['pelajar', 'pengajar'] },
    { key: 'forum', label: tr('forum', lang), icon: <MessageSquare className="w-[18px] h-[18px]" /> },
    { key: 'ai', label: tr('aiAssistant', lang), icon: <Bot className="w-[18px] h-[18px]" /> },
  ]
  const navAchieve: NavItem[] = [
    { key: 'certificates', label: tr('certificates', lang), icon: <Award className="w-[18px] h-[18px]" />, roles: ['pelajar', 'pengajar', 'auditor', 'super_admin'] },
    { key: 'eportfolio', label: tr('eportfolio', lang), icon: <FolderOpen className="w-[18px] h-[18px]" />, roles: ['pelajar', 'pengajar'] },
    { key: 'competencies', label: tr('competencies', lang), icon: <ShieldCheck className="w-[18px] h-[18px]" /> },
    { key: 'leaderboard', label: tr('leaderboard', lang), icon: <Trophy className="w-[18px] h-[18px]" /> },
  ]
  const navAdmin: NavItem[] = [
    { key: 'analytics', label: tr('analytics', lang), icon: <BarChart3 className="w-[18px] h-[18px]" />, roles: ['super_admin', 'admin_kampus', 'auditor', 'pengajar'] },
    { key: 'admin', label: tr('admin', lang), icon: <Settings className="w-[18px] h-[18px]" />, roles: ['super_admin', 'admin_kampus', 'auditor'] },
  ]

  const filter = (items: NavItem[]) => items.filter((i) => !i.roles || i.roles.includes(user.role))

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed lg:sticky top-0 z-50 lg:z-auto h-screen lg:h-screen w-[260px] shrink-0 glass-strong lg:glass border-r border-white/10 lg:border-r-0 flex flex-col transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Brand */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/95 flex items-center justify-center shadow-lg ring-1 ring-emerald-500/30 overflow-hidden shrink-0">
              <img src="/logo-jtm.jpeg" alt="Logo JTM" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight text-gradient">elearning JTM</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{tr('orgShort', lang)}</div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2">
          <NavSection items={filter(navMain)} view={view} setView={setView} onClose={onClose} />
          <NavSection title={lang === 'ms' ? 'Pencapaian' : 'Achievements'} items={filter(navAchieve)} view={view} setView={setView} onClose={onClose} />
          <NavSection title={lang === 'ms' ? 'Pengurusan' : 'Management'} items={filter(navAdmin)} view={view} setView={setView} onClose={onClose} />
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setView('eportfolio')}
            className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:scale-[1.02] transition"
          >
            <Avatar name={user.name} src={user.avatarUrl} size={38} />
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {user.campus?.code || 'JTM-HQ'}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> {user.points}
              </span>
              <span className="text-[9px] text-muted-foreground">{tr('points', lang)}</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const unread = useStore((s) => s.unreadCount)
  const notifOpen = useStore((s) => s.notifOpen)
  const setNotifOpen = useStore((s) => s.setNotifOpen)
  const logout = useStore((s) => s.logout)
  const notifications = useStore((s) => s.notifications)
  const markAllRead = useStore((s) => s.markAllRead)
  const setView = useStore((s) => s.setView)
  const [search, setSearch] = React.useState('')

  const roleColor: Record<string, string> = {
    super_admin: 'violet', admin_kampus: 'teal', pengajar: 'emerald', pelajar: 'amber', auditor: 'rose',
  }
  const c = colorClasses(roleColor[user.role])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      setView('catalog', { search: search.trim() })
      setSearch('')
    }
  }

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/10">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
        <button onClick={onMenu} className="lg:hidden text-muted-foreground"><Menu className="w-5 h-5" /></button>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${tr('search', lang)} ${tr('catalog', lang).toLowerCase()}...`}
              className="glass w-full rounded-xl pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>
        </form>

        <div className="flex-1 sm:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLang(lang === 'ms' ? 'en' : 'ms')}
            className="glass rounded-lg p-2 hover:scale-105 transition text-xs font-semibold"
            title={tr('language', lang)}
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTheme}
            className="glass rounded-lg p-2 hover:scale-105 transition"
            title={tr('themeToggle', lang)}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="glass rounded-lg p-2 hover:scale-105 transition relative"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse-soft">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="font-semibold text-sm">{tr('notifications', lang)}</span>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-emerald-500 hover:text-emerald-600 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> {tr('markAllRead', lang)}
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">{tr('noNotifications', lang)}</div>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { if (n.link) setView(n.link.replace('/', '') as ViewKey); setNotifOpen(false) }}
                          className={cn('w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition flex gap-3', !n.read && 'bg-emerald-500/5')}
                        >
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.read ? 'bg-transparent' : 'bg-emerald-500')} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{n.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Role badge */}
          <div className={cn('hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium glass', c.bg, c.text)}>
            {tr(`role_${user.role}` as any, lang)}
          </div>

          {/* Profile */}
          <button onClick={() => toast.info(lang === 'ms' ? 'Klik profil di sidebar untuk ePortfolio' : 'Click sidebar profile for ePortfolio')} className="flex items-center gap-2 glass rounded-xl pl-1 pr-3 py-1 hover:scale-105 transition">
            <Avatar name={user.name} src={user.avatarUrl} size={30} />
          </button>

          <button
            onClick={async () => { await logout(); toast.success(lang === 'ms' ? 'Log keluar berjaya' : 'Logged out') }}
            className="glass rounded-lg p-2 hover:scale-105 hover:text-rose-500 transition"
            title={tr('signOut', lang)}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const lang = useStore((s) => s.lang)
  return (
    <footer className="mt-auto glass border-t border-white/10 px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-white/95 flex items-center justify-center overflow-hidden ring-1 ring-emerald-500/30 shrink-0">
            <img src="/logo-jtm.jpeg" alt="JTM" className="w-full h-full object-contain" />
          </div>
          <span>© 2026 {tr('org', lang)} · {tr('footerNote', lang)}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> 33 ADTEC</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PDPA · NCS</span>
          <span>{tr('poweredBy', lang)} <span className="text-gradient font-semibold">Z.ai GLM</span></span>
        </div>
      </div>
    </footer>
  )
}
