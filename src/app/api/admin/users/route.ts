import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, tenantScope } from '@/lib/session'
import { ok, fail, parseJson } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (user.role !== 'super_admin' && user.role !== 'admin_kampus' && user.role !== 'auditor') {
    return fail('Akses ditolak', 403)
  }
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = tenantScope(user)
  if (role) where.role = role
  if (search) {
    where.OR = [{ name: { contains: search } }, { email: { contains: search } }]
  }

  const users = await db.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, role: true, status: true,
      campusId: true, campus: true, points: true, streak: true,
      lastSignInAt: true, createdAt: true, preferredLang: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return ok({ users: users.map((u) => ({ ...u, metadata: parseJson(null, {}) })) })
}
