'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import {
  IconArrowBackUp, IconArrowForwardUp, IconBold, IconCode, IconEye, IconH2, IconH3,
  IconItalic, IconLink, IconList, IconListNumbers, IconPhoto, IconQuote, IconSeparator,
  IconStrikethrough, IconUpload, IconX,
} from '@tabler/icons-react'

import AdminPage from '../../components/ui/AdminPage'
import AdminButton from '../../components/ui/AdminButton'
import ArticlePostBody from '../../../(site)/components/ArticlePostBody'

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
}

function ToolButton({ title, active, onClick, children }) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${active ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]' : 'text-[#55574f] hover:bg-[#eceee6] dark:text-gray-300 dark:hover:bg-[#1d2632]'}`}>{children}</button>
}

export default function ArticleEditor({ articleId = '' }) {
  const router = useRouter()
  const [id, setId] = useState(articleId)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState('draft')
  const [revision, setRevision] = useState(1)
  const [content, setContent] = useState(EMPTY_DOC)
  const [contentText, setContentText] = useState('')
  const [loaded, setLoaded] = useState(!articleId)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveLabel, setSaveLabel] = useState(articleId ? '加载中…' : '尚未保存')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [slugTouched, setSlugTouched] = useState(Boolean(articleId))
  const fileRef = useRef(null)
  const savingRef = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      TiptapLink.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: '从这里开始写正文…' }),
      CharacterCount,
    ],
    content: EMPTY_DOC,
    onUpdate: ({ editor: instance }) => {
      setContent(instance.getJSON())
      setContentText(instance.getText({ blockSeparator: '\n\n' }))
      setDirty(true)
    },
  })

  useEffect(() => {
    if (!articleId || !editor) return
    let alive = true
    fetch(`/api/admin/articles/${articleId}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || '文章读取失败')
        return data.article
      })
      .then((article) => {
        if (!alive) return
        setTitle(article.title); setSlug(article.slug); setSummary(article.summary)
        setCoverUrl(article.coverUrl); setTags(article.tags.join(', ')); setStatus(article.status)
        setRevision(article.revision); setContent(article.content); setContentText(article.contentText)
        editor.commands.setContent(article.content || EMPTY_DOC, { emitUpdate: false })
        setLoaded(true); setDirty(false); setSaveLabel('已保存')
      })
      .catch((err) => { if (alive) { setError(err.message); setLoaded(true) } })
    return () => { alive = false }
  }, [articleId, editor])

  function applyArticle(article) {
    setId(article.id); setRevision(article.revision); setStatus(article.status)
    setDirty(false); setSaveLabel(`已保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`)
    return article
  }

  async function persist(nextStatus = status, silent = false) {
    if (savingRef.current) return null
    savingRef.current = true; setSaving(true); setError('')
    if (!silent) setSaveLabel('保存中…')
    const payload = { title, slug: slug || slugify(title), summary, coverUrl, tags, content, contentText, status: nextStatus, revision }
    try {
      let article
      if (!id) {
        const createRes = await fetch('/api/admin/articles', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        const createData = await createRes.json()
        if (!createRes.ok) throw new Error(createData?.error === 'SLUG_EXISTS' ? 'Slug 已存在' : createData?.detail || createData?.error || '草稿创建失败')
        article = applyArticle(createData.article)
        router.replace(`/admin/articles/${article.id}/edit`)
        if (nextStatus === 'published') {
          const publishRes = await fetch(`/api/admin/articles/${article.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, revision: article.revision, status: 'published' }) })
          const publishData = await publishRes.json()
          if (!publishRes.ok) throw new Error(publishData?.error || '发布失败')
          article = applyArticle(publishData.article)
        }
      } else {
        const res = await fetch(`/api/admin/articles/${id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 409 && data?.error === 'REVISION_CONFLICT') throw new Error('文章已在其他页面更新，请刷新后再编辑。')
          throw new Error(data?.error === 'SLUG_EXISTS' ? 'Slug 已存在' : data?.error === 'PUBLISH_FIELDS_REQUIRED' ? '发布前请填写标题、Slug 和正文。' : data?.detail || data?.error || '保存失败')
        }
        article = applyArticle(data.article)
      }
      try { localStorage.removeItem(`article-draft:${article.id}`); localStorage.removeItem('article-draft:new') } catch {}
      return article
    } catch (err) {
      setError(err.message); setSaveLabel('保存失败'); return null
    } finally {
      savingRef.current = false; setSaving(false)
    }
  }

  useEffect(() => {
    if (!loaded || !dirty) return
    try { localStorage.setItem(`article-draft:${id || 'new'}`, JSON.stringify({ title, slug, summary, coverUrl, tags, content, contentText, savedAt: Date.now() })) } catch {}
    const timer = setTimeout(() => persist(status, true), 1500)
    return () => clearTimeout(timer)
    // persist intentionally reads the latest render values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, summary, coverUrl, tags, content, contentText, loaded, dirty])

  function setLink() {
    const previous = editor?.getAttributes('link').href || ''
    const href = window.prompt('链接地址', previous)
    if (href === null) return
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    let currentId = id
    if (!currentId) currentId = (await persist('draft'))?.id
    if (!currentId) return
    setSaveLabel('上传图片中…')
    const form = new FormData(); form.set('articleId', currentId); form.set('file', file)
    const res = await fetch('/api/admin/articles/images', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) { setError(data?.error || '图片上传失败'); setSaveLabel('上传失败'); return }
    editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run()
    setSaveLabel('图片已插入')
  }

  const toolbar = editor ? [
    ['二级标题', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <IconH2 key="h2" size={18} />],
    ['三级标题', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <IconH3 key="h3" size={18} />],
    ['加粗', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <IconBold key="b" size={18} />],
    ['斜体', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <IconItalic key="i" size={18} />],
    ['删除线', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), <IconStrikethrough key="s" size={18} />],
    ['链接', editor.isActive('link'), setLink, <IconLink key="l" size={18} />],
    ['无序列表', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <IconList key="ul" size={18} />],
    ['有序列表', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <IconListNumbers key="ol" size={18} />],
    ['引用', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), <IconQuote key="q" size={18} />],
    ['代码块', editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), <IconCode key="c" size={18} />],
    ['分隔线', false, () => editor.chain().focus().setHorizontalRule().run(), <IconSeparator key="hr" size={18} />],
  ] : []

  return (
    <AdminPage maxWidth="1180px" title={id ? '编辑文章' : '写文章'} description={saveLabel} actions={<><AdminButton href="/admin/articles">返回列表</AdminButton><AdminButton onClick={() => setPreview((v) => !v)}><IconEye size={16} />{preview ? '关闭预览' : '预览'}</AdminButton><AdminButton disabled={saving} onClick={() => persist(status)}>保存</AdminButton>{status === 'published' ? <AdminButton disabled={saving} onClick={() => persist('draft')}>转为草稿</AdminButton> : <AdminButton variant="primary" disabled={saving} onClick={() => persist('published')}><IconUpload size={16} />发布</AdminButton>}</>}>
      {error ? <div className="mb-4 flex items-start justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><span>{error}</span><button onClick={() => setError('')}><IconX size={16} /></button></div> : null}
      {!loaded ? <p className="text-sm text-[#67695d]">加载中…</p> : (
        <div className={`grid gap-5 ${preview ? 'lg:grid-cols-2' : ''}`}>
          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-[#e2e3da] bg-white p-4 dark:border-[#1e2733] dark:bg-[#10161f]">
              <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); setDirty(true) }} placeholder="文章标题" className="w-full border-0 bg-transparent font-serif text-2xl font-semibold text-[#15140f] outline-none placeholder:text-[#a7a89e] dark:text-gray-100" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-[#67695d] dark:text-gray-400">Slug<input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); setDirty(true) }} className="mt-1 w-full rounded-lg border border-[#d9dbd0] bg-transparent px-3 py-2 font-mono text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:text-gray-200" /></label>
                <label className="text-xs text-[#67695d] dark:text-gray-400">标签<input value={tags} onChange={(e) => { setTags(e.target.value); setDirty(true) }} placeholder="技术, 随笔" className="mt-1 w-full rounded-lg border border-[#d9dbd0] bg-transparent px-3 py-2 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:text-gray-200" /></label>
              </div>
              <label className="mt-3 block text-xs text-[#67695d] dark:text-gray-400">摘要<textarea value={summary} onChange={(e) => { setSummary(e.target.value); setDirty(true) }} rows={2} placeholder="留空时可使用正文开头" className="mt-1 w-full resize-y rounded-lg border border-[#d9dbd0] bg-transparent px-3 py-2 text-sm leading-6 text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:text-gray-200" /></label>
              <label className="mt-3 block text-xs text-[#67695d] dark:text-gray-400">封面 URL<input value={coverUrl} onChange={(e) => { setCoverUrl(e.target.value); setDirty(true) }} placeholder="https://…" className="mt-1 w-full rounded-lg border border-[#d9dbd0] bg-transparent px-3 py-2 text-sm text-[#33352f] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:text-gray-200" /></label>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e2e3da] bg-white dark:border-[#1e2733] dark:bg-[#10161f]">
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-[#eceee6] bg-white/95 px-2 py-2 backdrop-blur dark:border-[#1b2430] dark:bg-[#10161f]/95">
                {toolbar.map(([label, active, action, icon]) => <ToolButton key={label} title={label} active={active} onClick={action}>{icon}</ToolButton>)}
                <ToolButton title="上传图片" onClick={() => fileRef.current?.click()}><IconPhoto size={18} /></ToolButton>
                <span className="mx-1 h-5 w-px bg-[#e2e3da] dark:bg-[#2d3744]" />
                <ToolButton title="撤销" onClick={() => editor?.chain().focus().undo().run()}><IconArrowBackUp size={18} /></ToolButton>
                <ToolButton title="重做" onClick={() => editor?.chain().focus().redo().run()}><IconArrowForwardUp size={18} /></ToolButton>
                <span className="ml-auto px-2 font-mono text-[11px] text-[#8b8d82]">{editor?.storage.characterCount.characters() || 0} 字</span>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="hidden" onChange={uploadImage} />
              </div>
              <EditorContent editor={editor} className="article-editor min-h-[520px]" />
            </div>
          </div>
          {preview ? <aside className="min-w-0 rounded-xl border border-[#e2e3da] bg-white p-5 dark:border-[#1e2733] dark:bg-[#10161f]"><p className="mb-4 border-b border-[#eceee6] pb-2 font-mono text-xs uppercase tracking-wider text-[#8b8d82] dark:border-[#1b2430]">实时预览</p><h1 className="font-serif text-3xl font-semibold text-[#333] dark:text-gray-100">{title || '未命名文章'}</h1>{summary ? <p className="mt-3 text-sm leading-7 text-[#666] dark:text-gray-400">{summary}</p> : null}<ArticlePostBody content={content} className="mt-8" /></aside> : null}
        </div>
      )}
    </AdminPage>
  )
}
