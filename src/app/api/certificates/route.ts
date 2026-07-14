import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { ok } from '@/lib/api'

export async function GET() {
  const user = await requireUser()
  const certs = await db.certificate.findMany({
    where: { userId: user.id, status: 'valid' },
    include: {
      course: { select: { id: true, title: true, code: true } },
      campus: { select: { id: true, name: true, code: true } },
    },
    orderBy: { issuedAt: 'desc' },
  })
  return ok({ certificates: certs })
}
