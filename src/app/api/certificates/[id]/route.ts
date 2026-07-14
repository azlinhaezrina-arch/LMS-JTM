import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok, fail } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params
  const cert = await db.certificate.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, icNumber: true } },
      course: { select: { id: true, title: true, code: true } },
      campus: { select: { id: true, name: true, code: true } },
    },
  })
  if (!cert) return fail('Sijil tidak dijumpai', 404)
  if (cert.userId !== user.id && user.role !== 'super_admin' && user.role !== 'auditor') {
    return fail('Tiada akses', 403)
  }
  return ok({ certificate: cert })
}
