import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || 'campus'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

  let query = supabase
    .from(T.User)
    .select('id, name, "avatarUrl", role, points, streak, campus:Campus(code,name)')
    .eq('status', 'active')
    .order('points', { ascending: false })
    .limit(limit)
  if (scope !== 'global' && user.role !== 'super_admin') {
    query = query.eq('campusId', user.campusId ?? '__none__')
  }

  const { data: users, error } = await query
  if (error) return ok({ leaderboard: [] })

  // Enrich with completion + badge counts
  const enriched = await Promise.all(
    (users || []).map(async (u: any, i: number) => {
      const [{ count: completed }, { count: badges }] = await Promise.all([
        supabase.from(T.Enrollment).select('id', { count: 'exact', head: true }).eq('userId', u.id).eq('status', 'completed'),
        supabase.from(T.UserBadge).select('id', { count: 'exact', head: true }).eq('userId', u.id),
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
        coursesCompleted: completed || 0,
        badges: badges || 0,
        isMe: u.id === user.id,
      }
    })
  )

  return ok({ leaderboard: enriched })
}
