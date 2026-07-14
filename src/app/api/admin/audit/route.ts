import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, tenantScope } from '@/lib/session'
import { ok, fail, parseJson } from '@/lib/api'

export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (user.role !== 'super_admin' && user.role !== 'auditor' && user.role !== 'admin_kampus') {
    return fail('Akses ditolak', 403)
  }
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

  const where: Record<string, unknown> = tenantScope(user)
  if (action) where.action = action

  const logs = await db.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, role: true } }, campus: { select: { code: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return ok({ logs: logs.map((l) => ({ ...l, details: parseJson(l.details, {}) })) })
}
