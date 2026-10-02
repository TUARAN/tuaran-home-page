/* eslint-disable @next/next/no-img-element */

/**
 * Reusable public-site campaign banner.
 *
 * Data loading, scheduling and admin concerns intentionally live outside this
 * component so the same presentation can be reused for festivals, anniversaries
 * and other site-wide campaigns.
 */
export default function CampaignBanner({
  title,
  compactTitle,
  subtitle,
  badgeValue,
  badgeLabel,
  leftImage,
  rightImage,
  animateLeft = false,
  theme = 'red-gold',
  className = '',
}) {
  if (!title) return null

  const accessibleTitle = [title, badgeValue, badgeLabel].filter(Boolean).join(' ')

  return (
    <section
      className={`home-national-day${className ? ` ${className}` : ''}`}
      data-festival-theme={theme}
      aria-label={accessibleTitle}
    >
      {leftImage ? (
        <span className={`home-national-day-flag-art${animateLeft ? ' is-animated' : ''}`} aria-hidden="true">
          <img
            className="home-national-day-flag home-national-day-flag-pole"
            src={leftImage}
            alt=""
          />
          {animateLeft ? (
            <img
              className="home-national-day-flag home-national-day-flag-cloth"
              src={leftImage}
              alt=""
            />
          ) : null}
        </span>
      ) : null}
      <div className="home-national-day-copy">
        <span className="home-national-day-title home-national-day-title-full">{title}</span>
        <span className="home-national-day-title home-national-day-title-compact">{compactTitle || title}</span>
        {subtitle ? (
          <span className="home-national-day-years">
            <i aria-hidden="true" />
            {subtitle}
            <i aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {badgeValue || badgeLabel ? (
        <span className="home-national-day-anniversary" aria-hidden="true">
          {badgeValue ? <strong>{badgeValue}</strong> : null}
          {badgeLabel ? <small>{badgeLabel}</small> : null}
        </span>
      ) : null}
      {rightImage ? (
        <img
          className="home-national-day-tiananmen"
          src={rightImage}
          alt=""
          aria-hidden="true"
        />
      ) : null}
    </section>
  )
}
