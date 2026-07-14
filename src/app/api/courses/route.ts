import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, tenantScope } from '@/lib/session'
import { ok, parseJson } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId')
  const campusId = searchParams.get('campusId')
  const level = searchParams.get('level')
  const format = searchParams.get('format')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

  const where: Record<string, unknown> = { status: 'published' }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { code: { contains: search } },
      { description: { contains: search } },
    ]
  }
  if (categoryId) where.categoryId = categoryId
  if (level) where.level = level
  if (format) where.format = format
  // Tenant scoping: non-super-admins see their campus + published courses only
  if (user && user.role !== 'super_admin' && user.role !== 'auditor' && !campusId) {
    where.OR = [{ campusId: user.campusId }, { format: { in: ['online', 'blended'] } }]
  }
  if (campusId) where.campusId = campusId

  const courses = await db.course.findMany({
    where,
    include: {
      category: true,
      campus: true,
      instructor: { select: { id: true, name: true, avatarUrl: true } },
      competencies: { include: { competency: true } },
    },
    orderBy: { enrolledCount: 'desc' },
    take: limit,
  })

  // If logged in, attach enrollment status
  let enrollments: Record<string, { status: string; progressPct: number }> = {}
  if (user) {
    const enr = await db.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true, status: true, progressPct: true },
    })
    enrollments = Object.fromEntries(enr.map((e) => [e.courseId, { status: e.status, progressPct: e.progressPct }]))
  }

  return ok({
    courses: courses.map((c) => ({
      ...c,
      tags: parseJson(c.tags, []),
      competencies: c.competencies.map((cc) => cc.competency),
      enrollment: enrollments[c.id] ?? null,
    })),
  })
}
