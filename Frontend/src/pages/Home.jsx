import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, MapPin, BookOpen } from 'lucide-react'
import SightingRow from '../components/sightings/SightingRow'
import MissionSection from '../components/home/MissionSection'
import { getVerifiedSightings } from '../services/sightingsService'
import { useToast } from '../hooks/useToast'

export default function Home() {
  const navigate = useNavigate()
  const toast = useToast()
  const [sightings, setSightings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getVerifiedSightings(5)
      .then(setSightings)
      .catch((err) => {
        console.error('[Home] Failed to load recent sightings:', err)
        toast.error('Could not load recent sightings.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden bg-canopy-700">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, var(--color-canopy-400) 0, transparent 45%), radial-gradient(circle at 80% 60%, var(--color-clay-400) 0, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="label-eyebrow text-amber-300">Wilpattu National Park &middot; Sri Lanka</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-villu-50 sm:text-6xl">
            Discover Wilpattu Wildlife
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-villu-100/85">
            Identify species from your photos, explore the park map, and browse the encyclopedia of
            Wilpattu's wildlife.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/identify" className="btn-clay">
              <Camera className="h-4 w-4" /> Identify a Species
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Link to="/map" className="card group flex flex-col gap-3 p-6 transition-transform hover:-translate-y-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-canopy-50 text-canopy-500 group-hover:bg-clay-50 group-hover:text-clay-500">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-bark-800">Park Map</h3>
            <p className="text-sm text-bark-500">Species sighting hotspots</p>
          </Link>
          <Link to="/species" className="card group flex flex-col gap-3 p-6 transition-transform hover:-translate-y-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-canopy-50 text-canopy-500 group-hover:bg-clay-50 group-hover:text-clay-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-bark-800">Encyclopedia</h3>
            <p className="text-sm text-bark-500">Learn about the fauna</p>
          </Link>
        </div>
      </section>

      <MissionSection />

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-semibold text-bark-800">Recent Sightings</h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-3">
          {loading ? (
            <p className="py-6 text-center text-sm text-bark-400">Loading sightings…</p>
          ) : sightings.length === 0 ? (
            <p className="py-6 text-center text-sm text-bark-400">No verified sightings yet — be the first to log one!</p>
          ) : (
            sightings.map((s) => (
              <SightingRow
                key={s.id}
                sighting={s}
                onViewOnMap={(sight) => navigate(`/map?species=${sight.speciesSlug}`)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
