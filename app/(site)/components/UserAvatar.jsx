'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'

import { useLocale } from './LocaleProvider'
import { pick } from '../../../lib/i18n'
import { getUserAvatarDataUri, getUserAvatarInitials, getUserAvatarSeed } from '../../../lib/userAvatar'

const SIZE_CLASS = {
  xs: 'h-5 w-5',
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

/**
 * 站点统一用户头像：基于 login / email / id 生成 GitHub 风格 identicon，不依赖外链。
 */
export default function UserAvatar({
  user = null,
  seed: seedProp = '',
  size = 'sm',
  isOwner = false,
  loading = false,
  className = '',
  title = '',
}) {
  const { resolvedTheme } = useTheme()
  const { locale } = useLocale()
  const seed = seedProp || getUserAvatarSeed(user)
  const dataUri = useMemo(
    () => getUserAvatarDataUri(seed, { dark: resolvedTheme === 'dark' }),
    [seed, resolvedTheme],
  )
  const guestInitial = pick(locale, '登', 'Hi')
  const initials = user ? getUserAvatarInitials(user) : seedProp ? seedProp.slice(0, 2).toUpperCase() : guestInitial
  const sizeCls = typeof size === 'number' ? '' : SIZE_CLASS[size] || SIZE_CLASS.sm
  const borderCls = isOwner
    ? 'border-2 border-[#c79347] dark:border-[#989e72]'
    : 'border border-[#cbcdc2] dark:border-gray-700'
  const style = typeof size === 'number' ? { width: size, height: size } : undefined

  if (loading) {
    return (
      <span
        style={style}
        className={[
          'relative inline-flex shrink-0 items-center justify-center rounded-full font-mono text-[10px] text-[#767869] dark:text-gray-400',
          sizeCls,
          borderCls,
          className,
        ].join(' ')}
        aria-hidden="true"
      >
        ...
      </span>
    )
  }

  if (!user && !seedProp) {
    return (
      <span
        style={style}
        title={title}
        className={[
          'relative inline-flex shrink-0 items-center justify-center rounded-full bg-[#e9eae2] text-[12px] font-semibold text-[#565749] dark:bg-gray-900 dark:text-gray-200',
          sizeCls,
          borderCls,
          className,
        ].join(' ')}
        aria-hidden="true"
      >
        {guestInitial}
      </span>
    )
  }

  return (
    <span
      style={style}
      title={title || initials}
      className={['relative inline-flex shrink-0 overflow-hidden rounded-full', sizeCls, borderCls, className].join(' ')}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUri} alt="" className="h-full w-full object-cover" decoding="async" draggable={false} />
    </span>
  )
}
