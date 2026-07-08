'use client'

import { useEffect, useMemo, useState } from 'react'

function detectPlatform() {
  const nav = typeof navigator === 'undefined' ? null : navigator
  const userAgent = `${nav?.userAgent || ''} ${nav?.platform || ''}`.toLowerCase()
  const platform = nav?.userAgentData?.platform?.toLowerCase?.() || ''

  if (platform.includes('windows') || userAgent.includes('win')) {
    return {
      key: 'windows-x64',
      label: '已识别为 Windows',
      detail: '推荐 Windows 10/11 x64 安装程序。',
    }
  }

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return {
      key: 'macos-arm64',
      label: '已识别为 macOS',
      detail: '浏览器通常不能可靠识别 Mac 芯片类型，默认推荐 Apple Silicon；Intel Mac 请展开其他版本。',
    }
  }

  return {
    key: 'macos-arm64',
    label: '未能识别当前系统',
    detail: '先展示 macOS Apple Silicon 版本；Windows 或 Intel Mac 可以在其他版本里下载。',
  }
}

function checksumText(value) {
  if (!value) return ''
  return `${value.slice(0, 12)}...${value.slice(-10)}`
}

export default function DesktopDownloadChooser({ downloads, version }) {
  const [platform, setPlatform] = useState({
    key: 'macos-arm64',
    label: '正在判断系统',
    detail: '页面会根据当前浏览器环境推荐一个安装包。',
  })

  useEffect(() => {
    setPlatform(detectPlatform())
  }, [])

  const recommended = useMemo(() => {
    return downloads.find((item) => item.key === platform.key) || downloads[0]
  }, [downloads, platform.key])

  const otherDownloads = downloads.filter((item) => item.file !== recommended?.file)

  if (!recommended) return null

  return (
    <section className="not-prose my-9 overflow-hidden rounded-lg bg-[#111418] text-white shadow-sm dark:bg-white dark:text-[#111418]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white dark:bg-black/10 dark:text-[#111418]">
              测试版本 {version}
            </span>
            <span className="text-xs text-white/62 dark:text-black/55">{platform.label}</span>
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#d7c77b] dark:text-[#7a6425]">
            Recommended Download
          </p>
          <h2 className="m-0 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            下载 {recommended.platform} 桌面应用
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 dark:text-black/68">{platform.detail}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={recommended.href}
              download
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f3d15e] px-6 py-3 text-sm font-bold text-[#111418] no-underline transition hover:bg-[#ffde6d] dark:bg-[#111418] dark:text-white dark:hover:bg-[#34383f]"
            >
              下载推荐版本
            </a>
            <span className="text-sm text-white/65 dark:text-black/60">
              {recommended.arch} · {recommended.size}
            </span>
          </div>

          <div className="mt-5 grid gap-2 text-xs text-white/54 dark:text-black/52 sm:grid-cols-2">
            <p className="m-0 break-all font-mono">文件：{recommended.file}</p>
            <p className="m-0 break-all font-mono">SHA-256：{checksumText(recommended.sha256)}</p>
          </div>
        </div>

        <aside className="bg-white/[0.06] px-5 py-6 dark:bg-black/[0.04] sm:px-7 lg:px-8">
          <p className="m-0 text-sm font-semibold text-white dark:text-[#111418]">首次安装提示</p>
          <p className="mt-3 text-sm leading-7 text-white/68 dark:text-black/64">
            当前安装包未做 Apple Developer ID / Windows EV 证书签名，属于公开测试版本。首次打开时系统可能出现安全提示。
          </p>
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-[#f3d15e] dark:text-[#6f5617]">
              查看其他版本下载
            </summary>
            <div className="mt-4 space-y-3">
              {otherDownloads.map((item) => (
                <a
                  key={item.file}
                  href={item.href}
                  download
                  className="block rounded-md bg-white/[0.08] px-4 py-3 text-sm text-white no-underline transition hover:bg-white/[0.14] dark:bg-black/[0.06] dark:text-[#111418] dark:hover:bg-black/[0.1]"
                >
                  <span className="block font-semibold">
                    {item.platform} · {item.arch}
                  </span>
                  <span className="mt-1 block text-xs text-white/55 dark:text-black/52">{item.size}</span>
                </a>
              ))}
            </div>
          </details>
        </aside>
      </div>
    </section>
  )
}
