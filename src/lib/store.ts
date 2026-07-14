'use client'

import { create } from 'zustand'
import type { SessionUser, Notification, Course } from './types'
import type { Lang } from './i18n'
import { api } from './api-client'

export type ViewKey =
  | 'dashboard' | 'catalog' | 'course' | 'myLearning'
  | 'forum' | 'thread' | 'certificates' | 'certificate' | 'verify'
  | 'eportfolio' | 'analytics' | 'ai' | 'leaderboard'
  | 'competencies' | 'admin'

export interface ViewState {
  key: ViewKey
  params?: Record<string, string>
}

interface AppState {
  // Auth
  user: SessionUser | null
  authLoading: boolean
  login: (email: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>

  // Navigation (client-side view router — single route)
  view: ViewState
  setView: (key: ViewKey, params?: Record<string, string>) => void

  // i18n
  lang: Lang
  setLang: (lang: Lang) => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // Notifications
  notifications: Notification[]
  unreadCount: number
  notifOpen: boolean
  setNotifOpen: (open: boolean) => void
  loadNotifications: () => Promise<void>
  markAllRead: () => Promise<void>

  // Cache (lightweight — avoids refetching on tab switches)
  coursesCache: Course[]
  setCoursesCache: (c: Course[]) => void

  // Toast helper (uses sonner via component)
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  authLoading: true,
  async login(email) {
    const { user } = await api.login(email)
    set({ user })
    // load notifications + set lang from preference
    if (user) {
      set({ lang: user.preferredLang })
      get().loadNotifications()
    }
  },
  async logout() {
    await api.logout()
    set({ user: null, view: { key: 'dashboard' }, notifications: [], unreadCount: 0 })
  },
  async refreshUser() {
    try {
      const { user } = await api.me()
      set({ user, authLoading: false })
      if (user) {
        set({ lang: user.preferredLang })
        get().loadNotifications()
      }
    } catch {
      // Not logged in (401) — show login screen
      set({ user: null, authLoading: false })
    }
  },

  view: { key: 'dashboard' },
  setView(key, params) {
    set({ view: { key, params } })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  },

  lang: 'ms',
  setLang(lang) { set({ lang }) },

  theme: 'dark',
  toggleTheme() {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: next })
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark')
    }
  },

  notifications: [],
  unreadCount: 0,
  notifOpen: false,
  setNotifOpen(open) { set({ notifOpen: open }) },
  async loadNotifications() {
    try {
      const { notifications, unread } = await api.notifications()
      set({ notifications, unreadCount: unread })
    } catch { /* ignore */ }
  },
  async markAllRead() {
    await api.markRead(undefined, true)
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },

  coursesCache: [],
  setCoursesCache(c) { set({ coursesCache: c }) },
}))

// Demo accounts for the login screen
export const DEMO_ACCOUNTS = [
  { email: 'super.admin@jtm.gov.my', role: 'super_admin' as const, name: 'Dato\' Dr. Haji Ramli', desc: 'Pentadbir Utama JTM (ibupejabat)' },
  { email: 'auditor.noraini@jtm.gov.my', role: 'auditor' as const, name: 'Puan Noraini', desc: 'Auditor Governan' },
  { email: 'admin.adtec-sa@jtm.gov.my', role: 'admin_kampus' as const, name: 'Pentadbir ADTEC Shah Alam', desc: 'Pentadbir Kampus' },
  { email: 'pengajar.1@adtec-sa.jtm.gov.my', role: 'pengajar' as const, name: 'Puan Zarina', desc: 'Pengajar / Jurulatih' },
  { email: 'pelajar.1@adtec-sa.jtm.gov.my', role: 'pelajar' as const, name: 'Amir (Pelajar)', desc: 'Peserta Latihan TVET' },
  { email: 'pelajar.4@adtec-pg.jtm.gov.my', role: 'pelajar' as const, name: 'Farah (Pelajar)', desc: 'Peserta Latihan ADTEC PG' },
]
