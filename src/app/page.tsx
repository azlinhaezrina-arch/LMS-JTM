'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { LoginScreen } from '@/components/lms/login-screen'
import { AppShell } from '@/components/lms/app-shell'
import { ViewRouter } from '@/components/lms/view-router'
import { Loader2, GraduationCap } from 'lucide-react'

export default function Home() {
  const user = useStore((s) => s.user)
  const authLoading = useStore((s) => s.authLoading)
  const refreshUser = useStore((s) => s.refreshUser)
  const theme = useStore((s) => s.theme)

  React.useEffect(() => {
    refreshUser()
  }, [refreshUser])

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl glow-emerald animate-float">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Memuatkan LMS JTM...</span>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <AppShell>
      <ViewRouter />
    </AppShell>
  )
}
