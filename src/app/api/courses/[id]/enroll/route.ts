import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  const { data: course, error } = await supabase
    .from(T.Course)
    .select('*')
    .eq('id', id)
    .single()
  if (error || !course) return fail('Kursus tidak dijumpai', 404)
  if (course.status !== 'published') return fail('Kursus tidak tersedia', 400)

  const { data: existing } = await supabase
    .from(T.Enrollment)
    .select('id')
    .eq('userId', user.id)
    .eq('courseId', id)
    .maybeSingle()
  if (existing) return fail('Anda telah mendaftar kursus ini', 409)

  if (course.enrolledCount >= course.quota) return fail('Kuota kursus telah penuh', 400)

  const enrId = crypto.randomUUID()
  const { data: enr, error: insErr } = await supabase
    .from(T.Enrollment)
    .insert({
      id: enrId,
      userId: user.id,
      courseId: id,
      campusId: course.campusId,
      status: 'active',
      progressPct: 0,
    })
    .select()
    .single()

  if (insErr || !enr) return fail('Gagal mendaftar', 500)

  await supabase.from(T.Course).update({ enrolledCount: course.enrolledCount + 1 }).eq('id', id)

  await supabase.from(T.AuditLog).insert({
    userId: user.id, campusId: user.campusId, action: 'enrollment.create',
    entity: 'enrollment', entityId: enrId,
    details: { courseId: id, courseCode: course.code },
  })

  await supabase.from(T.Notification).insert({
    userId: user.id, type: 'success',
    title: 'Pendaftaran Berjaya',
    message: `Anda telah mendaftar untuk "${course.title}". Mula belajar sekarang!`,
    link: '/my-learning',
  })

  return ok({ enrollment: enr })
}
