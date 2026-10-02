/* eslint-disable @next/next/no-img-element */
import { useId } from 'react'

/**
 * Renders a fixed flagpole with a softly distorted cloth layer.
 * The source image may contain both the pole and cloth; only the narrow pole
 * slice is kept in the fixed layer while the remaining image is animated.
 */
export default function WavingFlag({
  src,
  animated = true,
  alt = '',
  className = '',
  ...props
}) {
  const instanceId = useId().replaceAll(':', '')
  const clipId = `waving-flag-clip-${instanceId}`
  const filterId = `waving-flag-filter-${instanceId}`

  if (!src) return null

  return (
    <span
      className={`waving-flag${animated ? ' is-animated' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      <img className="waving-flag__source" src={src} alt={alt} />
      {animated ? (
        <>
          <svg
            className="waving-flag__cloth"
            viewBox="-16 -16 291 292"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                <rect x="15" y="-10" width="260" height="280" />
              </clipPath>
              <filter
                id={filterId}
                x="-12%"
                y="-16%"
                width="136%"
                height="140%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.012 0.032"
                  numOctaves="2"
                  seed="7"
                  result="wind"
                >
                  <animate
                    attributeName="baseFrequency"
                    dur="4.8s"
                    values="0.012 0.032;0.018 0.044;0.014 0.036;0.012 0.032"
                    keyTimes="0;0.38;0.72;1"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="wind"
                  scale="7"
                  xChannelSelector="R"
                  yChannelSelector="G"
                >
                  <animate
                    attributeName="scale"
                    dur="3.6s"
                    values="5;10;7;11;5"
                    keyTimes="0;0.28;0.52;0.78;1"
                    repeatCount="indefinite"
                  />
                </feDisplacementMap>
              </filter>
            </defs>
            <image
              href={src}
              x="0"
              y="0"
              width="259"
              height="260"
              preserveAspectRatio="none"
              clipPath={`url(#${clipId})`}
              filter={`url(#${filterId})`}
            />
          </svg>
          <img className="waving-flag__reduced-motion" src={src} alt="" aria-hidden="true" />
        </>
      ) : null}
    </span>
  )
}
