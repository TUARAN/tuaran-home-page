/**
 * Unified loading primitives adapted to this site's design system.
 * Motion language reference: Amicro (MIT), commit 07adc164.
 * See docs/loading-motion-system.md for usage rules.
 */

function joinClassNames(...values) {
  return values.filter(Boolean).join(' ')
}

export function LoadingSpinner({ size = 'md', label = '', className = '' }) {
  const accessibleProps = label
    ? { role: 'status', 'aria-label': label }
    : { 'aria-hidden': 'true' }

  return (
    <span
      className={joinClassNames('loading-spinner', `loading-spinner--${size}`, className)}
      {...accessibleProps}
    >
      <svg viewBox="0 0 32 32" focusable="false">
        <circle className="loading-spinner__track" cx="16" cy="16" r="13" />
        <circle className="loading-spinner__arc" cx="16" cy="16" r="13" />
      </svg>
    </span>
  )
}

export function LoadingDots({ label = '', className = '' }) {
  return (
    <span
      className={joinClassNames('loading-dots', className)}
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': 'true' })}
    >
      <span />
      <span />
      <span />
    </span>
  )
}

export function LoadingText({ children = '加载中…', className = '' }) {
  return (
    <span className={joinClassNames('loading-text', className)} data-text={children}>
      {children}
    </span>
  )
}

export function LoadingState({
  label = '加载中…',
  detail = '',
  size = 'md',
  compact = false,
  className = '',
}) {
  return (
    <div
      className={joinClassNames('loading-state', compact && 'loading-state--compact', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <LoadingSpinner size={size} />
      <div className="loading-state__copy">
        <LoadingText>{label}</LoadingText>
        {detail ? <span className="loading-state__detail">{detail}</span> : null}
      </div>
    </div>
  )
}

export function Skeleton({ as: Component = 'span', className = '', style, ...props }) {
  return (
    <Component
      className={joinClassNames('loading-skeleton', className)}
      style={style}
      aria-hidden="true"
      {...props}
    />
  )
}
