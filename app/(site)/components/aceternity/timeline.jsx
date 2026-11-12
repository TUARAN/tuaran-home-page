'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// Official Aceternity UI Timeline, from https://ui.aceternity.com/registry/timeline.json.
// Adapted to JSX for this site, with a title and description so the page can carry its own copy.
// The Aceternity License allows this personal site as an end product. It is not MIT.
// Below `md`, each entry stacks: the label is on top and the body is full width.
// The dot and beam stay on the desktop left rail so they do not reserve a mobile gutter.

export function Timeline({ data, title, description, labelClassName, railClassName, rowClassName }) {
  const ref = useRef(null)
  const containerRef = useRef(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const measure = () => setHeight(element.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  })

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  return (
    <div
      className="w-full bg-white font-sans dark:bg-neutral-950 md:px-10"
      ref={containerRef}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
        <h1 className="mb-2 max-w-3xl text-2xl text-black dark:text-white md:text-3xl">
          {title}
        </h1>
        <div className="max-w-2xl space-y-1 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
          {description}
        </div>
      </div>

      <div ref={ref} className="relative mx-auto max-w-5xl pb-12">
        {data.map((item) => (
          <div
            key={item.id || item.title}
            className={rowClassName || 'flex flex-col justify-start gap-3 pt-8 md:flex-row md:gap-10 md:pt-16'}
          >
            <div className={railClassName || 'relative z-40 flex w-full flex-col items-start self-start px-4 md:sticky md:top-24 md:w-full md:max-w-xs md:flex-row md:items-center md:px-0 lg:max-w-sm'}>
              <div className="absolute left-3 hidden h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-black md:flex">
                <div className="h-4 w-4 rounded-full border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-700 dark:bg-neutral-800" />
              </div>
              <h2 className={labelClassName || 'whitespace-pre-line text-left text-xl font-bold leading-none text-neutral-500 dark:text-neutral-500 md:pl-20 md:text-5xl'}>
                {item.label || item.title}
              </h2>
            </div>

            <div className="relative w-full px-4 md:pl-4">
              {item.content}
            </div>
          </div>
        ))}
        <div
          style={{ height: `${height}px` }}
          className="absolute left-8 top-0 hidden w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] dark:via-neutral-700 md:left-8 md:block"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-purple-500 from-[0%] via-blue-500 via-[10%] to-transparent"
          />
        </div>
      </div>
    </div>
  )
}
