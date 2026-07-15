import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const { data: cert, error } = await supabase
    .from(T.Certificate)
    .select('*, user:User(id,name,"avatarUrl","icNumber"), course:Course(id,title,code), campus:Campus(id,name,code)')
    .eq('id', id)
    .single()
  if (error || !cert) return fail('Sijil tidak dijumpai', 404)
  if (cert.userId !== user.id && user.role !== 'super_admin' && user.role !== 'auditor') {
    return fail('Tiada akses', 403)
  }
  return ok({ certificate: cert })
}
