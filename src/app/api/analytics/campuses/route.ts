import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

// Cross-campus detailed comparison — super_admin / auditor only
export async function GET() {
  const user = await requireUser()
  if (user.role !== 'super_admin' && user.role !== 'auditor') return fail('Akses ditolak', 403)

  const campuses = await db.campus.findMany({
    where: { code: { not: 'JTM-HQ' } },
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
  })

  const rows = await Promise.all(
    campuses.map(async (c) => {
      const [users, courses, enrollments, completed, certs, pengajar, pelajar] = await Promise.all([
        db.user.count({ where: { campusId: c.id } }),
        db.course.count({ where: { campusId: c.id, status: 'published' } }),
        db.enrollment.count({ where: { campusId: c.id } }),
        db.enrollment.count({ where: { campusId: c.id, status: 'completed' } }),
        db.certificate.count({ where: { campusId: c.id } }),
        db.user.count({ where: { campusId: c.id, role: 'pengajar' } }),
        db.user.count({ where: { campusId: c.id, role: 'pelajar' } }),
      ])
      return {
        id: c.id, code: c.code, name: c.name, region: c.region, state: c.state,
        users, pengajar, pelajar, courses, enrollments, completed,
        completionRate: enrollments > 0 ? Math.round((completed / enrollments) * 100) : 0,
        certificates: certs,
      }
    })
  )

  return ok({ campuses: rows })
}
