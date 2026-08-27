import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldOff } from 'lucide-react'
import SightingForm from '../components/forms/SightingForm'
import { useAuth } from '../hooks/useAuth'

export default function AddSighting() {
  const { isRestricted } = useAuth()

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/map" className="inline-flex items-center gap-2 text-sm font-medium text-canopy-600 hover:text-canopy-700">
        <ArrowLeft className="h-4 w-4" /> Back to map
      </Link>

      <p className="label-eyebrow mt-6 text-center">Add Sighting</p>
      <h1 className="mt-2 text-center text-3xl font-semibold">Log a wildlife sighting</h1>
      <p className="mt-2 text-center text-bark-500">
        Submissions are reviewed by an admin before appearing publicly on the map.
      </p>

      {isRestricted && (
        <div className="card mt-6 flex items-start gap-3 bg-amber-100/60 p-4 text-amber-700">
          <ShieldOff className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            Your account is currently restricted - you can still submit a sighting, but it{' '}
            <strong>won't be shown publicly</strong> on the map or Recent Sightings even if verified,
            until the restriction is lifted.
          </p>
        </div>
      )}

      <div className="mt-6">
        <SightingForm />
      </div>
    </div>
  )
}
