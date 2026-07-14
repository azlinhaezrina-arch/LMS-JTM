import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  const enr = await db.enrollment.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          modules: { orderBy: { order: 'asc' }, include: { contents: { orderBy: { createdAt: 'asc' } } } },
          quizzes: { include: { questions: { orderBy: { order: 'asc' } } } },
          campus: true,
          instructor: { select: { id: true, name: true } },
        },
      },
      progress: true,
      quizAttempts: { orderBy: { submittedAt: 'desc' } },
      certificate: true,
    },
  })
  if (!enr) return fail('Pendaftaran tidak dijumpai', 404)
  if (enr.userId !== user.id && user.role !== 'super_admin' && user.role !== 'admin_kampus') {
    return fail('Tiada akses', 403)
  }

  const progressMap = Object.fromEntries(enr.progress.map((p) => [p.contentId, p]))

  return ok({
    enrollment: {
      ...enr,
      course: {
        ...enr.course,
        modules: enr.course.modules.map((m) => ({
          ...m,
          contents: m.contents.map((c) => ({ ...c, progress: progressMap[c.id] ?? null })),
        })),
      },
    },
  })
}
