'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'

import { DashboardView } from '@/components/views/dashboard'
import { CatalogView } from '@/components/views/catalog'
import { CourseDetailView } from '@/components/views/course-detail'
import { MyLearningView } from '@/components/views/my-learning'
import { ForumView } from '@/components/views/forum'
import { ThreadView } from '@/components/views/thread'
import { CertificatesView } from '@/components/views/certificates'
import { CertificateDetailView } from '@/components/views/certificate-detail'
import { VerifyView } from '@/components/views/verify'
import { EPortfolioView } from '@/components/views/eportfolio'
import { AnalyticsView } from '@/components/views/analytics'
import { AIAssistantView } from '@/components/views/ai-assistant'
import { LeaderboardView } from '@/components/views/leaderboard'
import { CompetenciesView } from '@/components/views/competencies'
import { AdminView } from '@/components/views/admin'

export function ViewRouter() {
  const view = useStore((s) => s.view)

  const node = React.useMemo(() => {
    switch (view.key) {
      case 'dashboard': return <DashboardView />
      case 'catalog': return <CatalogView />
      case 'course': return <CourseDetailView />
      case 'myLearning': return <MyLearningView />
      case 'forum': return <ForumView />
      case 'thread': return <ThreadView />
      case 'certificates': return <CertificatesView />
      case 'certificate': return <CertificateDetailView />
      case 'verify': return <VerifyView />
      case 'eportfolio': return <EPortfolioView />
      case 'analytics': return <AnalyticsView />
      case 'ai': return <AIAssistantView />
      case 'leaderboard': return <LeaderboardView />
      case 'competencies': return <CompetenciesView />
      case 'admin': return <AdminView />
      default: return <DashboardView />
    }
  }, [view.key, view.params])

  return <div key={view.key + JSON.stringify(view.params || {})} className="animate-fade-up">{node}</div>
}
