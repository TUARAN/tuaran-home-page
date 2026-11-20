import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

function fakePage() {
  const doc = { activeElement: null, body: {}, createRange: () => ({ selectNodeContents() {} }) }
  const field = {
    isConnected: true,
    selectionStart: 3,
    selectionEnd: 5,
    selectionDirection: 'forward',
    closest: (selector) => (selector === '#x-reply-clipboard-panel' ? {} : null),
    focus() { doc.activeElement = field },
    setSelectionRange(start, end, direction) { Object.assign(field, { selectionStart: start, selectionEnd: end, selectionDirection: direction }) },
  }
  const editor = { focus() { doc.activeElement = editor }, closest: () => null }
  return { doc, field, editor }
}

test('a draft command borrows focus from the panel and gives it back with the caret', () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  const { doc, field, editor } = fakePage()
  const saved = { document: globalThis.document, window: globalThis.window }
  globalThis.document = doc
  globalThis.window = { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) }
  try {
    doc.activeElement = field
    let focusedDuringCommand = null
    const result = draft.withEditorFocus(editor, () => {
      focusedDuringCommand = doc.activeElement
      field.selectionStart = 0
      return true
    })
    assert.equal(result, true)
    assert.equal(focusedDuringCommand, editor)
    assert.equal(doc.activeElement, field)
    assert.deepEqual([field.selectionStart, field.selectionEnd], [3, 5])

    doc.activeElement = doc.body
    draft.withEditorFocus(editor, () => true)
    assert.equal(doc.activeElement, editor, 'with no panel field focused the editor keeps focus as before')
  } finally {
    globalThis.document = saved.document
    globalThis.window = saved.window
  }
})

test('task clicks and reply editors leave a focused panel field alone', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const click = content.slice(content.indexOf('  function realClick(element) {'), content.indexOf('  function getScroller() {'))
  assert.match(click, /const held = holdPanelFocus\(\);/)
  assert.match(click, /if \(!held\) element\.focus\?\.\(\{ preventScroll: true \}\);/)
  assert.match(click, /returnPanelFocus\(held\);\n  \}/)

  const opener = content.slice(content.indexOf('  async function openComposer(tweet) {'), content.indexOf('  async function ensureReplyComposerText('))
  assert.match(opener, /await waitPanelTypingPause\(\);\n    const held = holdPanelFocus\(\);\n    realClick\(tweet\.replyButton\);/)
  assert.match(opener, /returnPanelFocus\(held\);/)

  const fill = content.slice(content.indexOf('  async function fillComposer('), content.indexOf('  async function openComposer('))
  assert.match(fill, /await waitPanelTypingPause\(\);\n    const result = await requestDraftFill/)

  const clear = content.slice(content.indexOf('  async function clearInlineReplyEditors() {'), content.indexOf('  function composerCarriesAttachment('))
  assert.match(clear, /if \(!panelField\(\)\) textbox\.focus\(\);/)
  assert.match(content, /panel\.addEventListener\("keydown", notePanelTyping, true\);/)
})

test('the background does not switch the task tab away while the panel is being typed in', async () => {
  const background = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(background, /message\?\.type === "xrc-panel-typing"/)
  assert.match(background, /if \(activeTabId === taskTabId && !panelTypingRecently\(taskTabId\)\) \{/)
  const draft = await readFile(new URL('draftFill.js', extensionDir), 'utf8')
  assert.match(draft, /if \(!visibleEditor\(editor\) \|\| editor\.closest\?\.\(PANEL_SELECTOR\)\) continue;/)
})
