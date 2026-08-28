import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WILDLIFE_FACTS } from '../../data/wildlifeFacts'

const ROTATE_MS = 6000

export default function WildlifeFactsCarousel() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * WILDLIFE_FACTS.length))

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % WILDLIFE_FACTS.length)
    }, ROTATE_MS)
    return () => clearInterval(timer)
  }, [])

  const go = (delta) => setIndex((i) => (i + delta + WILDLIFE_FACTS.length) % WILDLIFE_FACTS.length)

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => go(-1)}
        aria-label="Previous fact"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <p key={index} className="min-h-[3.5rem] flex-1 text-center text-sm font-medium leading-relaxed text-white sm:text-base">
        {WILDLIFE_FACTS[index]}
      </p>

      <button
        onClick={() => go(1)}
        aria-label="Next fact"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
