import { Link } from 'react-router-dom'
import { getSpeciesByRawLabel } from '../../data/species'

export default function PredictionResults({ predictions }) {
  if (!predictions?.length) return null

  const [top, ...rest] = predictions
  const species = getSpeciesByRawLabel(top.rawLabel, top.species)
  const topPct = Math.round(top.confidence * 100)

  return (
    <div className="card p-6">
      <h2 className="text-center text-xl font-semibold text-bark-800">Results</h2>

      <div className="mt-4 rounded-2xl border border-canopy-100 p-5">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-bark-800">{top.species}</p>
          {species && <p className="text-sm italic text-bark-400">{species.scientificName}</p>}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm text-bark-500">
            <span>Confidence</span>
            <span className="font-mono font-semibold text-bark-800">{topPct}%</span>
          </div>
          <div className="relative mt-2 h-1.5 rounded-full bg-canopy-100">
            <div className="h-full rounded-full bg-canopy-400" style={{ width: `${topPct}%` }} />
            <div
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-clay-400 shadow-soft"
              style={{ left: `calc(${topPct}% - 8px)` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          {rest.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-bark-700">Other possibilities</p>
              <ul className="mt-1.5 space-y-1 text-sm text-bark-500">
                {rest.map((p) => (
                  <li key={p.rawLabel}>
                    - {p.species} — {Math.round(p.confidence * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          )}

          {species ? (
            <div className="rounded-xl bg-clay-50 px-4 py-3 text-center">
              <p className="label-eyebrow !text-clay-500">IUCN Red List</p>
              <p className="mt-1 text-sm font-semibold text-bark-800">{species.conservationStatus}</p>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-100/60 px-4 py-3 text-center text-xs text-amber-700">
              No encyclopedia entry linked for this species yet.
            </div>
          )}
        </div>

        {species && (
          <div className="mt-5 text-center">
            <Link to={`/species/${species.slug}`} className="text-sm font-semibold text-clay-500 underline-offset-2 hover:underline">
              View Full Species Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
