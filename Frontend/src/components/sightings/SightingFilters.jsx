import { SPECIES } from '../../data/species'
import { getTodayISODate } from '../../lib/dateConstraints'

export default function SightingFilters({
  sort,
  onSortChange,
  speciesSlug,
  onSpeciesChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  showSort = true,
  center = false,
}) {
  const today = getTodayISODate()

  return (
    <div className={`flex flex-wrap items-center gap-3 ${center ? 'justify-center' : ''}`}>
      {showSort && (
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-full border-0 bg-canopy-50 px-4 py-2 text-sm font-medium text-bark-700 focus:ring-2 focus:ring-clay-200"
        >
          <option value="newest">Newest to oldest</option>
          <option value="oldest">Oldest to newest</option>
        </select>
      )}

      <select
        value={speciesSlug}
        onChange={(e) => onSpeciesChange(e.target.value)}
        className="rounded-full border-0 bg-canopy-50 px-4 py-2 text-sm font-medium text-bark-700 focus:ring-2 focus:ring-clay-200"
      >
        <option value="">All species</option>
        {SPECIES.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.commonName}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1.5 rounded-full bg-canopy-50 px-3 py-1.5">
        <input
          type="date"
          value={dateFrom}
          max={dateTo || today}
          onChange={(e) => onDateFromChange(e.target.value)}
          aria-label="From date"
          className="border-0 bg-transparent text-sm font-medium text-bark-700 focus:outline-none"
        />
        <span className="text-xs text-bark-400">to</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          max={today}
          onChange={(e) => onDateToChange(e.target.value)}
          aria-label="To date"
          className="border-0 bg-transparent text-sm font-medium text-bark-700 focus:outline-none"
        />
      </div>
    </div>
  )
}
