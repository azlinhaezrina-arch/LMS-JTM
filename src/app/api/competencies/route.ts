import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, parseJson } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const competencies = await db.competency.findMany({
    include: { courses: { include: { course: { select: { id: true, title: true, code: true } } } } },
    orderBy: [{ framework: 'asc' }, { level: 'asc' }],
  })
  const userComps = await db.userCompetency.findMany({ where: { userId: user.id } })
  const userMap = new Map(userComps.map((uc) => [uc.competencyId, uc]))

  return ok({
    competencies: competencies.map((c) => ({
      ...c,
      status: userMap.get(c.id)?.status ?? 'not_started',
      achievedAt: userMap.get(c.id)?.achievedAt ?? null,
      courses: c.courses.map((cc) => cc.course),
    })),
  })
}
