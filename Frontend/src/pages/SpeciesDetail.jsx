import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getSpeciesBySlug } from '../data/species'
import ImageGallery from '../components/common/ImageGallery'

export default function SpeciesDetail() {
  const { slug } = useParams()
  const species = getSpeciesBySlug(slug)

  if (!species) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Species not found</h1>
        <p className="mt-2 text-bark-500">We don't have a record for "{slug}".</p>
        <Link to="/species" className="btn-primary mt-6 inline-flex">
          Back to encyclopedia
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/species" className="inline-flex items-center gap-2 text-sm font-medium text-canopy-600 hover:text-canopy-700">
        <ArrowLeft className="h-4 w-4" /> Back to encyclopedia
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow">{species.category}</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{species.commonName}</h1>
          <p className="mt-1 text-lg italic text-bark-400">{species.scientificName}</p>
        </div>
        <div className="rounded-xl bg-clay-50 px-4 py-2.5 text-center">
          <p className="label-eyebrow !text-clay-500">IUCN Red List</p>
          <p className="text-sm font-semibold text-bark-800">{species.conservationStatus}</p>
        </div>
      </div>

      <div className="mt-6">
        <ImageGallery folder={`species/${species.slug}`} emptyLabel="No reference photos uploaded yet" />
      </div>

      <div className="card mt-8 p-6">
        <h2 className="text-lg font-semibold text-bark-800">Overview</h2>
        <p className="mt-2 text-bark-600">{species.summary}</p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
  <div className="card !bg-canopy-50 p-6">
    <h3 className="text-sm font-semibold text-bark-800">Diet</h3>
    <p className="mt-2 text-sm text-bark-500">{species.diet}</p>
  </div>

  <div className="card !bg-canopy-50 p-6">
    <h3 className="text-sm font-semibold text-bark-800">Habitat</h3>
    <p className="mt-2 text-sm text-bark-500">{species.habitat}</p>
  </div>
</div>

      <div className="card mt-6 p-6">
  <h3 className="text-sm font-semibold text-bark-800">Conservation</h3>

  <p className="mt-2 text-sm text-bark-500">
    <span className="font-medium text-bark-700">Threats: </span>
    {species.threats}
  </p>

  <p className="mt-5 text-sm text-bark-500">
    <span className="font-medium text-bark-700">Actions: </span>
    {species.actions}
  </p>

  <Link
    to="/conservation"
    className="mt-3 inline-block text-sm font-semibold text-clay-500 hover:underline"
  >
    Read more in Conservation →
  </Link>
</div>

      <div className="mt-8 text-center">
        <Link to="/identify" className="btn-clay inline-flex">
          Think you saw one? Identify your photo
        </Link>
      </div>
    </div>
  )
}
