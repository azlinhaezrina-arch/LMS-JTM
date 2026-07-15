import { NextRequest } from 'next/server'
import { supabase, T } from '@/lib/supabase'
import { requireUser } from '@/lib/session'
import { ok, fail, parseBody } from '@/lib/api'
import type { AIMessage } from '@/lib/types'

/**
 * AI Learning Assistant — elearning JTM
 * Powered by GLM via z-ai-web-dev-sdk.
 * Context-aware: knows the learner's role, campus, active courses & competencies.
 * Responds in Bahasa Malaysia by default (respects preferredLang).
 */
export async function POST(req: NextRequest) {
  const user = await requireUser()
  const { message, courseId, history = [] } = await parseBody<{
    message: string; courseId?: string; history?: AIMessage[]
  }>(req)

  if (!message?.trim()) return fail('Mesej diperlukan', 400)

  // Build context: user role, campus, active courses, competencies
  const [{ data: activeEnrollments }, { data: achievedComps }] = await Promise.all([
    supabase
      .from(T.Enrollment)
      .select('status, progressPct, course:Course(title,code)')
      .in('status', ['active', 'completed'])
      .eq('userId', user.id)
      .limit(8),
    supabase
      .from(T.UserCompetency)
      .select('competency:Competency(code,name)')
      .eq('userId', user.id)
      .eq('status', 'achieved')
      .limit(10),
  ])

  let courseContext = ''
  if (courseId) {
    const { data: course } = await supabase
      .from(T.Course)
      .select('title, code, description, category:CourseCategory(name), modules:Module(title)')
      .eq('id', courseId)
      .single()
    if (course) {
      courseContext = `\n\nKonteks kursus semasa:\n- Tajuk: ${course.title} (${course.code})\n- Kategori: ${course.category?.name}\n- Modul: ${(course.modules || []).map((m: any) => m.title).join(', ')}\n- Deskripsi: ${course.description}`
    }
  }

  const lang = user.preferredLang === 'en' ? 'English' : 'Bahasa Malaysia'
  const systemPrompt = `Anda adalah "Cikgu AI", pembantu pembelajaran maya untuk elearning JTM (Jabatan Tenaga Manusia Malaysia) — platform latihan TVET untuk 33 kampus ADTEC.

Identiti pengguna semasa:
- Nama: ${user.name}
- Peranan: ${user.role}
- Kampus: ${user.campus?.name ?? 'JTM HQ'} (${user.campus?.code ?? 'HQ'})
- Kursus aktif: ${(activeEnrollments || []).map((e: any) => `${e.course?.title} (${e.course?.code}, ${e.progressPct}%)`).join('; ') || 'tiada'}
- Kompetensi SKM/NOSS dicapai: ${(achievedComps || []).map((c: any) => c.competency?.code).join(', ') || 'tiada lagi'}
${courseContext}

Tugas anda:
1. Jawab soalan pelajar tentang kandungan kursus, konsep teknikal (mekatronik, elektrik, IT, automotif, dll), dan proses LMS.
2. Berikan penjelasan yang jelas, ringkas dan praktikal dengan contoh.
3. Cadangkan modul atau sumber susulan yang berkaitan.
4. Jika soalan di luar skop pembelajaran, arahkan pelajar ke forum atau pengajar.
5. Jawab dalam ${lang} secara default, kecuali pengguna bertanya dalam bahasa lain.
6. Sertakan ringkasan "💡 Tip" di hujung jawapan jika berkaitan.

Gaya: mesra, profesional, menyokong. Gunakan format Markdown ringkas (tajuk ##, senarai -, **tebal**) untuk kebolehbacaan.`

  const messages: Array<{ role: 'assistant' | 'user'; content: string }> = [
    { role: 'assistant', content: systemPrompt },
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })
    const reply = completion.choices[0]?.message?.content ?? 'Maaf, saya tidak dapat menjana jawapan sekarang. Sila cuba lagi.'

    // Persist conversation (best-effort)
    try {
      const { data: existing } = await supabase
        .from(T.AIConversation)
        .select('id, messages')
        .eq('userId', user.id)
        .is('courseId', courseId ?? null)
        .order('updatedAt', { ascending: false })
        .limit(1)
        .maybeSingle()

      const prevMessages: AIMessage[] = existing?.messages ? (existing.messages as AIMessage[]) : []
      const newMessages = [
        ...prevMessages,
        { role: 'user', content: message, ts: Date.now() },
        { role: 'assistant', content: reply, ts: Date.now() },
      ].slice(-50)

      if (existing) {
        await supabase.from(T.AIConversation).update({
          messages: newMessages, updatedAt: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from(T.AIConversation).insert({
          id: crypto.randomUUID(),
          userId: user.id, courseId: courseId ?? null,
          title: message.slice(0, 80),
          messages: newMessages,
        })
      }
    } catch {
      // ignore persistence errors
    }

    // Award points for engagement
    await supabase.from(T.User).update({ points: (user.points || 0) + 3 }).eq('id', user.id)

    return ok({ reply, conversationId: courseId ?? 'general' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ralat AI'
    const fallback = `Maaf, Cikgu AI sedang tidak dapat dihubungi buat masa ini (${msg}). 

Sementara itu, anda boleh:
- Menyemak modul kursus di bahagian **Pembelajaran Saya**
- Bertanya di **Forum** kepada pengajar dan rakan pelajar
- Menghubungi pentadbir kampus anda jika masalah berterusan.

💡 Tip: Pastikan anda log masuk menggunakan akaun yang sah dan cuba lagi sebentar lagi.`

    return ok({ reply: fallback, conversationId: courseId ?? 'general', degraded: true })
  }
}

// GET — fetch conversation history
export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  let query = supabase
    .from(T.AIConversation)
    .select('id, messages')
    .eq('userId', user.id)
    .order('updatedAt', { ascending: false })
    .limit(1)
  if (courseId) query = query.eq('courseId', courseId)
  else query = query.is('courseId', null)

  const { data, error } = await query.maybeSingle()
  if (error || !data) return ok({ messages: [], conversationId: null })
  return ok({
    messages: (data.messages as AIMessage[]) || [],
    conversationId: data.id,
  })
}
