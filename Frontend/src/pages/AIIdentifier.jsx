import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Sparkles, HelpCircle, Ban, WifiOff } from 'lucide-react'
import ImageUploader from '../components/identifier/ImageUploader'
import PredictionResults from '../components/identifier/PredictionResults'
import OfflineModelDownloadButton from '../components/common/OfflineModelDownloadButton'
import { identifySpecies, LowConfidenceError, NotRecognizedError, OfflineModelUnavailableError } from '../services/predictService'
import { savePrediction } from '../services/predictionsService'
import { preloadOfflineModel } from '../lib/offlineModel'
import { useAuth } from '../hooks/useAuth'

export default function AIIdentifier() {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | low-confidence | not-recognized | error
  const [result, setResult] = useState(null)
  const [closestMatch, setClosestMatch] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [usedOffline, setUsedOffline] = useState(false)


  useEffect(() => {
    preloadOfflineModel()
  }, [])

  const handleFileSelected = (selected) => {
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setResult(null)
    setStatus('idle')
  }

  const handleClear = () => {
    setFile(null)
    setPreviewUrl('')
    setResult(null)
    setStatus('idle')
    setErrorMessage('')
    setUsedOffline(false)
  }

  const handleIdentify = async () => {
    if (!file) return
    setStatus('loading')
    setErrorMessage('')
    try {
      const data = await identifySpecies(file)
      setResult(data)
      setUsedOffline(data.source === 'offline')
      setStatus('success')


      savePrediction({
        file,
        uid: user?.uid || null,
        predictions: data.predictions,
        isConfident: true,
        thresholdUsed: data.thresholdUsed,
      }).catch((err) => {
        console.warn('Could not save this identification to the database:', err)
      })
    }     catch (err) {
      setUsedOffline(err.source === 'offline')
      if (err instanceof NotRecognizedError) {
        setStatus('not-recognized')
      } else if (err instanceof LowConfidenceError) {
        setClosestMatch(err.topPrediction || null)
        setStatus('low-confidence')
      } else if (err instanceof OfflineModelUnavailableError) {
        setStatus('offline-unavailable')
      } else {
        setErrorMessage('Something went wrong while identifying this photo. Please try again.')
        setStatus('error')
      }
    }
    
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-center text-3xl font-semibold sm:text-4xl">Species Identifier</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-bark-500">
        Anyone can upload a photo here — no account needed.
      </p>

      <div className="mt-4 flex justify-center">
+        <OfflineModelDownloadButton />
+      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <div className="space-y-4">
          <ImageUploader onFileSelected={handleFileSelected} onClear={handleClear} previewUrl={previewUrl} />
          <button onClick={handleIdentify} disabled={!file || status === 'loading'} className="btn-clay w-full">
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Identifying...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Identify species
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {status === 'error' && (
            <div className="card flex items-start gap-3 border-danger-500/30 bg-red-50 p-5 text-danger-500">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Identification failed</p>
                <p className="mt-1 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {status === 'offline-unavailable' && (
            <div className="card flex items-start gap-3 bg-amber-100/60 p-5 text-amber-700">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">You're offline, and the backup identifier isn't ready yet</p>
                <p className="mt-1 text-sm">
                  The backup identifier needs to finish downloading once while you have a connection before it can
                  work offline. Reconnect, revisit this page for a moment, then it'll be available offline too.
                </p>
              </div>
            </div>
          )}

          {status === 'not-recognized' && (
            <div className="card flex items-start gap-3 bg-bark-100 p-5 text-bark-700">
              <Ban className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">We couldn't match this to a known species</p>
                <p className="mt-1 text-sm">
                  This photo doesn't look like any of the animals we recognize in Wilpattu. If you're sure it's a
                  park species, try a clearer, closer photo taken in good light.
                </p>
              </div>
            </div>
          )}

          {status === 'low-confidence' && (
            <div className="card flex items-start gap-3 bg-amber-100/60 p-5 text-amber-700">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">We're not confident enough to give you an answer</p>
                {closestMatch && (
                  <p className="mt-2 text-sm">
                    Closest match: <strong>{closestMatch.species}</strong> — {Math.round(closestMatch.confidence * 100)}%
                  </p>
                )}
                <p className="mt-2 text-sm">
                  Try a clearer, closer photo with good lighting and the animal centered in frame.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && result && <PredictionResults predictions={result.predictions} />}

          {usedOffline && status !== 'idle' && (
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-100/70 px-4 py-2.5 text-sm text-amber-700">
              <WifiOff className="h-4 w-4 shrink-0" />
              You're offline, so we used a backup identifier. Connect to the internet for better accuracy.
            </div>
          )}

          {status === 'idle' && !result && (
            <div className="card flex h-full min-h-[200px] items-center justify-center p-6 text-center text-sm text-bark-400">
              Your results will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
