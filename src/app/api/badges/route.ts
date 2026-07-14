import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, parseJson } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const badges = await db.badge.findMany({ orderBy: { createdAt: 'asc' } })
  const earned = await db.userBadge.findMany({ where: { userId: user.id } })
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e]))

  return ok({
    badges: badges.map((b) => ({
      ...b,
      criteria: parseJson(b.criteria, {}),
      earned: earnedMap.has(b.id),
      awardedAt: earnedMap.get(b.id)?.awardedAt ?? null,
    })),
  })
}
