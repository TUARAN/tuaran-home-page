'use client'

import Image from 'next/image'
import { useState } from 'react'

const greetings = ['鹿鹿在，慢慢来 ✦', '摸摸收到！', '先喝口水，再继续？', '今天也一起加油呀']

export default function DesktopPetDemo() {
  const [speech, setSpeech] = useState('嗨，我是鹿鹿。今天想先做什么？')
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [greetingIndex, setGreetingIndex] = useState(0)

  function petLulu() {
    setSpeech(greetings[greetingIndex % greetings.length])
    setGreetingIndex((index) => index + 1)
  }

  function sendMessage(event) {
    event.preventDefault()
    const value = message.trim()
    if (!value) return
    const answer = `鹿鹿听见啦：${value.slice(0, 22)}${value.length > 22 ? '…' : ''}。这里是网页演示，还没有连接 WorkBuddy。`
    setReply(answer)
    setSpeech(answer)
    setMessage('')
  }

  return (
    <div className="rounded-[2rem] bg-[#213b35] p-5 text-[#35413c] shadow-2xl sm:p-7" aria-label="鹿鹿精灵网页演示">
      <p className="min-h-[4.5rem] rounded-2xl bg-[#f6e9cd] px-4 py-3 text-sm leading-6" aria-live="polite">{speech}</p>
      <button type="button" onClick={petLulu} className="mx-auto flex h-72 w-full items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6e9cd]" aria-label="摸摸鹿鹿">
        <Image src="/images/workbuddy-desktop-pet/lulu-giraffe.png" alt="" width={280} height={280} className="h-64 w-64 object-contain drop-shadow-xl" priority />
      </button>
      <div className="rounded-xl bg-[#f4ebd9] p-4 text-sm">
        <p><span className="mr-2 text-[#54a58b]">●</span>鹿鹿在这里 · 本地演示</p>
        {reply ? <p className="mt-3 rounded-lg bg-white px-4 py-3 leading-6" aria-live="polite">{reply}</p> : null}
        <form onSubmit={sendMessage} className="mt-3 flex gap-2">
          <label htmlFor="desktop-pet-demo-message" className="sr-only">告诉鹿鹿，你想做什么</label>
          <input id="desktop-pet-demo-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder="告诉鹿鹿，你想做什么…" className="min-w-0 flex-1 rounded-lg bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#54a58b]" />
          <button type="submit" className="rounded-lg bg-[#3d7b68] px-4 py-2 font-semibold text-white transition hover:bg-[#326453]">发送</button>
        </form>
      </div>
    </div>
  )
}
