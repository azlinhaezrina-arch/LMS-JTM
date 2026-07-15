import { supabase, T } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET() {
  const u = await getCurrentUser()
  if (!u) return fail('Tidak log masuk', 401)
  const { data, error } = await supabase
    .from(T.User)
    .select('*, campus(*)')
    .eq('id', u.id)
    .single()
  if (error || !data) return fail('Pengguna tidak dijumpai', 404)
  return ok({ user: data })
}
