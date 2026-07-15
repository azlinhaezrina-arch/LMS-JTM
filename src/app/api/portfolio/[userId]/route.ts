import { supabase, T } from '@/lib/supabase'
import { ok, fail } from '@/lib/api'

// Public ePortfolio — shareable profile
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const { data: user, error: uErr } = await supabase
    .from(T.User)
    .select('id, name, "avatarUrl", role, campusId, points, streak, "createdAt", campus:Campus(*)')
    .eq('id', userId)
    .single()
  if (uErr || !user) return fail('Portfolio tidak dijumpai', 404)

  const [certs, badges, comps, enrollments] = await Promise.all([
    supabase.from(T.Certificate)
      .select('*, course:Course(title,code), campus:Campus(name,code)')
      .eq('userId', userId).eq('status', 'valid')
      .order('issuedAt', { ascending: false }),
    supabase.from(T.UserBadge)
      .select('*, badge:Badge(*)')
      .eq('userId', userId)
      .order('awardedAt', { ascending: false }),
    supabase.from(T.UserCompetency)
      .select('*, competency:Competency(*)')
      .eq('userId', userId).eq('status', 'achieved'),
    supabase.from(T.Enrollment)
      .select('*, course:Course(title,code,credits)')
      .eq('userId', userId).eq('status', 'completed')
      .order('completedAt', { ascending: false }),
  ])

  const certData = certs.data || []
  const badgeData = badges.data || []
  const compData = comps.data || []
  const enrData = enrollments.data || []

  return ok({
    portfolio: {
      user,
      certificates: certData,
      badges: badgeData.map((b: any) => ({ ...b.badge, criteria: b.badge?.criteria || {}, awardedAt: b.awardedAt })),
      competencies: compData.map((c: any) => c.competency),
      completedCourses: enrData,
      stats: {
        certificates: certData.length,
        badges: badgeData.length,
        competencies: compData.length,
        coursesCompleted: enrData.length,
        totalCredits: enrData.reduce((s: number, e: any) => s + (e.course?.credits || 0), 0),
      },
    },
  })
}
