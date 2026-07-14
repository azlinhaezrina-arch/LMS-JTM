'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, fmtDate } from '@/components/lms/primitives'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldCheck, CheckCircle2, XCircle, ArrowLeft, Hash, User, Building2, Calendar, Award } from 'lucide-react'

export function VerifyView() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const lang = useStore((s) => s.lang)
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const code = view.params?.code
    if (!code) return
    api.verifyCert(code).then(({ certificate }) => { setData(certificate); setLoading(false) })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Tidak sah'); setLoading(false) })
  }, [view.params])

  if (loading) return <div className="max-w-xl mx-auto"><Skeleton className="h-96 rounded-2xl glass" /></div>

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <GlassCard className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-4"><XCircle className="w-8 h-8" /></div>
          <h2 className="text-xl font-bold text-rose-500">{lang === 'ms' ? 'Sijil Tidak Sah' : 'Invalid Certificate'}</h2>
          <p className="text-sm text-muted-foreground mt-2">{error || (lang === 'ms' ? 'Kod pengesahan tidak dijumpai.' : 'Verification code not found.')}</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <button onClick={() => setView('certificates')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-4 h-4" /> {tr('certificates', lang)}
      </button>

      <GlassCard strong className="p-6 text-center relative overflow-hidden">
        <div className={data.valid ? 'absolute inset-0 bg-emerald-500/5' : 'absolute inset-0 bg-rose-500/5'} />
        <div className="relative">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${data.valid ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
            {data.valid ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>
          <h2 className={`text-2xl font-bold ${data.valid ? 'text-emerald-500' : 'text-rose-500'}`}>
            {data.valid ? (lang === 'ms' ? 'Sijil Sah' : 'Certificate Valid') : (lang === 'ms' ? 'Sijil Dibatalkan' : 'Certificate Revoked')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'ms' ? 'Disahkan oleh' : 'Verified by'} {data.signature}</p>

          <div className="mt-6 text-left space-y-2.5">
            <Row icon={<Hash className="w-3.5 h-3.5" />} label={lang === 'ms' ? 'No. Sijil' : 'Certificate No.'} value={data.certNumber} mono />
            <Row icon={<User className="w-3.5 h-3.5" />} label={lang === 'ms' ? 'Penerima' : 'Recipient'} value={data.recipientName} />
            <Row icon={<Award className="w-3.5 h-3.5" />} label={lang === 'ms' ? 'Kursus' : 'Course'} value={data.courseTitle} />
            <Row icon={<Building2 className="w-3.5 h-3.5" />} label={tr('campus', lang)} value={data.campusName} />
            <Row icon={<Calendar className="w-3.5 h-3.5" />} label={tr('issued', lang)} value={fmtDate(data.issuedAt, lang)} />
            <Row icon={<ShieldCheck className="w-3.5 h-3.5" />} label={lang === 'ms' ? 'Skor' : 'Score'} value={`${data.score}% (${data.grade})`} />
          </div>

          <div className={`mt-5 px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 ${data.valid ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
            <ShieldCheck className="w-4 h-4" />
            {data.valid
              ? (lang === 'ms' ? 'Sijil ini sah dan aktif dalam pangkalan data JTM.' : 'This certificate is valid and active in JTM records.')
              : (lang === 'ms' ? 'Sijil ini telah dibatalkan. Hubungi JTM.' : 'This certificate has been revoked. Contact JTM.')}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 glass rounded-lg px-3 py-2">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">{icon} {label}</span>
      <span className={`text-sm font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
