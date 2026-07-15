import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

// Cross-campus detailed comparison — super_admin / auditor only
export async function GET() {
  const user = await requireUser()
  if (user.role !== 'super_admin' && user.role !== 'auditor') return fail('Akses ditolak', 403)

  const { data: campuses, error } = await supabase
    .from(T.Campus)
    .select('id, code, name, region, state')
    .neq('code', 'JTM-HQ')
    .order('region', { ascending: true })
    .order('name', { ascending: true })
  if (error) return ok({ campuses: [] })

  const rows = await Promise.all(
    (campuses || []).map(async (c: any) => {
      const [users, courses, enrollments, completed, certs, pengajar, pelajar] = await Promise.all([
        supabase.from(T.User).select('id', { count: 'exact', head: true }).eq('campusId', c.id),
        supabase.from(T.Course).select('id', { count: 'exact', head: true }).eq('campusId', c.id).eq('status', 'published'),
        supabase.from(T.Enrollment).select('id', { count: 'exact', head: true }).eq('campusId', c.id),
        supabase.from(T.Enrollment).select('id', { count: 'exact', head: true }).eq('campusId', c.id).eq('status', 'completed'),
        supabase.from(T.Certificate).select('id', { count: 'exact', head: true }).eq('campusId', c.id),
        supabase.from(T.User).select('id', { count: 'exact', head: true }).eq('campusId', c.id).eq('role', 'pengajar'),
        supabase.from(T.User).select('id', { count: 'exact', head: true }).eq('campusId', c.id).eq('role', 'pelajar'),
      ])
      return {
        id: c.id, code: c.code, name: c.name, region: c.region, state: c.state,
        users: users.count || 0, pengajar: pengajar.count || 0, pelajar: pelajar.count || 0,
        courses: courses.count || 0, enrollments: enrollments.count || 0, completed: completed.count || 0,
        completionRate: (enrollments.count || 0) > 0 ? Math.round(((completed.count || 0) / enrollments.count!) * 100) : 0,
        certificates: certs.count || 0,
      }
    })
  )

  return ok({ campuses: rows })
}
