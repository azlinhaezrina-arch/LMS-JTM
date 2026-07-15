import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from(T.Enrollment)
    .select('*, course:Course(*, campus:Campus(*), category:CourseCategory(*), instructor:User!instructorId(id,name,"avatarUrl"))')
    .eq('userId', user.id)
    .order('enrolledAt', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return ok({ enrollments: [] })

  const result = (data || []).map((e: any) => ({
    ...e,
    course: { ...e.course, tags: e.course?.tags || [] },
  }))

  return ok({ enrollments: result })
}
