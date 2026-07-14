'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar, Pill, timeAgo } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Pin, CheckCircle2, Eye, MessageCircle, Send, BookOpen, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThreadView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const setView = useStore((s) => s.setView)
  const view = useStore((s) => s.view)
  const [thread, setThread] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [reply, setReply] = React.useState('')
  const [posting, setPosting] = React.useState(false)

  const load = () => {
    api.thread(view.params?.id || '').then(({ thread }) => { setThread(thread); setLoading(false) })
      .catch(() => { toast.error('Thread tidak dijumpai'); setView('forum') })
  }
  React.useEffect(load, [view.params?.id])

  const submitReply = async () => {
    if (!reply.trim()) return
    setPosting(true)
    try {
      await api.createPost(view.params?.id || '', { body: reply })
      setReply('')
      toast.success(lang === 'ms' ? 'Balasan dihantar +5 mata' : 'Reply posted +5 pts')
      load()
    } catch { toast.error('Gagal') }
    finally { setPosting(false) }
  }

  if (loading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl glass" />)}</div>
  if (!thread) return null

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <button onClick={() => setView('forum')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-4 h-4" /> {tr('forum', lang)}
      </button>

      {/* Thread */}
      <GlassCard strong className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {thread.isPinned && <Pill color="amber"><Pin className="w-3 h-3" /> {tr('pinned', lang)}</Pill>}
          {thread.isResolved && <Pill color="emerald"><CheckCircle2 className="w-3 h-3" /> {tr('resolved', lang)}</Pill>}
          {thread.course && <Pill color="teal"><BookOpen className="w-3 h-3" /> {thread.course.code}</Pill>}
          {thread.tags?.map((tag: string) => <Pill key={tag} color="violet">{tag}</Pill>)}
        </div>
        <h1 className="text-xl font-bold tracking-tight">{thread.title}</h1>
        <div className="flex items-center gap-3 mt-3">
          <Avatar name={thread.user.name} src={thread.user.avatarUrl} size={36} />
          <div>
            <div className="text-sm font-medium">{thread.user.name}</div>
            <div className="text-xs text-muted-foreground">{tr(`role_${thread.user.role}` as any, lang)} · {timeAgo(thread.createdAt, lang)}</div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {thread.views} {tr('views', lang)}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {thread.posts?.length || 0} {tr('replies', lang)}</span>
          </div>
        </div>
        <p className="text-sm text-foreground/90 mt-4 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
      </GlassCard>

      {/* Posts */}
      {thread.posts?.filter((p: any) => p.body !== thread.body).map((post: any) => (
        <GlassCard key={post.id} className={cn('p-4', post.isAnswer && 'ring-2 ring-emerald-500/30')}>
          {post.isAnswer && <div className="text-xs text-emerald-500 font-medium flex items-center gap-1 mb-2"><CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'ms' ? 'Jawapan Dipilih' : 'Selected Answer'}</div>}
          <div className="flex gap-3">
            <Avatar name={post.user.name} src={post.user.avatarUrl} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{post.user.name}</span>
                <span className="text-xs text-muted-foreground">· {timeAgo(post.createdAt, lang)}</span>
              </div>
              <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed whitespace-pre-wrap">{post.body}</p>
              <div className="flex items-center gap-3 mt-2">
                <button className="text-xs text-muted-foreground hover:text-emerald-500 flex items-center gap-1 transition"><ThumbsUp className="w-3.5 h-3.5" /> {post.likes}</button>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}

      {/* Reply box */}
      <GlassCard className="p-4">
        <div className="flex gap-3">
          <Avatar name={user.name} src={user.avatarUrl} size={36} />
          <div className="flex-1">
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={lang === 'ms' ? 'Tulis balasan anda...' : 'Write your reply...'} rows={3} className="glass bg-white/5 resize-none" />
            <div className="flex justify-end mt-2">
              <Button onClick={submitReply} disabled={posting || !reply.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <Send className="w-4 h-4" /> {tr('reply', lang)}
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
