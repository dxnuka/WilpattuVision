import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { PARK_CENTER, PARK_DEFAULT_ZOOM, LOCATION_CATEGORIES } from '../../data/parkLocations'
import { createLeafletIcon } from './leafletIcon'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getSpeciesBySlug } from '../../data/species'

function FlyToLocation({ location }) {
  const map = useMap()
  if (location) {
    map.flyTo([location.lat, location.lng], 13, { duration: 0.8 })
  }
  return null
}

function ClickToPick({ pickMode, onPickLocation }) {
  useMapEvents({
    click(e) {
      if (pickMode) onPickLocation?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}


export default function LeafletOfflineMap({
  hotspots = [],
  sightings = [],
  focusLocation = null,
  onMarkerClick,
  pickMode = false,
  onPickLocation,
  pickedLocation = null,
}) {
  const [activeId, setActiveId] = useState(null)
 
  const { position: userPosition } = useGeolocation({ watch: true })

  const icons = useMemo(
    () => ({
      hotspot: createLeafletIcon(LOCATION_CATEGORIES.hotspot.color),
      entrance: createLeafletIcon(LOCATION_CATEGORIES.entrance.color),
      camp: createLeafletIcon(LOCATION_CATEGORIES.camp.color),
      sighting: createLeafletIcon('#228b22'),
      user: createLeafletIcon('#2d6cdf'),
      picked: createLeafletIcon('#954f2c', { active: true }),
    }),
    []
  )

  return (
    <div className="relative h-full w-full">
      {pickMode && (
        <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-bark-700/90 px-3 py-1.5 text-xs font-medium text-white shadow-soft">
          Tap the map to set the sighting location
        </div>
      )}
      <MapContainer
        center={[PARK_CENTER.lat, PARK_CENTER.lng]}
        zoom={PARK_DEFAULT_ZOOM}
        minZoom={9}
        maxZoom={13}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          minZoom={9}
          maxZoom={13}
        />
        {focusLocation && <FlyToLocation location={focusLocation} />}
        <ClickToPick pickMode={pickMode} onPickLocation={onPickLocation} />

        {hotspots.map((loc) => {
          const speciesNames = (loc.speciesSlugs || [])
            .map((slug) => getSpeciesBySlug(slug)?.commonName)
            .filter(Boolean)
          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={icons[loc.category]}
              eventHandlers={{
                click: () => {
                  setActiveId(loc.id)
                  onMarkerClick?.(loc)
                },
              }}
            >
              {activeId === loc.id && (
                <Popup className="wv-popup" onClose={() => setActiveId(null)}>
                  <div className="min-w-[160px] max-w-[200px]">
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
                </Popup>
              )}
            </Marker>
          )
        })}

        {sightings.map((s) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={icons.sighting}
            eventHandlers={{ click: () => setActiveId(s.id) }}
          >
            {activeId === s.id && (
              <Popup className="wv-popup" onClose={() => setActiveId(null)}>
                <div className="min-w-[160px] max-w-[200px]">
                  <p className="font-display text-sm font-semibold text-bark-800">{s.speciesCommonName}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-canopy-50 px-2 py-0.5 text-[10px] font-semibold text-canopy-600">
                    Verified sighting
                  </span>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {userPosition && <Marker position={[userPosition.lat, userPosition.lng]} icon={icons.user} />}
        {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={icons.picked} />}
      </MapContainer>
    </div>
  )
}
