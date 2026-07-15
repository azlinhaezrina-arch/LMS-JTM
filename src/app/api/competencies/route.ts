import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const [{ data: competencies }, { data: userComps }] = await Promise.all([
    supabase.from(T.Competency)
      .select('*, courses:CourseCompetency(course:Course(id,title,code))')
      .order('framework', { ascending: true })
      .order('level', { ascending: true }),
    supabase.from(T.UserCompetency).select('competencyId, status, achievedAt').eq('userId', user.id),
  ])
  const userMap = new Map((userComps || []).map((uc: any) => [uc.competencyId, uc]))

  return ok({
    competencies: (competencies || []).map((c: any) => ({
      ...c,
      status: userMap.get(c.id)?.status ?? 'not_started',
      achievedAt: userMap.get(c.id)?.achievedAt ?? null,
      courses: (c.courses || []).map((cc: any) => cc.course),
    })),
  })
}
