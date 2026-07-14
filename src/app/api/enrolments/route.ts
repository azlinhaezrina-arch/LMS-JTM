import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, parseJson } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = { userId: user.id }
  if (status) where.status = status

  const enrollments = await db.enrollment.findMany({
    where,
    include: {
      course: {
        include: { campus: true, category: true, instructor: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  return ok({
    enrollments: enrollments.map((e) => ({
      ...e,
      course: { ...e.course, tags: parseJson(e.course.tags, []) },
    })),
  })
}
