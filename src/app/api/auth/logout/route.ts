import { supabase, T } from '@/lib/supabase'
import { clearSession, getCurrentUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function POST() {
  const user = await getCurrentUser()
  if (user) {
    await supabase.from(T.AuditLog).insert({
      userId: user.id,
      campusId: user.campusId,
      action: 'user.logout',
      entity: 'user',
      entityId: user.id,
    })
  }
  await clearSession()
  return ok({ loggedOut: true })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ok({ user: null })
  return ok({ user })
}
