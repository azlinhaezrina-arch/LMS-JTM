import { db } from '@/lib/db'
import { getCurrentUser, tenantScope } from '@/lib/session'
import { ok, parseJson } from '@/lib/api'

export async function GET() {
  const user = await getCurrentUser()
  const where = user ? tenantScope(user) : { status: 'active' }
  const campuses = await db.campus.findMany({
    where,
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
  })
  return ok({
    campuses: campuses.map((c) => ({
      ...c,
      metadata: parseJson(c.metadata, {}),
    })),
  })
}
