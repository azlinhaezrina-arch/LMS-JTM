import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return fail('Tidak log masuk', 401)
  const fresh = await db.user.findUnique({
    where: { id: user.id },
    include: { campus: true },
  })
  return ok({ user: fresh })
}
