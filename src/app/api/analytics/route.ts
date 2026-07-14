import { db } from '@/lib/db'
import { requireUser, tenantScope } from '@/lib/session'
import { ok, parseJson } from '@/lib/api'

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
  const scope = tenantScope(user)

  const [users, courses, enrollments, certificates, campuses] = await Promise.all([
    db.user.count({ where: scope }),
    db.course.count({ where: { ...scope, status: 'published' } }),
    db.enrollment.count({ where: scope }),
    db.certificate.count({ where: scope }),
    db.campus.count({ where: user.role === 'super_admin' || user.role === 'auditor' ? {} : { id: user.campusId ?? '__none__' } }),
  ])

  const completedEnrollments = await db.enrollment.count({ where: { ...scope, status: 'completed' } })
  const completionRate = enrollments > 0 ? Math.round((completedEnrollments / enrollments) * 100) : 0
  const avgScoreAgg = await db.certificate.aggregate({ _avg: { score: true }, where: scope })
  const avgScore = avgScoreAgg._avg.score ? Math.round(avgScoreAgg._avg.score * 10) / 10 : 0

  // Active learners (signed in within 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const activeLearners = await db.user.count({
    where: { ...scope, lastSignInAt: { gte: sevenDaysAgo }, status: 'active' },
  })

  // Enrollments trend (last 8 weeks)
  const trend: { label: string; value: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date(Date.now() - i * 7 * 86400000)
    const end = new Date(Date.now() - (i - 1) * 7 * 86400000)
    const count = await db.enrollment.count({
      where: { ...scope, enrolledAt: { gte: start, lt: end } },
    })
    trend.push({ label: `M${-i + 8}`, value: count })
  }

  // Completion by campus (cross-campus for super_admin, else just own)
  const campusWhere = user.role === 'super_admin' || user.role === 'auditor' ? {} : { id: user.campusId ?? '__none__' }
  const allCampuses = await db.campus.findMany({ where: campusWhere, orderBy: { region: 'asc' } })
  const completionByCampus = await Promise.all(
    allCampuses.map(async (c) => {
      const [enr, comp] = await Promise.all([
        db.enrollment.count({ where: { campusId: c.id } }),
        db.enrollment.count({ where: { campusId: c.id, status: 'completed' } }),
      ])
      return {
        campus: c.name, code: c.code,
        rate: enr > 0 ? Math.round((comp / enr) * 100) : 0,
        enrolled: enr, completed: comp,
      }
    })
  )

  // Category distribution
  const catAgg = await db.course.groupBy({
    by: ['categoryId'],
    where: { ...scope, status: 'published' },
    _count: { id: true },
  })
  const categories = await db.courseCategory.findMany()
  const categoryDistribution = catAgg.map((g) => {
    const cat = categories.find((c) => c.id === g.categoryId)
    return { name: cat?.name ?? 'Lain', value: g._count.id, color: cat ? CAT_COLORS[cat.name] ?? '#0d9488' : '#0d9488' }
  }).sort((a, b) => b.value - a.value)

  // Status breakdown
  const statusAgg = await db.enrollment.groupBy({
    by: ['status'],
    where: scope,
    _count: { id: true },
  })
  const statusBreakdown = statusAgg.map((s) => ({
    name: s.status, value: s._count.id, color: STATUS_COLORS[s.status] ?? '#6b7280',
  }))

  // Top courses
  const topCoursesRaw = await db.course.findMany({
    where: scope,
    orderBy: { enrolledCount: 'desc' },
    take: 5,
    select: { id: true, title: true, enrolledCount: true, rating: true },
  })
  const topCourses = topCoursesRaw.map((c) => ({
    id: c.id, title: c.title, enrolled: c.enrolledCount, rating: c.rating,
  }))

  // Region performance
  const regionMap = new Map<string, { campuses: number; enrolled: number; completed: number }>()
  for (const c of allCampuses) {
    const r = c.region
    if (!regionMap.has(r)) regionMap.set(r, { campuses: 0, enrolled: 0, completed: 0 })
    const entry = regionMap.get(r)!
    entry.campuses += 1
  }
  for (const cb of completionByCampus) {
    const campus = allCampuses.find((c) => c.code === cb.code)
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
        users, courses, enrollments, certificates, campuses,
        completionRate, avgScore, activeLearners,
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
