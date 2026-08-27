import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, MapPin, RefreshCw, CheckCircle2, Map as MapIcon } from 'lucide-react'
import { SPECIES } from '../../data/species'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { useGeolocation } from '../../hooks/useGeolocation'
import { uploadSightingPhotos, createSighting } from '../../services/sightingsService'
import ParkMapView from '../map/ParkMapView'
import { useHotspots } from '../../hooks/useHotspots'
import MultiImageUploader from './MultiImageUploader'
import { getTodayISODate, getCurrentTimeString } from '../../lib/dateConstraints'


function splitPresetDateTime(presetIso) {
  const d = presetIso ? new Date(presetIso) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export default function SightingForm() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const { hotspots: PARK_LOCATIONS } = useHotspots()
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const preset = routerLocation.state || {}

  const { position: gpsPosition, status: geoStatus, error: geoError, request: requestLocation } = useGeolocation()
  const [pickedLocation, setPickedLocation] = useState(preset.presetLocation || null)
  const [pickMode, setPickMode] = useState(false)


  const position = pickedLocation || gpsPosition

  const [speciesSlug, setSpeciesSlug] = useState(SPECIES[0].slug)
  const [notes, setNotes] = useState(preset.presetTag ? `From saved location: ${preset.presetTag}` : '')
  const initialDateTime = splitPresetDateTime(preset.presetObservedAt)
  const [date, setDate] = useState(initialDateTime.date)
  const [time, setTime] = useState(initialDateTime.time)
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    if (!position) {
      setError('We need a location for this sighting — capture your GPS position or pick one on the map.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const speciesMeta = SPECIES.find((s) => s.slug === speciesSlug)
      const images = photos.length > 0 ? await uploadSightingPhotos(photos, user.uid) : []
      const observedAt = new Date(`${date}T${time || '00:00'}`)

      await createSighting(
        {
          u_id: user.uid,
          sp_id: speciesMeta.sp_id,
          speciesSlug,
          speciesCommonName: speciesMeta.commonName,
          notes,
          latitude: position.lat,
          longitude: position.lng,
          images,
          observedAt,
        },
        { autoVerify: isAdmin, verifiedAdminId: isAdmin ? user.uid : null }
      )

      navigate('/submissions')
      toast.success(isAdmin ? 'Sighting submitted and auto-verified.' : 'Sighting submitted — pending admin review.')
    } catch (err) {
      setError(err.message || 'Could not save this sighting. Please try again.')
      toast.error('Could not submit your sighting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-bark-700">Location</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPickedLocation(null)
              requestLocation()
            }}
            disabled={geoStatus === 'requesting'}
            className="btn-secondary flex-1 !text-xs"
          >
            {geoStatus === 'requesting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            Use my location
          </button>
          <button
            type="button"
            onClick={() => setPickMode((v) => !v)}
            className={`btn-secondary flex-1 !text-xs ${pickMode ? '!border-clay-400 !text-clay-500' : ''}`}
          >
            <MapIcon className="h-4 w-4" />
            {pickMode ? 'Cancel picking' : 'Pick on map'}
          </button>
        </div>

        {position && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-bark-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-500" />
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            <RefreshCw className="h-3 w-3 opacity-50" />
          </p>
        )}
        {geoStatus === 'denied' && (
          <p className="mt-1.5 text-xs text-danger-500">
            Location access is blocked for this site. Click the lock/info icon next to the address bar → Site
            settings → Location → Allow, then reload the page — or just pick a point on the map instead.
          </p>
        )}
        {geoStatus === 'unsupported' && <p className="mt-1.5 text-xs text-danger-500">Your browser doesn't support geolocation.</p>}
        {geoStatus === 'error' && geoError && <p className="mt-1.5 text-xs text-danger-500">{geoError}</p>}

        {pickMode && (
          <div className="mt-3 h-64 overflow-hidden rounded-xl border border-canopy-200">
            <ParkMapView
              hotspots={PARK_LOCATIONS}
              sightings={[]}
              pickMode
              pickedLocation={pickedLocation}
              onPickLocation={(loc) => {
                setPickedLocation(loc)
                setPickMode(false)
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-bark-700">Species</label>
        <select value={speciesSlug} onChange={(e) => setSpeciesSlug(e.target.value)} className="input-field">
          {SPECIES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.commonName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Date sighted</label>
          <input type="date" value={date} max={getTodayISODate()} onChange={(e) => setDate(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Time sighted</label>
          <input
            type="time"
            value={time}
            max={date === getTodayISODate() ? getCurrentTimeString() : undefined}
            onChange={(e) => setTime(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-bark-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Behavior, group size, distinguishing marks..."
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-bark-700">Photographs (up to 5)</label>
        <MultiImageUploader files={photos} onChange={setPhotos} />
      </div>

      {isAdmin && (
        <p className="rounded-lg bg-canopy-50 px-3 py-2 text-xs text-canopy-700">
          Admin sighting will be verified automatically.
        </p>
      )}

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? 'Submitting...' : 'Submit sighting'}
      </button>
    </form>
  )
}
