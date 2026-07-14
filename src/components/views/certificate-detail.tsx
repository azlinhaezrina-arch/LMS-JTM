'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar, Pill, fmtDate, fmtDateTime } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Award, ArrowLeft, ShieldCheck, Calendar, MapPin, Download, Share2, Printer,
  CheckCircle2, XCircle, Loader2, Building2, User as UserIcon, Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function CertificateDetailView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const view = useStore((s) => s.view)
  const [cert, setCert] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const id = view.params?.id
    if (!id) return
    api.certificate(id).then(({ certificate }) => { setCert(certificate); setLoading(false) })
      .catch(() => { toast.error('Sijil tidak dijumpai'); setView('certificates') })
  }, [view.params, setView])

  if (loading) return <Skeleton className="h-[600px] rounded-2xl glass" />
  if (!cert) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => setView('certificates')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-4 h-4" /> {tr('certificates', lang)}
      </button>

      {/* Certificate canvas */}
      <GlassCard strong className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 p-8 sm:p-12 text-center text-white">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px)' }} />
          <div className="absolute inset-3 border-2 border-amber-400/30 rounded-2xl pointer-events-none" />
          <div className="absolute inset-5 border border-amber-400/20 rounded-xl pointer-events-none" />
          {/* Glows */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-400/20 blur-3xl rounded-full" />

          <div className="relative space-y-5">
            {/* Header */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
                <Award className="w-7 h-7 text-amber-300" />
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-300/90 font-semibold">{tr('org', lang)}</div>
                <div className="text-[10px] text-white/60">Jabatan Tenaga Manusia Malaysia</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">{lang === 'ms' ? 'Sijil Penyiapan Kursus' : 'Certificate of Completion'}</div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Proudly Presented To</h1>
            </div>

            {/* Recipient */}
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-gradient-gold tracking-tight">{cert.recipientName}</div>
              <div className="text-xs text-white/50 mt-1 font-mono">IC: {cert.recipientIc || '—'}</div>
            </div>

            <div className="text-sm text-white/80 max-w-md mx-auto leading-relaxed">
              {lang === 'ms' ? 'Telah berjaya menyiapkan kursus' : 'Has successfully completed the course'}
            </div>

            <div className="text-xl sm:text-2xl font-semibold text-amber-300">{cert.course.title}</div>
            <div className="text-xs text-white/60 font-mono">{cert.course.code}</div>

            {/* Score */}
            <div className="inline-flex items-center gap-4 glass-strong rounded-2xl px-6 py-3 bg-white/10 backdrop-blur">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/60">{tr('score', lang)}</div>
                <div className="text-2xl font-bold text-amber-300">{cert.score}%</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/60">{tr('grade', lang)}</div>
                <div className="text-2xl font-bold text-emerald-300">{cert.grade}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between max-w-md mx-auto pt-6">
              <div className="text-left">
                <div className="font-script text-amber-300 text-lg italic" style={{ fontFamily: 'Georgia, serif' }}>{cert.signature}</div>
                <div className="w-32 h-px bg-white/30 my-1.5" />
                <div className="text-[10px] text-white/60">{cert.signature}</div>
              </div>
              <div className="text-center">
                {/* Faux QR */}
                <div className="w-16 h-16 bg-white rounded-lg p-1.5 mx-auto">
                  <QRPlaceholder text={cert.verifyCode} />
                </div>
                <div className="text-[9px] text-white/50 mt-1 font-mono">{cert.verifyCode}</div>
              </div>
            </div>
            <div className="text-[10px] text-white/50 flex items-center justify-center gap-1.5">
              <Hash className="w-3 h-3" /> {cert.certNumber} · <Calendar className="w-3 h-3" /> {fmtDate(cert.issuedAt, lang)}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Meta + actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> {lang === 'ms' ? 'Butiran Pengesahan' : 'Verification Details'}</h3>
          <dl className="space-y-2 text-sm">
            <Row icon={<Hash className="w-3.5 h-3.5" />} label={lang === 'ms' ? 'No. Sijil' : 'Certificate No.'} value={cert.certNumber} />
            <Row icon={<Hash className="w-3.5 h-3.5" />} label={lang === 'ms' ? 'Kod Pengesahan' : 'Verify Code'} value={cert.verifyCode} mono />
            <Row icon={<UserIcon className="w-3.5 h-3.5" />} label={lang === 'ms' ? 'Penerima' : 'Recipient'} value={cert.recipientName} />
            <Row icon={<Building2 className="w-3.5 h-3.5" />} label={tr('campus', lang)} value={cert.campus?.name} />
            <Row icon={<Calendar className="w-3.5 h-3.5" />} label={tr('issued', lang)} value={fmtDate(cert.issuedAt, lang)} />
            <Row icon={<ShieldCheck className="w-3.5 h-3.5" />} label={tr('status', lang)} value={cert.status === 'valid' ? tr('valid', lang) : tr('revoked', lang)} valueClass={cert.status === 'valid' ? 'text-emerald-500' : 'text-rose-500'} />
          </dl>
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="font-semibold text-sm mb-3">{lang === 'ms' ? 'Tindakan' : 'Actions'}</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="glass border-white/20" onClick={() => toast.success('PDF dimuat turun')}><Download className="w-4 h-4" /> PDF</Button>
            <Button variant="outline" className="glass border-white/20" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/?verify=${cert.verifyCode}`); toast.success(lang === 'ms' ? 'Pautan disalin' : 'Link copied') }}><Share2 className="w-4 h-4" /> {tr('share', lang)}</Button>
            <Button variant="outline" className="glass border-white/20" onClick={() => window.print()}><Printer className="w-4 h-4" /> Cetak</Button>
            <Button variant="outline" className="glass border-white/20" onClick={() => setView('verify', { code: cert.verifyCode })}><ShieldCheck className="w-4 h-4" /> {tr('verify', lang)}</Button>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{lang === 'ms' ? 'Sijil ini sah dan boleh disahkan secara umum melalui kod QR.' : 'This certificate is valid and publicly verifiable via QR code.'}</span>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function Row({ icon, label, value, mono, valueClass }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground flex items-center gap-1.5">{icon} {label}</dt>
      <dd className={cn('font-medium text-right truncate', mono && 'font-mono text-xs', valueClass)}>{value}</dd>
    </div>
  )
}

// Pseudo-QR placeholder (visual block pattern derived from the verify code)
function QRPlaceholder({ text }: { text: string }) {
  const size = 21
  const cells: boolean[] = []
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    cells.push(((h >> 16) & 1) === 1)
  }
  // Add finder patterns corners
  const inFinder = (r: number, c: number) => {
    const f = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7 && !(r === br + 6 || c === bc + 6 || (r === br && c === bc) || (r >= br + 2 && r <= br + 4 && c >= bc + 2 && c <= bc + 4) ? false : (r === br || r === br + 6 || c === bc || c === bc + 6) || (r >= br + 2 && r <= br + 4 && c >= bc + 2 && c <= bc + 4))
    return f(0, 0) || f(0, size - 7) || f(size - 7, 0)
  }
  return (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {cells.map((on, i) => {
        const r = Math.floor(i / size), c = i % size
        const finder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7)
        const draw = finder ? inFinder(r, c) : on
        return <div key={i} className={cn(draw ? 'bg-black' : 'bg-white')} />
      })}
    </div>
  )
}
