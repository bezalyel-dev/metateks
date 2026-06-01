import { useEffect, useState } from 'react'

export function AnimatedClientsCount({ value }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (value === displayValue) return
    setPreviousValue(displayValue)
    setDisplayValue(value)
    setAnimating(true)
    const id = setTimeout(() => setAnimating(false), 480)
    return () => clearTimeout(id)
  }, [value, displayValue])

  return (
    <span className="relative inline-block min-h-[1.2em] min-w-[4ch] align-middle">
      {animating && (
        <span className="pointer-events-none absolute inset-0 animate-[fadeSlideOut_480ms_ease_forwards]">
          {previousValue}
        </span>
      )}
      <span className={animating ? 'inline-block animate-[fadeSlideIn_480ms_ease]' : 'inline-block'}>
        {displayValue}
      </span>
    </span>
  )
}