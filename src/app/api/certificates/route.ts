import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const { data, error } = await supabase
    .from(T.Certificate)
    .select('*, course:Course(id,title,code), campus:Campus(id,name,code)')
    .eq('userId', user.id)
    .eq('status', 'valid')
    .order('issuedAt', { ascending: false })
  if (error) return ok({ certificates: [] })
  return ok({ certificates: data || [] })
}
