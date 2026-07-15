import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

const CAT_COLORS: Record<string, string> = {
  'Mekatronik': '#059669', 'Elektrik': '#d97706', 'IT & Multimedia': '#0d9488',
  'Automotif': '#e11d48', 'Pembuatan': '#7c3aed', 'Elektronik': '#10b981',
  'Pemprosesan Makanan': '#eab308', 'Fesyen & Pakaian': '#f43f5e',
  'Awam & Binaan': '#14b8a6', 'Pengurusan': '#8b5cf6',
}
const STATUS_COLORS: Record<string, string> = {
  active: '#0d9488', completed: '#059669', dropped: '#e11d48', pending: '#d97706',
}

export async function GET() {
  const user = await requireUser()
  const isHQ = user.role === 'super_admin' || user.role === 'auditor'

  // Build base filters
  const campusFilter = isHQ ? null : user.campusId

  // Counts — use head counts
  const countWhere = (table: string, extra?: Record<string, unknown>) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true })
    if (campusFilter) q = q.eq('campusId', campusFilter)
    if (extra) for (const [k, v] of Object.entries(extra)) q = q.eq(k, v as string)
    return q
  }

  const [users, courses, enrollments, certificates, campuses] = await Promise.all([
    countWhere(T.User),
    countWhere(T.Course, { status: 'published' }),
    countWhere(T.Enrollment),
    countWhere(T.Certificate),
    isHQ
      ? supabase.from(T.Campus).select('id', { count: 'exact', head: true })
      : Promise.resolve({ count: 1 }),
  ])

  const completedEnrollments = await countWhere(T.Enrollment, { status: 'completed' })
  const completionRate = (enrollments.count || 0) > 0 ? Math.round(((completedEnrollments.count || 0) / enrollments.count!) * 100) : 0

  // Avg score from certificates
  let avgScore = 0
  const { data: certScores } = await supabase.from(T.Certificate).select('score')
  if (campusFilter) {
    // already filtered by campus via the query above? No — let's refilter
    const { data: filtered } = await supabase.from(T.Certificate).select('score').eq('campusId', campusFilter)
    if (filtered && filtered.length) avgScore = Math.round(filtered.reduce((s, c) => s + (c.score || 0), 0) / filtered.length * 10) / 10
  } else if (certScores && certScores.length) {
    avgScore = Math.round(certScores.reduce((s, c) => s + (c.score || 0), 0) / certScores.length * 10) / 10
  }

  // Active learners (signed in within 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  let activeLearnersQ = supabase.from(T.User).select('id', { count: 'exact', head: true }).eq('status', 'active').gte('lastSignInAt', sevenDaysAgo)
  if (campusFilter) activeLearnersQ = activeLearnersQ.eq('campusId', campusFilter)
  const { count: activeLearners } = await activeLearnersQ

  // Enrollments trend (last 8 weeks)
  const trend: { label: string; value: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date(Date.now() - i * 7 * 86400000)
    const end = new Date(Date.now() - (i - 1) * 7 * 86400000)
    let q = supabase.from(T.Enrollment).select('id', { count: 'exact', head: true }).gte('enrolledAt', start.toISOString()).lt('enrolledAt', end.toISOString())
    if (campusFilter) q = q.eq('campusId', campusFilter)
    const { count } = await q
    trend.push({ label: `M${-i + 8}`, value: count || 0 })
  }

  // Completion by campus
  const { data: allCampuses } = await supabase
    .from(T.Campus)
    .select('id, code, name, region')
    .order('region', { ascending: true })
  const visibleCampuses = isHQ ? allCampuses : (allCampuses || []).filter((c: any) => c.id === user.campusId)
  const completionByCampus = await Promise.all(
    (visibleCampuses || []).map(async (c: any) => {
      const [{ count: enr }, { count: comp }] = await Promise.all([
        supabase.from(T.Enrollment).select('id', { count: 'exact', head: true }).eq('campusId', c.id),
        supabase.from(T.Enrollment).select('id', { count: 'exact', head: true }).eq('campusId', c.id).eq('status', 'completed'),
      ])
      return {
        campus: c.name, code: c.code,
        rate: (enr || 0) > 0 ? Math.round(((comp || 0) / enr!) * 100) : 0,
        enrolled: enr || 0, completed: comp || 0,
      }
    })
  )

  // Category distribution
  const { data: catAgg } = await supabase
    .from(T.Course)
    .select('categoryId')
    .eq('status', 'published')
  const catCounts: Record<string, number> = {}
  for (const c of catAgg || []) {
    if (c.categoryId) catCounts[c.categoryId] = (catCounts[c.categoryId] || 0) + 1
  }
  const { data: categories } = await supabase.from(T.CourseCategory).select('*')
  const categoryDistribution = Object.entries(catCounts).map(([cid, val]) => {
    const cat = (categories || []).find((c: any) => c.id === cid)
    return { name: cat?.name ?? 'Lain', value: val, color: cat ? CAT_COLORS[cat.name] ?? '#0d9488' : '#0d9488' }
  }).sort((a, b) => b.value - a.value)

  // Status breakdown
  const { data: statusAgg } = await supabase.from(T.Enrollment).select('status')
  const statusCounts: Record<string, number> = {}
  for (const e of statusAgg || []) statusCounts[e.status] = (statusCounts[e.status] || 0) + 1
  const statusBreakdown = Object.entries(statusCounts).map(([s, v]) => ({ name: s, value: v, color: STATUS_COLORS[s] ?? '#6b7280' }))

  // Top courses
  let topQ = supabase.from(T.Course).select('id, title, "enrolledCount", rating').order('enrolledCount', { ascending: false }).limit(5)
  if (campusFilter) topQ = topQ.eq('campusId', campusFilter)
  const { data: topRaw } = await topQ
  const topCourses = (topRaw || []).map((c: any) => ({ id: c.id, title: c.title, enrolled: c.enrolledCount, rating: c.rating }))

  // Region performance
  const regionMap = new Map<string, { campuses: number; enrolled: number; completed: number }>()
  for (const c of visibleCampuses || []) {
    if (!regionMap.has(c.region)) regionMap.set(c.region, { campuses: 0, enrolled: 0, completed: 0 })
    regionMap.get(c.region)!.campuses += 1
  }
  for (const cb of completionByCampus) {
    const campus = (visibleCampuses || []).find((c: any) => c.code === cb.code)
    if (campus) {
      const entry = regionMap.get(campus.region)!
      entry.enrolled += cb.enrolled
      entry.completed += cb.completed
    }
  }
  const regionPerformance = Array.from(regionMap.entries()).map(([region, d]) => ({
    region, campuses: d.campuses,
    completion: d.enrolled > 0 ? Math.round((d.completed / d.enrolled) * 100) : 0,
  }))

  return ok({
    analytics: {
      totals: {
        users: users.count || 0,
        courses: courses.count || 0,
        enrollments: enrollments.count || 0,
        certificates: certificates.count || 0,
        campuses: (campuses as any).count || (isHQ ? 0 : 1),
        completionRate,
        avgScore,
        activeLearners: activeLearners || 0,
      },
      enrollmentsTrend: trend,
      completionByCampus,
      categoryDistribution,
      statusBreakdown,
      topCourses,
      regionPerformance,
    },
  })
}
