'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar, Pill, EmptyState, fmtDate } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Award, Download, Share2, QrCode, Search, ShieldCheck, ArrowRight, Calendar, MapPin, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Certificate } from '@/lib/types'

export function CertificatesView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const [certs, setCerts] = React.useState<Certificate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [verifyCode, setVerifyCode] = React.useState('')

  React.useEffect(() => {
    api.certificates().then(({ certificates }) => { setCerts(certificates); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleVerify = () => {
    if (!verifyCode.trim()) return
    setView('verify', { code: verifyCode.trim() })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tr('certificates', lang)}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{lang === 'ms' ? 'Sijil digital anda dengan pengesahan QR' : 'Your digital certificates with QR verification'}</p>
      </div>

      {/* Verify box */}
      <GlassCard strong className="p-5 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center ring-1 ring-emerald-500/30 shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold">{lang === 'ms' ? 'Sahkan Sijil Digital' : 'Verify Digital Certificate'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{lang === 'ms' ? 'Masukkan kod pengesahan dari QR sijil' : 'Enter the verification code from certificate QR'}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="JTM-XXXXXXXX" className="glass bg-white/5 border-white/10 font-mono text-sm" />
            <Button onClick={handleVerify} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shrink-0"><Search className="w-4 h-4" /> {tr('verify', lang)}</Button>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl glass" />)}</div>
      ) : certs.length === 0 ? (
        <GlassCard className="p-12">
          <EmptyState icon={<Award className="w-8 h-8" />} text={lang === 'ms' ? 'Anda belum mempunyai sijil. Siapkan kursus untuk menerimanya!' : 'No certificates yet. Complete a course to earn one!'} action={() => setView('catalog')} actionLabel={tr('catalog', lang)} />
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {certs.map((cert) => <CertCard key={cert.id} cert={cert} onOpen={() => setView('certificate', { id: cert.id })} />)}
        </div>
      )}
    </div>
  )
}

function CertCard({ cert, onOpen }: { cert: Certificate; onOpen: () => void }) {
  const lang = useStore((s) => s.lang)
  const gradeColor: Record<string, string> = { 'A+': 'emerald', 'A': 'emerald', 'A-': 'teal', 'B+': 'amber', 'B': 'amber', 'Lulus': 'teal' }
  return (
    <GlassCard hover className="overflow-hidden" onClick={onOpen}>
      {/* Certificate ribbon header */}
      <div className="relative h-32 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-5 flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 12px)' }} />
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-400/30 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center"><Award className="w-5 h-5 text-white" /></div>
            <div>
              <div className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">{tr('org', lang)}</div>
              <div className="text-xs text-white font-medium">Sijil Penyiapan Kursus</div>
            </div>
          </div>
          <Pill color={gradeColor[cert.grade] || 'emerald'} className="bg-white/20 text-white backdrop-blur border border-white/20">{cert.grade}</Pill>
        </div>
        <div className="relative text-white">
          <div className="text-[10px] text-white/70 uppercase tracking-wider">{tr('certificates', lang)}</div>
          <div className="font-bold text-sm line-clamp-1">{cert.course.title}</div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={cert.recipientName} size={36} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{cert.recipientName}</div>
            <div className="text-xs text-muted-foreground font-mono">{cert.certNumber}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-500">{cert.score}%</div>
            <div className="text-[10px] text-muted-foreground">{tr('score', lang)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3 h-3" /> {fmtDate(cert.issuedAt, lang)}</div>
          <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3 h-3" /> {cert.campus?.code}</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> <span>{tr('valid', lang)} · QR Sah</span>
          <span className="text-muted-foreground ml-auto font-mono">{cert.verifyCode}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="glass flex-1" onClick={(e) => { e.stopPropagation(); onOpen() }}>
            <QrCode className="w-3.5 h-3.5" /> {tr('view', lang)} QR
          </Button>
          <Button size="sm" variant="ghost" className="glass" onClick={(e) => { e.stopPropagation(); toast.success(lang === 'ms' ? 'Pautan disalin' : 'Link copied') }}>
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="glass" onClick={(e) => { e.stopPropagation(); toast.success('PDF dimuat turun') }}>
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}
