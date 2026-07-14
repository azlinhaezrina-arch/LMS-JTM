'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar, Pill, timeAgo } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { MessageSquare, Plus, Pin, CheckCircle2, Eye, MessageCircle, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ForumThread } from '@/lib/types'

export function ForumView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const [threads, setThreads] = React.useState<ForumThread[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [newOpen, setNewOpen] = React.useState(false)
  const [form, setForm] = React.useState({ title: '', body: '', tags: '' })

  const load = () => {
    setLoading(true)
    api.threads().then(({ threads }) => { setThreads(threads); setLoading(false) })
  }
  React.useEffect(load, [])

  const filtered = threads.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase()))

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Tajuk dan kandungan diperlukan'); return }
    try {
      const tags = form.tags.split(',').map((s) => s.trim()).filter(Boolean)
      await api.createThread({ title: form.title, body: form.body, tags })
      toast.success(lang === 'ms' ? 'Thread dicipta +10 mata' : 'Thread created +10 pts')
      setForm({ title: '', body: '', tags: '' })
      setNewOpen(false)
      load()
    } catch (e) { toast.error('Gagal') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><MessageSquare className="w-6 h-6 text-emerald-500" /> {tr('forum', lang)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{lang === 'ms' ? 'Perbincangan komuniti TVET JTM' : 'JTM TVET community discussions'}</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
              <Plus className="w-4 h-4" /> {tr('newThread', lang)}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-w-lg">
            <DialogHeader><DialogTitle>{tr('newThread', lang)}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder={lang === 'ms' ? 'Tajuk perbincangan' : 'Thread title'} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="glass bg-white/5" />
              <Textarea placeholder={lang === 'ms' ? 'Terangkan soalan atau topik anda...' : 'Describe your question or topic...'} value={form.body} rows={5} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="glass bg-white/5 resize-none" />
              <Input placeholder={lang === 'ms' ? 'Tag (dipisah koma): mekatronik, sql, bantuan' : 'Tags (comma-separated): mechatronics, sql, help'} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="glass bg-white/5" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="glass border-white/20" onClick={() => setNewOpen(false)}>{tr('cancel', lang)}</Button>
                <Button onClick={submit} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">{tr('send', lang)}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr('search', lang)} className="glass bg-white/5 pl-10" />
        </div>
      </GlassCard>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl glass" />)}</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center text-muted-foreground">{tr('noData', lang)}</GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <GlassCard key={t.id} hover className="p-4" onClick={() => setView('thread', { id: t.id })}>
              <div className="flex gap-3">
                <Avatar name={t.user.name} src={t.user.avatarUrl} size={42} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                    {t.isResolved && <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> {tr('resolved', lang)}</span>}
                    <h3 className="font-semibold text-sm hover:text-emerald-500 transition line-clamp-1">{t.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>{t.user.name}</span>
                    <span>·</span>
                    <span>{timeAgo(t.createdAt, lang)}</span>
                    {t.tags?.length > 0 && t.tags.map((tag) => <Pill key={tag} color="teal" className="text-[10px]">{tag}</Pill>)}
                    <span className="flex items-center gap-1 ml-auto"><Eye className="w-3 h-3" /> {t.views}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {t.postCount}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
