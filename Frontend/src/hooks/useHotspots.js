import { useEffect, useState } from 'react'
import { getHotspots } from '../services/hotspotsService'
import { PARK_LOCATIONS } from '../data/parkLocations'


export function useHotspots() {
  const [hotspots, setHotspots] = useState(PARK_LOCATIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHotspots()
      .then(setHotspots)
      .catch(() => {}) 
      .finally(() => setLoading(false))
  }, [])

  return { hotspots, loading }
}
