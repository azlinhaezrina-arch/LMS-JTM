'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, DynIcon, colorClasses, LevelBadge, Avatar, Pill, ProgressRing, fmtDate, fmtNum } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toast } from 'sonner'
import {
  ArrowLeft, Star, Users, Clock, Award, Play, FileText, Video, Box, CheckCircle2,
  Lock, Download, BookOpen, Cpu, FileQuestion, Trophy, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />, scorm: <Box className="w-4 h-4" />,
  h5p: <Cpu className="w-4 h-4" />, pdf: <FileText className="w-4 h-4" />,
  article: <BookOpen className="w-4 h-4" />, articulate: <Play className="w-4 h-4" />,
}

export function CourseDetailView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const view = useStore((s) => s.view)
  const courseId = view.params?.id

  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeContent, setActiveContent] = React.useState<any>(null)
  const [quizOpen, setQuizOpen] = React.useState(false)

  React.useEffect(() => {
    if (!courseId) return
    api.course(courseId).then(({ course }) => { setData(course); setLoading(false) })
      .catch(() => { toast.error('Kursus tidak dijumpai'); setView('catalog') })
  }, [courseId, setView])

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl glass" />)}</div>
  if (!data) return null

  const c = colorClasses(data.coverColor)
  const enrolled = data.myEnrollment
  const totalContents = data.modules.reduce((s: number, m: any) => s + m.contents.length, 0)

  const handleEnroll = async () => {
    try { await api.enroll(data.id); toast.success(tr('enrolled', lang)); setView('course', { id: data.id }) }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Gagal') }
  }

  const markComplete = async (contentId: string, enrollmentId: string) => {
    try {
      await api.updateProgress({ enrollmentId, contentId, status: 'completed', timeSpentSec: 120 })
      const { course } = await api.course(data.id)
      setData(course)
      toast.success(lang === 'ms' ? 'Modul ditandakan selesai +25 mata' : 'Module marked complete +25 pts')
    } catch { toast.error('Gagal') }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => setView('catalog')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-4 h-4" /> {tr('backToCatalog', lang)}
      </button>

      {/* Header */}
      <GlassCard strong className="p-6 relative overflow-hidden">
        <div className={cn('absolute -right-10 -top-10 w-56 h-56 rounded-full blur-3xl opacity-20', c.solid)} />
        <div className="relative flex flex-col lg:flex-row gap-6">
          <div className={cn('w-full lg:w-48 h-32 rounded-2xl flex items-center justify-center ring-1 shrink-0', c.bg, c.ring)}>
            <DynIcon name={data.coverIcon} className={cn('w-16 h-16', c.text)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-mono text-muted-foreground">{data.code}</span>
              <LevelBadge level={data.level} />
              <Pill color={data.coverColor}>{data.category?.name}</Pill>
              <Pill color="teal">{data.format}</Pill>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{data.title}</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed line-clamp-3">{data.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm flex-wrap">
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {data.rating} <span className="text-muted-foreground">({data.ratingCount})</span></span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground" /> {data.enrolledCount}/{data.quota}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" /> {data.durationHours} {tr('hours', lang)}</span>
              <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-muted-foreground" /> {data.credits} {tr('credits', lang)}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-muted-foreground" /> {data.modules.length} {tr('modules', lang)}</span>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {data.instructor && (
                <div className="flex items-center gap-2 glass rounded-lg px-2.5 py-1.5">
                  <Avatar name={data.instructor.name} src={data.instructor.avatarUrl} size={24} />
                  <span className="text-xs">{data.instructor.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 glass rounded-lg px-2.5 py-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5" /> {data.campus?.name}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {enrolled ? (
                <>
                  <div className="flex items-center gap-3 glass rounded-xl px-4 py-2">
                    <ProgressRing value={enrolled.progressPct} size={44} />
                    <div>
                      <div className="text-xs text-muted-foreground">{tr('progress', lang)}</div>
                      <div className="font-semibold text-sm">{enrolled.progressPct}% {enrolled.status === 'completed' && `· ${tr('completed', lang)}`}</div>
                    </div>
                  </div>
                  {data.quizzes?.[0] && (
                    <Button variant="outline" className="glass border-white/20" onClick={() => setQuizOpen(true)}>
                      <FileQuestion className="w-4 h-4" /> {tr('startQuiz', lang)}
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={handleEnroll} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
                  <Zap className="w-4 h-4" /> {tr('enroll', lang)}
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Curriculum */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-5">
            <h2 className="font-semibold mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-500" /> {tr('curriculum', lang)}</h2>
            <p className="text-xs text-muted-foreground mb-4">{data.modules.length} {tr('modules', lang)} · {totalContents} {tr('lessons', lang)}</p>
            <Accordion type="multiple" defaultValue={[data.modules[0]?.id]} className="space-y-2">
              {data.modules.map((m: any, mi: number) => {
                const moduleProgress = m.contents.length ? Math.round(m.contents.filter((c: any) => c.progress?.status === 'completed').length / m.contents.length * 100) : 0
                return (
                  <AccordionItem key={m.id} value={m.id} className="glass rounded-xl border-0 overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', moduleProgress === 100 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                          {moduleProgress === 100 ? <CheckCircle2 className="w-4 h-4" /> : mi + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{m.title}</div>
                          <div className="text-xs text-muted-foreground">{m.contents.length} {tr('lessons', lang)} · {m.durationMin} min {m.isLocked && '· 🔒'}</div>
                        </div>
                        {moduleProgress > 0 && <span className="text-xs text-emerald-500 font-medium">{moduleProgress}%</span>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-1">
                        {m.contents.map((content: any) => {
                          const done = content.progress?.status === 'completed'
                          return (
                            <div key={content.id} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg transition group', done ? 'bg-emerald-500/5' : 'hover:bg-white/5')}>
                              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', done ? 'bg-emerald-500/20 text-emerald-500' : TYPE_ICON[content.type] ? 'bg-muted text-muted-foreground' : 'bg-muted')}>
                                {done ? <CheckCircle2 className="w-4 h-4" /> : TYPE_ICON[content.type]}
                              </div>
                              <button onClick={() => setActiveContent(content)} className="flex-1 text-left min-w-0">
                                <div className="text-sm truncate group-hover:text-emerald-500 transition">{content.title}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{content.type} · {content.durationSec ? `${Math.round(content.durationSec / 60)} min` : `${content.sizeKb} KB`}</div>
                              </button>
                              {content.isDownloadable && <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-emerald-500 cursor-pointer" />}
                              {enrolled && !done && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs glass" onClick={() => markComplete(content.id, enrolled.id)}>
                                  {tr('completed', lang)}
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </GlassCard>

          {/* Competencies */}
          {data.competencies?.length > 0 && (
            <GlassCard className="p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> {tr('competencies', lang)}</h2>
              <div className="space-y-2">
                {data.competencies.map((comp: any) => (
                  <div key={comp.id} className="flex items-center gap-3 glass rounded-lg p-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center"><Award className="w-4 h-4" /></div>
                    <div className="flex-1">
                      <div className="text-xs font-mono text-amber-500">{comp.code}</div>
                      <div className="text-sm font-medium">{comp.name}</div>
                    </div>
                    <Pill color="amber">{comp.framework} L{comp.level}</Pill>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar — what you'll learn + content viewer */}
        <div className="space-y-4">
          {activeContent && (
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                {TYPE_ICON[activeContent.type]}
                <h3 className="font-semibold text-sm">{activeContent.title}</h3>
              </div>
              <div className="aspect-video rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-white/10">
                {activeContent.type === 'video' ? (
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2"><Play className="w-6 h-6 text-emerald-500" /></div>
                    <div className="text-xs text-muted-foreground">{Math.round(activeContent.durationSec / 60)} min</div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-2" />
                    <div className="text-xs uppercase">{activeContent.type}</div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{activeContent.description}</p>
              {enrolled && activeContent.progress?.status !== 'completed' && (
                <Button size="sm" className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={() => markComplete(activeContent.id, enrolled.id)}>
                  <CheckCircle2 className="w-4 h-4" /> {tr('completed', lang)}
                </Button>
              )}
            </GlassCard>
          )}

          <GlassCard className="p-5">
            <h3 className="font-semibold text-sm mb-3">{tr('whatYouLearn', lang)}</h3>
            <ul className="space-y-2">
              {[
                lang === 'ms' ? 'Konsep asas & terminologi industri' : 'Fundamental concepts & industry terminology',
                lang === 'ms' ? 'Kemahiran amali hands-on' : 'Hands-on practical skills',
                lang === 'ms' ? 'Penyelesaian masalah teknikal' : 'Technical troubleshooting',
                lang === 'ms' ? 'Pematuhan keselamatan & SOP' : 'Safety compliance & SOP',
                lang === 'ms' ? 'Persediaan penilaian kompetensi SKM' : 'SKM competency assessment prep',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* Quiz modal */}
      {quizOpen && data.quizzes?.[0] && (
        <QuizModal quizId={data.quizzes[0].id} enrollmentId={enrolled.id} onClose={() => setQuizOpen(false)} onComplete={() => { setQuizOpen(false); setView('course', { id: data.id }) }} />
      )}
    </div>
  )
}

function QuizModal({ quizId, enrollmentId, onClose, onComplete }: { quizId: string; enrollmentId: string; onClose: () => void; onComplete: () => void }) {
  const lang = useStore((s) => s.lang)
  const [quiz, setQuiz] = React.useState<any>(null)
  const [answers, setAnswers] = React.useState<Record<string, any>>({})
  const [result, setResult] = React.useState<any>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => { api.quiz(quizId).then(({ quiz }) => setQuiz(quiz)) }, [quizId])

  const submit = async () => {
    setSubmitting(true)
    try {
      const { attempt } = await api.submitQuiz(quizId, { enrollmentId, answers })
      setResult(attempt)
      if (attempt.passed) toast.success(tr('passed', lang) + ' +50 mata')
      else toast.error(tr('failed', lang))
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Gagal') }
    finally { setSubmitting(false) }
  }

  if (!quiz) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="glass-strong rounded-2xl p-8">Memuatkan kuiz...</div></div>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-scale-in" onClick={onClose}>
      <div className="glass-strong rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold flex items-center gap-2"><FileQuestion className="w-5 h-5 text-emerald-500" /> {quiz.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{quiz.questionCount} soalan · {quiz.timeLimitMin} min · Lulus: {quiz.passMark}% · Percubaan: {quiz.attempts?.length || 0}/{quiz.maxAttempts}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {result ? (
          <div className="p-6 overflow-y-auto text-center">
            <div className={cn('w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4', result.passed ? 'bg-emerald-500/20' : 'bg-rose-500/20')}>
              <CheckCircle2 className={cn('w-10 h-10', result.passed ? 'text-emerald-500' : 'text-rose-500')} />
            </div>
            <h3 className={cn('text-2xl font-bold', result.passed ? 'text-emerald-500' : 'text-rose-500')}>{result.passed ? tr('passed', lang) : tr('failed', lang)}</h3>
            <p className="text-3xl font-bold mt-2">{result.percentage}%</p>
            <p className="text-sm text-muted-foreground mt-1">{result.score}/{result.maxScore} markah</p>
            {result.passed && <p className="text-xs text-amber-500 mt-3 flex items-center justify-center gap-1"><Award className="w-4 h-4" /> {lang === 'ms' ? 'Anda layak menerima sijil digital!' : 'You qualify for a digital certificate!'}</p>}
            <div className="flex gap-2 mt-6 justify-center">
              <Button variant="outline" className="glass border-white/20" onClick={onClose}>{tr('cancel', lang)}</Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={onComplete}>{tr('view', lang)}</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {quiz.questions.map((q: any, i: number) => (
                <div key={q.id}>
                  <div className="font-medium text-sm mb-3">{i + 1}. {q.text}</div>
                  {q.type === 'mcq' && (
                    <div className="grid gap-2">
                      {q.options.map((opt: any) => (
                        <button key={opt.id} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                          className={cn('flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition', answers[q.id] === opt.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5 glass')}>
                          <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0', answers[q.id] === opt.id ? 'bg-emerald-500 text-white' : 'bg-muted')}>{opt.id.toUpperCase()}</span>
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'true_false' && (
                    <div className="flex gap-2">
                      {['true', 'false'].map((v) => (
                        <button key={v} onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                          className={cn('flex-1 p-3 rounded-lg border text-sm transition', answers[q.id] === v ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5 glass')}>
                          {v === 'true' ? (lang === 'ms' ? 'Betul' : 'True') : (lang === 'ms' ? 'Salah' : 'False')}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'fill_blank' && (
                    <input value={answers[q.id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      placeholder={lang === 'ms' ? 'Taip jawapan...' : 'Type answer...'} className="glass w-full rounded-lg px-3 py-2 text-sm bg-white/5 border border-white/10" />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{Object.keys(answers).length}/{quiz.questions.length} dijawab</span>
              <Button onClick={submit} disabled={submitting || Object.keys(answers).length < quiz.questions.length} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {tr('submitAnswers', lang)}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
