'use client'

import * as React from 'react'
import { useStore } from '@/lib/store'
import { tr } from '@/lib/i18n'
import { api } from '@/lib/api-client'
import { GlassCard, Avatar } from '@/components/lms/primitives'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, Sparkles, User, Loader2, Trash2, Lightbulb, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AIMessage } from '@/lib/types'
import { toast } from 'sonner'

const SUGGESTIONS = [
  { ms: 'Terangkan apakah itu PLC dan fungsinya', en: 'Explain what a PLC is and its function' },
  { ms: 'Bagaimana saya mula belajar SQL dari awal?', en: 'How do I start learning SQL from scratch?' },
  { ms: 'Apakah perbezaan SKM dan NOSS?', en: 'What is the difference between SKM and NOSS?' },
  { ms: 'Tip untuk lulus penilaian kompetensi', en: 'Tips to pass competency assessment' },
]

export function AIAssistantView() {
  const user = useStore((s) => s.user)!
  const lang = useStore((s) => s.lang)
  const [messages, setMessages] = React.useState<AIMessage[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [degraded, setDegraded] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    api.aiHistory().then(({ messages }) => {
      if (messages.length) setMessages(messages)
      else setMessages([{ role: 'assistant', content: tr('aiGreeting', lang), ts: Date.now() }])
    }).catch(() => setMessages([{ role: 'assistant', content: tr('aiGreeting', lang), ts: Date.now() }]))
  }, [lang])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    const userMsg: AIMessage = { role: 'user', content: msg, ts: Date.now() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)
    try {
      const { reply, degraded: d } = await api.aiChat({ message: msg, history: messages })
      setMessages((m) => [...m, { role: 'assistant', content: reply, ts: Date.now() }])
      setDegraded(!!d)
      if (d) toast.warning(lang === 'ms' ? 'Cikgu AI dalam mod terdegradasi' : 'AI Tutor in degraded mode')
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: lang === 'ms' ? 'Maaf, berlaku ralat. Cuba lagi.' : 'Sorry, an error occurred. Try again.', ts: Date.now() }])
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 h-[calc(100vh-9rem)] flex flex-col">
      {/* Header */}
      <GlassCard strong className="p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg glow-emerald">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <h1 className="font-bold flex items-center gap-2">
              {tr('aiAssistant', lang)}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-medium">GLM 5.2</span>
            </h1>
            <p className="text-xs text-muted-foreground">{lang === 'ms' ? 'Pembantu pembelajaran maya · Konteks: ' : 'AI learning tutor · Context: '}{user.campus?.code || 'JTM-HQ'}</p>
          </div>
        </div>
        {messages.length > 1 && (
          <Button variant="ghost" size="sm" className="glass" onClick={() => setMessages([{ role: 'assistant', content: tr('aiGreeting', lang), ts: Date.now() }])}>
            <Trash2 className="w-4 h-4" /> {lang === 'ms' ? 'Padam' : 'Clear'}
          </Button>
        )}
      </GlassCard>

      {/* Messages */}
      <GlassCard className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-3 animate-fade-up', m.role === 'user' && 'flex-row-reverse')}>
              {m.role === 'assistant' ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>
              ) : (
                <Avatar name={user.name} src={user.avatarUrl} size={32} />
              )}
              <div className={cn('max-w-[80%] rounded-2xl px-4 py-2.5', m.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm' : 'glass rounded-tl-sm')}>
                <MessageContent content={m.content} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span className="text-sm text-muted-foreground">{lang === 'ms' ? 'Cikgu AI menaip...' : 'AI typing...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s[lang])} className="glass rounded-full px-3 py-1.5 text-xs hover:scale-105 hover:border-emerald-500/30 transition flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3 text-amber-500" /> {s[lang]}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={tr('askAnything', lang)}
            className="flex-1 glass rounded-xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </GlassCard>

      {degraded && (
        <div className="text-xs text-amber-500 flex items-center gap-1.5 justify-center">
          <Lightbulb className="w-3.5 h-3.5" /> {lang === 'ms' ? 'Cikgu AI berjalan dalam mod fallback (ralat perkhidmatan AI)' : 'AI Tutor running in fallback mode (AI service error)'}
        </div>
      )}
    </div>
  )
}

// Simple markdown-ish renderer
function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="text-sm leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-sm mt-2 first:mt-0">{line.slice(3)}</h3>
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-1.5">{line.slice(4)}</h4>
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="flex gap-2"><span className="text-emerald-500">•</span><span>{formatInline(line.slice(2))}</span></div>
        if (line.startsWith('💡')) return <div key={i} className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /><span>{formatInline(line.replace('💡', '').replace('Tip:', '').replace('💡 Tip:', '').trim())}</span></div>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="whitespace-pre-wrap">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  // **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
    ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
    : <React.Fragment key={i}>{p}</React.Fragment>
  )
}
