import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  const { data: enr, error } = await supabase
    .from(T.Enrollment)
    .select('*, course:Course(*, modules:Module(*, contents:Content(*)), quizzes:Quiz(*, questions:Question(*)), campus:Campus(*), instructor:User!instructorId(id,name))')
    .eq('id', id)
    .single()
  if (error || !enr) return fail('Pendaftaran tidak dijumpai', 404)
  if (enr.userId !== user.id && user.role !== 'super_admin' && user.role !== 'admin_kampus') {
    return fail('Tiada akses', 403)
  }

  // Fetch progress + attempts separately (nested through course is complex)
  const [{ data: progress }, { data: attempts }, { data: certificate }] = await Promise.all([
    supabase.from(T.Progress).select('*').eq('enrollmentId', id),
    supabase.from(T.QuizAttempt).select('*').eq('enrollmentId', id).order('submittedAt', { ascending: false }),
    supabase.from(T.Certificate).select('*').eq('enrollmentId', id).maybeSingle(),
  ])

  const progressMap = Object.fromEntries((progress || []).map((p: any) => [p.contentId, p]))

  const result = {
    ...enr,
    course: {
      ...enr.course,
      modules: (enr.course?.modules || [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((m: any) => ({
          ...m,
          contents: (m.contents || [])
            .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((c: any) => ({ ...c, progress: progressMap[c.id] ?? null })),
        })),
    },
    progress: progress || [],
    quizAttempts: attempts || [],
    certificate,
  }

  return ok({ enrollment: result })
}
