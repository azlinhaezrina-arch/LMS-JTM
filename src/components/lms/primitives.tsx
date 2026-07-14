'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Cog, Zap, Code, Car, Factory, Cpu, Utensils, Shirt, Building, Briefcase,
  BookOpen, Award, GraduationCap, Flame, CheckCircle, MessageSquare, TrendingUp,
  HandHeart, ArrowRight, type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ICON_MAP: Record<string, LucideIcon> = {
  cog: Cog, zap: Zap, code: Code, car: Car, factory: Factory, cpu: Cpu,
  utensils: Utensils, shirt: Shirt, building: Building, briefcase: Briefcase,
  'book-open': BookOpen, award: Award, 'graduation-cap': GraduationCap,
  flame: Flame, 'check-circle': CheckCircle, 'message-square': MessageSquare,
  'trending-up': TrendingUp, 'hand-heart': HandHeart,
}

export function DynIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || BookOpen
  return <Icon className={className} />
}

export const COLOR_MAP: Record<string, { bg: string; text: string; ring: string; solid: string }> = {
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/30', solid: 'bg-emerald-500' },
  teal: { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-500/30', solid: 'bg-teal-500' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/30', solid: 'bg-amber-500' },
  gold: { bg: 'bg-yellow-500/15', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-500/30', solid: 'bg-yellow-500' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/30', solid: 'bg-rose-500' },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/30', solid: 'bg-violet-500' },
}

export function colorClasses(color: string) {
  return COLOR_MAP[color] || COLOR_MAP.emerald
}

export function GlassCard({
  children, className, hover = false, strong = false, ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean; strong?: boolean }) {
  return (
    <div
      className={cn(
        'glass glass-edge rounded-2xl',
        strong && 'glass-strong',
        hover && 'glass-hover cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function StatCard({
  icon, label, value, sub, color = 'emerald', trend,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string
  color?: string; trend?: { value: number; positive: boolean }
}) {
  const c = colorClasses(color)
  return (
    <GlassCard className="p-5 relative overflow-hidden group">
      <div className={cn('absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-50', c.solid)} />
      <div className="relative flex items-start justify-between">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center ring-1', c.bg, c.text, c.ring)}>
          {icon}
        </div>
        {trend && (
          <span className={cn('text-xs font-semibold flex items-center gap-0.5', trend.positive ? 'text-emerald-500' : 'text-rose-500')}>
            <TrendingUp className={cn('w-3 h-3', !trend.positive && 'rotate-180')} />
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground/70 mt-1">{sub}</div>}
      </div>
    </GlassCard>
  )
}

export function ProgressRing({
  value, size = 64, stroke = 6, color = '#059669', label,
}: {
  value: number; size?: number; stroke?: number; color?: string; label?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold tabular-nums">{value}%</span>
        {label && <span className="text-[9px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="relative rounded-full overflow-hidden flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-white/20"
      style={{
        width: size, height: size,
        background: src ? undefined : `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 40%))`,
        fontSize: size * 0.38,
      }}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  )
}

export function Pill({ children, color = 'emerald', className }: { children: React.ReactNode; color?: string; className?: string }) {
  const c = colorClasses(color)
  return <span className={cn('tag', c.bg, c.text, className)}>{children}</span>
}

export function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = { beginner: 'emerald', intermediate: 'amber', advanced: 'rose' }
  const label: Record<string, string> = { beginner: 'Asas', intermediate: 'Pertengahan', advanced: 'Lanjutan' }
  return <Pill color={map[level] || 'emerald'}>{label[level] || level}</Pill>
}

export function fmtNum(n: number) {
  return new Intl.NumberFormat('ms-MY').format(n)
}
export function fmtDate(d: string | Date | null, lang: 'ms' | 'en' = 'ms') {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}
export function fmtDateTime(d: string | Date | null, lang: 'ms' | 'en' = 'ms') {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat(lang === 'ms' ? 'ms-MY' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}
export function timeAgo(d: string | Date, lang: 'ms' | 'en' = 'ms') {
  const date = typeof d === 'string' ? new Date(d) : d
  const sec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (sec < 60) return lang === 'ms' ? 'baru saja' : 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return lang === 'ms' ? `${min} min lalu` : `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return lang === 'ms' ? `${hr} jam lalu` : `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return lang === 'ms' ? `${day} hari lalu` : `${day}d ago`
  return fmtDate(date, lang)
}

export function EmptyState({ icon, text, action, actionLabel }: { icon: React.ReactNode; text: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-muted-foreground mb-3">{icon}</div>
      <p className="text-sm text-muted-foreground mb-3">{text}</p>
      {action && actionLabel && (
        <Button onClick={action} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  )
}
