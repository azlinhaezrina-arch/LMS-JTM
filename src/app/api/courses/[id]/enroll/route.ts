import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'
import { AuditLog } from '@prisma/client'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  const course = await db.course.findUnique({ where: { id }, include: { campus: true } })
  if (!course) return fail('Kursus tidak dijumpai', 404)
  if (course.status !== 'published') return fail('Kursus tidak tersedia', 400)

  const existing = await db.enrollment.findFirst({ where: { userId: user.id, courseId: id } })
  if (existing) return fail('Anda telah mendaftar kursus ini', 409)

  if (course.enrolledCount >= course.quota) return fail('Kuota kursus telah penuh', 400)

  const enr = await db.enrollment.create({
    data: {
      userId: user.id,
      courseId: id,
      campusId: course.campusId,
      status: 'active',
      progressPct: 0,
    },
  })
  await db.course.update({ where: { id }, data: { enrolledCount: { increment: 1 } } })

  await db.auditLog.create({
    data: {
      userId: user.id, campusId: user.campusId, action: 'enrollment.create',
      entity: 'enrollment', entityId: enr.id,
      details: JSON.stringify({ courseId: id, courseCode: course.code }),
    } as Partial<AuditLog>,
  })

  // Auto-notify
  await db.notification.create({
    data: {
      userId: user.id, type: 'success',
      title: 'Pendaftaran Berjaya',
      message: `Anda telah mendaftar untuk "${course.title}". Mula belajar sekarang!`,
      link: '/my-learning',
    },
  })

  return ok({ enrollment: enr })
}
