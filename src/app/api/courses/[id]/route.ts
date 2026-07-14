import { db } from '@/lib/db'
import { getCurrentUser, requireUser } from '@/lib/session'
import { ok, fail, parseJson } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await db.course.findUnique({
    where: { id },
    include: {
      category: true,
      campus: true,
      instructor: { select: { id: true, name: true, avatarUrl: true, email: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: { contents: { orderBy: { createdAt: 'asc' } } },
      },
      quizzes: true,
      competencies: { include: { competency: true } },
      enrollments: { select: { id: true, userId: true, status: true, progressPct: true } },
    },
  })
  if (!course) return fail('Kursus tidak dijumpai', 404)

  const user = await getCurrentUser()
  let myEnrollment = null
  let progressMap: Record<string, { status: string; timeSpentSec: number; score: number | null }> = {}
  if (user) {
    myEnrollment = await db.enrollment.findFirst({
      where: { userId: user.id, courseId: id },
      include: { progress: true },
    })
    if (myEnrollment) {
      progressMap = Object.fromEntries(
        myEnrollment.progress.map((p) => [p.contentId, { status: p.status, timeSpentSec: p.timeSpentSec, score: p.score }])
      )
    }
  }

  return ok({
    course: {
      ...course,
      tags: parseJson(course.tags, []),
      competencies: course.competencies.map((cc) => cc.competency),
      modules: course.modules.map((m) => ({
        ...m,
        contents: m.contents.map((c) => ({ ...c, progress: progressMap[c.id] ?? null })),
      })),
      myEnrollment: myEnrollment
        ? { id: myEnrollment.id, status: myEnrollment.status, progressPct: myEnrollment.progressPct, finalScore: myEnrollment.finalScore }
        : null,
    },
  })
}
