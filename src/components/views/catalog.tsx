'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, DynIcon, colorClasses, LevelBadge, Avatar, fmtNum, Pill } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { BookOpen, Search, Star, Users, Clock, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Course } from '@/lib/types'
import { toast } from 'sonner'

export function CatalogView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const view = useStore((s) => s.view)
  const setCoursesCache = useStore((s) => s.setCoursesCache)
  const coursesCache = useStore((s) => s.coursesCache)

  const [courses, setCourses] = React.useState<Course[]>(coursesCache)
  const [loading, setLoading] = React.useState(coursesCache.length === 0)
  const [search, setSearch] = React.useState(view.params?.search || '')
  const [category, setCategory] = React.useState<string>('')
  const [level, setLevel] = React.useState<string>('')

  const categories = React.useMemo(() => {
    const map = new Map<string, string>()
    courses.forEach((c) => { if (c.category) map.set(c.category.id, c.category.name) })
    return Array.from(map.entries())
  }, [courses])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (category) params.categoryId = category
      if (level) params.level = level
      const { courses: cs } = await api.courses(params)
      setCourses(cs)
      setCoursesCache(cs)
    } catch (e) { toast.error('Gagal memuatkan kursus') }
    finally { setLoading(false) }
  }, [search, category, level, setCoursesCache])

  React.useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const filtered = courses

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tr('catalog', lang)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === 'ms' ? 'Terokai' : 'Explore'} {fmtNum(filtered.length)} {lang === 'ms' ? 'kursus TVET merentas 33 kampus ADTEC' : 'TVET courses across 33 ADTEC campuses'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr('search', lang)} className="glass bg-white/5 border-white/10 pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
              <option value="">{tr('category', lang)}: {tr('all', lang)}</option>
              {categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="glass bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
              <option value="">{tr('level', lang)}: {tr('all', lang)}</option>
              <option value="beginner">{lang === 'ms' ? 'Asas' : 'Beginner'}</option>
              <option value="intermediate">{lang === 'ms' ? 'Pertengahan' : 'Intermediate'}</option>
              <option value="advanced">{lang === 'ms' ? 'Lanjutan' : 'Advanced'}</option>
            </select>
            {(search || category || level) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory(''); setLevel('') }} className="glass">
                <X className="w-4 h-4" /> Clear
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl glass" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{tr('noData', lang)}</p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => <CourseCard key={c.id} course={c} onOpen={() => setView('course', { id: c.id })} onEnroll={async () => {
            try { await api.enroll(c.id); toast.success(lang === 'ms' ? 'Pendaftaran berjaya!' : 'Enrolled successfully!'); load() }
            catch (e) { toast.error(e instanceof Error ? e.message : 'Gagal') }
          }} />)}
        </div>
      )}
    </div>
  )
}

function CourseCard({ course, onOpen, onEnroll }: { course: Course; onOpen: () => void; onEnroll: () => void }) {
  const lang = useStore((s) => s.lang)
  const c = colorClasses(course.coverColor)
  const enrolled = course.enrollment?.status
  const isFull = course.enrolledCount >= course.quota

  return (
    <GlassCard hover className="overflow-hidden flex flex-col" onClick={onOpen}>
      {/* Cover */}
      <div className={cn('relative h-28 flex items-center justify-center overflow-hidden', c.bg)}>
        <div className={cn('absolute inset-0 opacity-20', c.solid)} />
        <DynIcon name={course.coverIcon} className={cn('w-14 h-14 relative', c.text)} />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <LevelBadge level={course.level} />
        </div>
        <div className="absolute bottom-2 left-2">
          <Pill color={course.coverColor} className="bg-black/30 text-white backdrop-blur">{course.category?.name}</Pill>
        </div>
      </div>
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[10px] font-mono text-muted-foreground">{course.code}</div>
        <h3 className="font-semibold text-sm leading-snug mt-0.5 line-clamp-2">{course.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {course.rating}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrolledCount}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.durationHours}{tr('hours', lang)}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] text-muted-foreground">{tr('campus', lang)}:</span>
          <span className="text-[11px] font-medium">{course.campus?.code}</span>
        </div>
        {course.competencies && course.competencies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {course.competencies.slice(0, 2).map((comp) => (
              <span key={comp.id} className="text-[9px] px-1.5 py-0.5 rounded glass font-mono">{comp.code}</span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-3">
          {enrolled ? (
            <Button size="sm" className="w-full glass bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25" onClick={(e) => { e.stopPropagation(); onOpen() }}>
              {enrolled === 'completed' ? tr('completed', lang) : tr('continue', lang)}
            </Button>
          ) : isFull ? (
            <Button size="sm" disabled className="w-full glass opacity-60">{lang === 'ms' ? 'Kuota Penuh' : 'Full'}</Button>
          ) : (
            <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white" onClick={(e) => { e.stopPropagation(); onEnroll() }}>
              {tr('enroll', lang)}
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
