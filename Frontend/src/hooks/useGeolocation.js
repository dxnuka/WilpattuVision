import { useEffect, useRef, useState } from 'react'

export function useGeolocation({ watch = false } = {}) {
  const [position, setPosition] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const watchIdRef = useRef(null)

  const request = () => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus('requesting')
    const onSuccess = (pos) => {
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setStatus('granted')
    }
    const onError = (err) => {
      setError(err.message)
      setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
    }
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
    }
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { position, status, error, request }
}
