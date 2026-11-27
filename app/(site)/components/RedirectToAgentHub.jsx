'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** 旧能力分区页保留路由，客户端带上 hash 跳到智能应用中心对应锚点。 */
export default function RedirectToAgentHub({ fallbackHash = '' }) {
  const router = useRouter()
  useEffect(() => {
    const hash = typeof window !== 'undefined' && window.location.hash ? window.location.hash : fallbackHash
    router.replace(`/skill-center${hash}`)
  }, [fallbackHash, router])
  return null
}