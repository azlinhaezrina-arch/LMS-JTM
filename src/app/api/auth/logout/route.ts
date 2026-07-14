import { db } from '@/lib/db'
import { clearSession, getCurrentUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function POST() {
  const user = await getCurrentUser()
  if (user) {
    await db.auditLog.create({
      data: {
        userId: user.id,
        campusId: user.campusId,
        action: 'user.logout',
        entity: 'user',
        entityId: user.id,
      },
    })
  }
  await clearSession()
  return ok({ loggedOut: true })
}
