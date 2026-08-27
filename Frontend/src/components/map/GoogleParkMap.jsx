import { useMemo, useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { PARK_CENTER, PARK_DEFAULT_ZOOM, LOCATION_CATEGORIES } from '../../data/parkLocations'
import { LocateFixed, AlertCircle, MapPin, Map as MapIcon, Satellite } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getSpeciesBySlug } from '../../data/species'

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }


const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5efe3' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a3a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5efe3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8c4d4' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e0dcc0' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d3ddcc' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e3d9d1' }] },
]

function useMarkerIcons(isLoaded) {
  return useMemo(() => {
    if (!isLoaded || !window.google) return null
    const base = (color, scale = 8) => ({
      path: window.google.maps.SymbolPath.CIRCLE,
      scale,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#f5efe3',
      strokeWeight: 2,
    })
    return {
      hotspot: base(LOCATION_CATEGORIES.hotspot.color),
      entrance: base(LOCATION_CATEGORIES.entrance.color),
      camp: base(LOCATION_CATEGORIES.camp.color),
      sighting: base('#228b22', 9), 
      user: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#2d6cdf',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      picked: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#954f2c', // clay-500
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    }
  }, [isLoaded])
}

function MapTypeToggle({ mapType, onChange, hideLabels, onHideLabelsChange }) {
  const options = [
    { id: 'roadmap', label: 'Map', icon: MapIcon },
    { id: 'hybrid', label: 'Satellite', icon: Satellite },
  ]
  return (
    <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
      <div className="flex gap-0.5 rounded-full bg-white/95 p-1 shadow-soft">
        {options.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              mapType === id ? 'bg-canopy-500 text-villu-50' : 'text-bark-600 hover:bg-canopy-50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-bark-600 shadow-soft">
        <input
          type="checkbox"
          checked={hideLabels}
          onChange={(e) => onHideLabelsChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-canopy-300 text-canopy-500 focus:ring-clay-300"
        />
        Hide labels
      </label>
    </div>
  )
}

/**
 * @param {object} props
 * @param {Array} props.hotspots - curated PARK_LOCATIONS entries (pre-filtered by caller if needed)
 * @param {Array} props.sightings - verified community sightings, each with latitude/longitude
 * @param {object|null} props.focusLocation - { lat, lng } to pan/zoom to
 * @param {(loc: object) => void} [props.onMarkerClick]
 * @param {boolean} [props.pickMode] - when true, clicking the map calls onPickLocation instead of normal marker interaction
 * @param {(loc: {lat:number, lng:number}) => void} [props.onPickLocation]
 * @param {object|null} [props.pickedLocation] - { lat, lng } to render as a distinct marker
 */
export default function GoogleParkMap({
  hotspots = [],
  sightings = [],
  focusLocation = null,
  onMarkerClick,
  pickMode = false,
  onPickLocation,
  pickedLocation = null,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'wilpattuvision-google-map',
    googleMapsApiKey: apiKey || '',
  })

  const icons = useMarkerIcons(isLoaded)
  const [activeInfo, setActiveInfo] = useState(null)
  const [map, setMap] = useState(null)
  const [mapType, setMapType] = useState('roadmap')
  const [hideLabels, setHideLabels] = useState(false)
  const [pendingLocatePan, setPendingLocatePan] = useState(false)
  const { position: userPosition, status: geoStatus, request: requestLocation } = useGeolocation({ watch: true })

  const onLoad = useCallback((mapInstance) => setMap(mapInstance), [])

  useMemo(() => {
    if (map && focusLocation) {
      map.panTo(focusLocation)
      map.setZoom(14)
    }
  }, [map, focusLocation])


  useEffect(() => {
    if (pendingLocatePan && userPosition && map) {
      map.panTo(userPosition)
      map.setZoom(15)
      setPendingLocatePan(false)
    }
  }, [pendingLocatePan, userPosition, map])

  const handleLocateClick = () => {
    setPendingLocatePan(true)
    requestLocation()
  }


  const effectiveMapTypeId = mapType === 'hybrid' ? (hideLabels ? 'satellite' : 'hybrid') : 'roadmap'
  const effectiveStyles =
    mapType === 'roadmap'
      ? hideLabels
        ? [...MAP_STYLES, { elementType: 'labels', stylers: [{ visibility: 'off' }] }]
        : MAP_STYLES
      : undefined

  const handleMapTypeChange = (id) => {
    setMapType(id)
    map?.setMapTypeId(id === 'hybrid' && hideLabels ? 'satellite' : id)
  }

  const handleHideLabelsChange = (value) => {
    setHideLabels(value)
    if (mapType === 'hybrid') map?.setMapTypeId(value ? 'satellite' : 'hybrid')
  }

  const handleMapClick = (e) => {
    if (!pickMode) return
    onPickLocation?.({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 bg-canopy-50 p-6 text-center">
        <AlertCircle className="h-6 w-6 text-clay-500" />
        <p className="font-medium text-bark-700">Google Maps API key missing</p>
        <p className="max-w-sm text-sm text-bark-500">
          Set <code className="rounded bg-white px-1 py-0.5">VITE_GOOGLE_MAPS_API_KEY</code> in your{' '}
          <code className="rounded bg-white px-1 py-0.5">.env</code> file to enable the interactive map.
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center bg-canopy-50 p-6 text-center text-sm text-danger-500">
        Couldn't load Google Maps. Check the API key and that the Maps JavaScript API is enabled.
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="flex h-full min-h-[320px] items-center justify-center bg-canopy-50 text-sm text-bark-400">Loading map…</div>
  }

  return (
    <div className="relative h-full w-full">
      {pickMode && (
        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-bark-700/90 px-3 py-1.5 text-xs font-medium text-white shadow-soft">
          <MapPin className="h-3.5 w-3.5" /> Tap the map to set the sighting location
        </div>
      )}
      {!pickMode && (
        <MapTypeToggle mapType={mapType} onChange={handleMapTypeChange} hideLabels={hideLabels} onHideLabelsChange={handleHideLabelsChange} />
      )}

      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={PARK_CENTER}
        zoom={PARK_DEFAULT_ZOOM}
        mapTypeId={effectiveMapTypeId}
        onLoad={onLoad}
        onClick={handleMapClick}
        options={{
          styles: effectiveStyles,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
        }}
      >
        {hotspots.map((loc) => {
          const speciesNames = (loc.speciesSlugs || [])
            .map((slug) => getSpeciesBySlug(slug)?.commonName)
            .filter(Boolean)
          return (
            <MarkerF
              key={loc.id}
              position={{ lat: loc.lat, lng: loc.lng }}
              icon={icons?.[loc.category]}
              onClick={() => {
                setActiveInfo({ type: 'hotspot', ...loc })
                onMarkerClick?.(loc)
              }}
            >
              {activeInfo?.type === 'hotspot' && activeInfo.id === loc.id && (
                <InfoWindowF onCloseClick={() => setActiveInfo(null)}>
                  <div className="min-w-[180px] max-w-[220px] p-1">
                    <p className="font-display text-sm font-semibold text-bark-800">{loc.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-bark-500">{loc.notes}</p>
                    {speciesNames.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {speciesNames.map((name) => (
                          <span key={name} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          )
        })}

        {sightings.map((s) => (
          <MarkerF
            key={s.id}
            position={{ lat: s.latitude, lng: s.longitude }}
            icon={icons?.sighting}
            onClick={() => setActiveInfo({ type: 'sighting', ...s })}
          >
            {activeInfo?.type === 'sighting' && activeInfo.id === s.id && (
              <InfoWindowF onCloseClick={() => setActiveInfo(null)}>
                <div className="min-w-[180px] max-w-[220px] p-1">
                  <p className="font-display text-sm font-semibold text-bark-800">{s.speciesCommonName}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-canopy-50 px-2 py-0.5 text-[10px] font-semibold text-canopy-600">
                    Verified sighting
                  </span>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}

        {userPosition && <MarkerF position={userPosition} icon={icons?.user} zIndex={999} />}
        {pickedLocation && <MarkerF position={pickedLocation} icon={icons?.picked} zIndex={1000} />}
      </GoogleMap>

      {!pickMode && (
        <button
          onClick={handleLocateClick}
          title={geoStatus === 'denied' ? 'Blocked — click the lock icon next to the address bar → Site settings → Location → Allow' : undefined}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-bark-700 shadow-soft hover:bg-villu-100"
        >
          <LocateFixed className={`h-4 w-4 ${geoStatus === 'requesting' ? 'animate-pulse text-clay-500' : 'text-canopy-500'}`} />
          {geoStatus === 'denied' ? 'Location blocked' : 'My location'}
        </button>
      )}
    </div>
  )
}
