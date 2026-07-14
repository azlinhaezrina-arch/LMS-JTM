import { db } from '@/lib/db'
import { ok, fail, parseJson } from '@/lib/api'

// Public ePortfolio — shareable profile
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, avatarUrl: true, role: true, campusId: true,
      points: true, streak: true, createdAt: true, campus: true,
    },
  })
  if (!user) return fail('Portfolio tidak dijumpai', 404)

  const [certs, badges, comps, enrollments] = await Promise.all([
    db.certificate.findMany({
      where: { userId, status: 'valid' },
      include: { course: { select: { title: true, code: true } }, campus: { select: { name: true, code: true } } },
      orderBy: { issuedAt: 'desc' },
    }),
    db.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    }),
    db.userCompetency.findMany({
      where: { userId, status: 'achieved' },
      include: { competency: true },
    }),
    db.enrollment.findMany({
      where: { userId, status: 'completed' },
      include: { course: { select: { title: true, code: true, credits: true } } },
      orderBy: { completedAt: 'desc' },
    }),
  ])

  return ok({
    portfolio: {
      user,
      certificates: certs,
      badges: badges.map((b) => ({ ...b.badge, criteria: parseJson(b.badge.criteria, {}), awardedAt: b.awardedAt })),
      competencies: comps.map((c) => c.competency),
      completedCourses: enrollments,
      stats: {
        certificates: certs.length,
        badges: badges.length,
        competencies: comps.length,
        coursesCompleted: enrollments.length,
        totalCredits: enrollments.reduce((s, e) => s + (e.course.credits || 0), 0),
      },
    },
  })
}
