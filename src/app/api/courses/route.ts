import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId')
  const campusId = searchParams.get('campusId')
  const level = searchParams.get('level')
  const format = searchParams.get('format')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

  let query = supabase
    .from(T.Course)
    .select('*, category:CourseCategory(*), campus:Campus(*), instructor:User!instructorId(id,name,"avatarUrl"), competencies:CourseCompetency(competency:Competency(*))')
    .eq('status', 'published')
    .order('enrolledCount', { ascending: false })
    .limit(limit)

  if (search) query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`)
  if (categoryId) query = query.eq('categoryId', categoryId)
  if (level) query = query.eq('level', level)
  if (format) query = query.eq('format', format)
  if (campusId) query = query.eq('campusId', campusId)
  else if (user && user.role !== 'super_admin' && user.role !== 'auditor') {
    // Non-super-admins: own campus + online/blended
    query = query.or(`campusId.eq.${user.campusId},format.in.(online,blended)`)
  }

  const { data: courses, error } = await query
  if (error) return ok({ courses: [] })

  // Attach enrollment status if logged in
  let enrollments: Record<string, { status: string; progressPct: number }> = {}
  if (user) {
    const { data: enr } = await supabase
      .from(T.Enrollment)
      .select('courseId,status,progressPct')
      .eq('userId', user.id)
    if (enr) enrollments = Object.fromEntries(enr.map((e: any) => [e.courseId, { status: e.status, progressPct: e.progressPct }]))
  }

  const result = (courses || []).map((c: any) => ({
    ...c,
    tags: c.tags || [],
    competencies: (c.competencies || []).map((cc: any) => cc.competency),
    enrollment: enrollments[c.id] ?? null,
  }))

  return ok({ courses: result })
}
