import { supabase, T } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: course, error } = await supabase
    .from(T.Course)
    .select('*, category:CourseCategory(*), campus:Campus(*), instructor:User!instructorId(id,name,"avatarUrl",email), modules:Module(*), quizzes:Quiz(*), competencies:CourseCompetency(competency:Competency(*))')
    .eq('id', id)
    .single()
  if (error || !course) return fail('Kursus tidak dijumpai', 404)

  // Fetch contents for each module
  const moduleIds = (course.modules || []).map((m: any) => m.id)
  let contentsByModule: Record<string, any[]> = {}
  if (moduleIds.length) {
    const { data: contents } = await supabase
      .from(T.Content)
      .select('*')
      .in('moduleId', moduleIds)
      .order('createdAt', { ascending: true })
    for (const c of contents || []) {
      if (!contentsByModule[c.moduleId]) contentsByModule[c.moduleId] = []
      contentsByModule[c.moduleId].push(c)
    }
  }

  const user = await getCurrentUser()
  let myEnrollment: any = null
  let progressMap: Record<string, { status: string; timeSpentSec: number; score: number | null }> = {}
  if (user) {
    const { data: enr } = await supabase
      .from(T.Enrollment)
      .select('*, progress:Progress(*)')
      .eq('userId', user.id)
      .eq('courseId', id)
      .single()
    if (enr) {
      myEnrollment = { id: enr.id, status: enr.status, progressPct: enr.progressPct, finalScore: enr.finalScore }
      progressMap = Object.fromEntries((enr.progress || []).map((p: any) => [p.contentId, { status: p.status, timeSpentSec: p.timeSpentSec, score: p.score }]))
    }
  }

  const result = {
    ...course,
    tags: course.tags || [],
    competencies: (course.competencies || []).map((cc: any) => cc.competency),
    modules: (course.modules || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((m: any) => ({
        ...m,
        contents: (contentsByModule[m.id] || []).map((c) => ({ ...c, progress: progressMap[c.id] ?? null })),
      })),
    myEnrollment,
  }

  return ok({ course: result })
}
