import { useEffect, useState } from 'react'
import { downloadOfflineModel, isOfflineModelSaved } from '../../lib/offlineModel'


export default function OfflineModelDownloadButton() {
  const [status, setStatus] = useState('checking') 
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    isOfflineModelSaved().then((saved) => {
      if (!cancelled) setStatus(saved ? 'ready' : 'idle')
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDownload() {
    setStatus('downloading')
    setProgress(0)
    try {
      await downloadOfflineModel({ onProgress: setProgress })
      setStatus('ready')
    } catch (err) {
      console.error('[OfflineModelDownloadButton] Download/save failed:', err)
      setStatus('error')
    }
  }

  if (status === 'checking') return null

  if (status === 'ready') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-[#043927]">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
        Offline identifier ready on this device
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-2 text-center">
      <button
        type="button"
        onClick={handleDownload}
        disabled={status === 'downloading'}
        className="px-4 py-2 rounded-lg bg-[#043927] text-[#F5EFE3] text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'downloading' ? 'Downloading…' : 'Download offline identifier'}
      </button>

      {status === 'downloading' && (
        <div className="w-full max-w-xs h-2 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full bg-[#043927] transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-600">
          Couldn't download the offline model. Check your connection and try again.
        </p>
      )}

      <p className="text-xs text-black/60 max-w-xs">
        Lets you identify species without a network connection, useful in remote parts of the park.
        (~4&nbsp;MB, one-time download.)
      </p>
    </div>
  )
}
