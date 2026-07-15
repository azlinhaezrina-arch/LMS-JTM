import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const [{ data: badges }, { data: earned }] = await Promise.all([
    supabase.from(T.Badge).select('*').order('createdAt', { ascending: true }),
    supabase.from(T.UserBadge).select('id, badgeId, awardedAt').eq('userId', user.id),
  ])
  const earnedMap = new Map((earned || []).map((e: any) => [e.badgeId, e]))

  return ok({
    badges: (badges || []).map((b: any) => ({
      ...b,
      criteria: b.criteria || {},
      earned: earnedMap.has(b.id),
      awardedAt: earnedMap.get(b.id)?.awardedAt ?? null,
    })),
  })
}
