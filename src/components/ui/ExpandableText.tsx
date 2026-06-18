'use client'

import { useState, useRef, useEffect } from 'react'

interface ExpandableTextProps {
  text: string
  /** Number of lines to show when collapsed */
  lines?: number
  className?: string
  buttonClassName?: string
}

/**
 * Renders text clamped to `lines`. If the text overflows, shows a
 * "See more" / "See less" toggle. The button only appears when the
 * content is actually truncated (measured after mount + on resize).
 */
export default function ExpandableText({
  text,
  lines = 2,
  className,
  buttonClassName,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped]   = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Only measure while collapsed — when expanded there's no clamp to compare against
    if (expanded) return
    const check = () => setClamped(el.scrollHeight > el.clientHeight + 1)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [text, lines, expanded])

  return (
    <div>
      <p
        ref={ref}
        className={className}
        style={
          expanded
            ? { whiteSpace: 'pre-line' }
            : {
                display: '-webkit-box',
                WebkitLineClamp: lines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-line',
              }
        }
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
          className={
            buttonClassName ??
            'mt-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline'
          }
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  )
}
