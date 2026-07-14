import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || 'campus' // campus | global
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

  const where = scope === 'global' || user.role === 'super_admin' ? {} : { campusId: user.campusId ?? '__none__' }

  const users = await db.user.findMany({
    where: { ...where, status: 'active' },
    select: {
      id: true, name: true, avatarUrl: true, role: true,
      points: true, streak: true, campus: { select: { code: true, name: true } },
    },
    orderBy: { points: 'desc' },
    take: limit,
  })

  // Enrich with completion + badge counts
  const enriched = await Promise.all(
    users.map(async (u, i) => {
      const [completed, badges] = await Promise.all([
        db.enrollment.count({ where: { userId: u.id, status: 'completed' } }),
        db.userBadge.count({ where: { userId: u.id } }),
      ])
      return {
        rank: i + 1,
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        campusCode: u.campus?.code ?? null,
        campusName: u.campus?.name ?? null,
        role: u.role,
        points: u.points,
        streak: u.streak,
        coursesCompleted: completed,
        badges,
        isMe: u.id === user.id,
      }
    })
  )

  return ok({ leaderboard: enriched })
}
