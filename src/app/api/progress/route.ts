import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'

// POST /api/progress — update content progress (xAPI-like learning record)
export async function POST(req: Request) {
  const user = await requireUser()
  const { enrollmentId, contentId, status, timeSpentSec, score } = await parseBody<{
    enrollmentId: string; contentId: string; status: string; timeSpentSec?: number; score?: number
  }>(req)

  const enr = await db.enrollment.findUnique({ where: { id: enrollmentId } })
  if (!enr || enr.userId !== user.id) return fail('Pendaftaran tidak sah', 403)

  const existing = await db.progress.findUnique({ where: { enrollmentId_contentId: { enrollmentId, contentId } } })

  const data: Record<string, unknown> = { status }
  if (timeSpentSec !== undefined) data.timeSpentSec = timeSpentSec
  if (score !== undefined) data.score = score
  if (status === 'completed') data.completedAt = new Date()

  let progress
  if (existing) {
    progress = await db.progress.update({ where: { id: existing.id }, data })
  } else {
    progress = await db.progress.create({
      data: { enrollmentId, contentId, userId: user.id, ...data } as never,
    })
  }

  // Recompute enrollment progress percentage
  const course = await db.course.findUnique({
    where: { id: enr.courseId },
    include: { modules: { include: { contents: true } } },
  })
  if (course) {
    const allContents = course.modules.flatMap((m) => m.contents)
    const total = allContents.length || 1
    const completed = await db.progress.count({
      where: { enrollmentId, status: 'completed' },
    })
    const pct = Math.round((completed / total) * 100)
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPct: pct,
        status: pct === 100 ? 'completed' : 'active',
        completedAt: pct === 100 ? new Date() : null,
      },
    })

    // Award points for completion
    if (status === 'completed' && (!existing || existing.status !== 'completed')) {
      await db.user.update({ where: { id: user.id }, data: { points: { increment: 25 } } })
    }
  }

  return ok({ progress })
}
