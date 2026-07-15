import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'

// POST /api/progress — update content progress (xAPI-like learning record)
export async function POST(req: Request) {
  const user = await requireUser()
  const { enrollmentId, contentId, status, timeSpentSec, score } = await parseBody<{
    enrollmentId: string; contentId: string; status: string; timeSpentSec?: number; score?: number
  }>(req)

  const { data: enr, error: enrErr } = await supabase
    .from(T.Enrollment)
    .select('id, userId, courseId')
    .eq('id', enrollmentId)
    .single()
  if (enrErr || !enr || enr.userId !== user.id) return fail('Pendaftaran tidak sah', 403)

  const update: Record<string, unknown> = { status }
  if (timeSpentSec !== undefined) update.timeSpentSec = timeSpentSec
  if (score !== undefined) update.score = score
  if (status === 'completed') update.completedAt = new Date().toISOString()

  // Upsert progress
  const { data: existing } = await supabase
    .from(T.Progress)
    .select('id')
    .eq('enrollmentId', enrollmentId)
    .eq('contentId', contentId)
    .maybeSingle()

  let progress
  if (existing) {
    const { data } = await supabase.from(T.Progress).update(update).eq('id', existing.id).select().single()
    progress = data
  } else {
    const { data } = await supabase.from(T.Progress).insert({
      id: crypto.randomUUID(), enrollmentId, contentId, userId: user.id, ...update,
    }).select().single()
    progress = data
  }

  // Recompute enrollment progress %
  const { data: course } = await supabase
    .from(T.Course)
    .select('id, modules:Module(id, contents:Content(id))')
    .eq('id', enr.courseId)
    .single()
  if (course) {
    const allContents = (course.modules || []).flatMap((m: any) => m.contents || [])
    const total = allContents.length || 1
    const { count } = await supabase
      .from(T.Progress)
      .select('id', { count: 'exact', head: true })
      .eq('enrollmentId', enrollmentId)
      .eq('status', 'completed')
    const completed = count || 0
    const pct = Math.round((completed / total) * 100)
    await supabase.from(T.Enrollment).update({
      progressPct: pct,
      status: pct === 100 ? 'completed' : 'active',
      completedAt: pct === 100 ? new Date().toISOString() : null,
    }).eq('id', enrollmentId)

    if (status === 'completed' && (!existing)) {
      await supabase.from(T.User).update({ points: (user.points || 0) + 25 }).eq('id', user.id)
    }
  }

  return ok({ progress })
}
