import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <Compass className="h-12 w-12 text-canopy-300" />
      <h1 className="mt-4 text-3xl font-semibold">Off the trail</h1>
      <p className="mt-2 text-bark-500">This page doesn't exist. Let's get you back on track.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  )
}
