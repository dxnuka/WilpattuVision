import { X } from 'lucide-react'

/** @param {{ src: string, onClose: () => void }} props */
export default function Lightbox({ src, onClose }) {
  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-bark-900/80 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-soft"
      />
    </div>
  )
}
