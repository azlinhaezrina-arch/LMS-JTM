import { db } from '@/lib/db'
import { ok, fail } from '@/lib/api'

// Public verification endpoint — no auth required (for QR scanning)
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const cert = await db.certificate.findUnique({
    where: { verifyCode: code },
    include: {
      user: { select: { name: true, icNumber: true } },
      course: { select: { title: true, code: true } },
      campus: { select: { name: true, code: true } },
    },
  })
  if (!cert) return fail('Sijil tidak sah atau tidak dijumpai', 404)
  return ok({
    certificate: {
      certNumber: cert.certNumber,
      recipientName: cert.recipientName,
      recipientIc: cert.recipientIc,
      title: cert.title,
      courseTitle: cert.course.title,
      courseCode: cert.course.code,
      campusName: cert.campus?.name,
      score: cert.score,
      grade: cert.grade,
      issuedAt: cert.issuedAt,
      expiryAt: cert.expiryAt,
      status: cert.status,
      signature: cert.signature,
      valid: cert.status === 'valid',
    },
  })
}
