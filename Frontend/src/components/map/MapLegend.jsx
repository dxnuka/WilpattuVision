import { LOCATION_CATEGORIES } from '../../data/parkLocations'

export default function MapLegend() {
  const items = [
    ...Object.values(LOCATION_CATEGORIES),
    { label: 'Verified community sighting', color: '#228b22' },
    { label: 'Your location', color: '#2d6cdf' },
  ]

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs text-bark-500">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}
