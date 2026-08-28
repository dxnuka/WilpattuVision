import { useEffect, useState } from 'react'
import { Loader2, Trash2, Pencil, X, MapPin } from 'lucide-react'
import { getHotspots, createHotspot, updateHotspot, deleteHotspot } from '../../services/hotspotsService'
import { SPECIES } from '../../data/species'
import { LOCATION_CATEGORIES } from '../../data/parkLocations'
import { useToast } from '../../hooks/useToast'
import PageLoader from '../../components/common/PageLoader'
import ParkMapView from '../../components/map/ParkMapView'

const emptyForm = { name: '', category: 'hotspot', notes: '', speciesSlugs: [], location: null }

export default function AdminHotspots() {
  const toast = useToast()
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pickMode, setPickMode] = useState(false)

  const load = () => getHotspots().then(setHotspots).finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setPickMode(false)
  }

  const toggleSpecies = (slug) => {
    setForm((f) => ({
      ...f,
      speciesSlugs: f.speciesSlugs.includes(slug) ? f.speciesSlugs.filter((s) => s !== slug) : [...f.speciesSlugs, slug],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.location) {
      toast.error('Pick a location on the map first.')
      return
    }
    setSaving(true)
    try {
      const data = {
        name: form.name,
        category: form.category,
        notes: form.notes,
        lat: form.location.lat,
        lng: form.location.lng,
        ...(form.category === 'hotspot' ? { speciesSlugs: form.speciesSlugs } : {}),
      }
      if (editingId) {
        await updateHotspot(editingId, data)
        toast.success('Location updated.')
      } else {
        await createHotspot(data)
        toast.success('Location added.')
      }
      resetForm()
      await load()
    } catch {
      toast.error('Could not save this location.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (h) => {
    setEditingId(h.id)
    setForm({
      name: h.name,
      category: h.category,
      notes: h.notes || '',
      speciesSlugs: h.speciesSlugs || [],
      location: { lat: h.lat, lng: h.lng },
    })
    document.getElementById('hotspot-composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this location? This cannot be undone.')) return
    try {
      await deleteHotspot(id)
      toast.success('Location deleted.')
      if (editingId === id) resetForm()
      await load()
    } catch {
      toast.error('Could not delete this location.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">Species hotspots</h1>
      <p className="mt-2 text-bark-500">Manage the map's hotspot, entrance, and campsite markers.</p>

      <form id="hotspot-composer" onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-bark-800">{editingId ? 'Edit location' : 'New location'}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="flex items-center gap-1 text-xs text-bark-400 hover:text-bark-600">
              <X className="h-3.5 w-3.5" /> Cancel edit
            </button>
          )}
        </div>

        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Location name, e.g. 'Maha Villu'"
          className="input-field"
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="input-field"
          >
            {Object.entries(LOCATION_CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {form.category === 'hotspot' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bark-700">Species found here</label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {SPECIES.map((s) => (
                <label key={s.slug} className="flex items-center gap-1.5 text-xs text-bark-600">
                  <input
                    type="checkbox"
                    checked={form.speciesSlugs.includes(s.slug)}
                    onChange={() => toggleSpecies(s.slug)}
                    className="h-3.5 w-3.5 rounded border-canopy-300 text-canopy-500 focus:ring-clay-300"
                  />
                  {s.commonName}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-bark-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-bark-700">Location</span>
            <button
              type="button"
              onClick={() => setPickMode((v) => !v)}
              className={`flex items-center gap-1 text-xs font-medium ${pickMode ? 'text-clay-500' : 'text-canopy-600'}`}
            >
              <MapPin className="h-3.5 w-3.5" /> {pickMode ? 'Picking...' : form.location ? 'Change on map' : 'Pick on map'}
            </button>
          </label>
          {form.location && (
            <p className="text-xs text-bark-400">{form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}</p>
          )}
          {pickMode && (
            <div className="mt-2 h-64 overflow-hidden rounded-xl border border-canopy-200">
              <ParkMapView
                hotspots={hotspots}
                sightings={[]}
                pickMode
                pickedLocation={form.location}
                onPickLocation={(loc) => {
                  setForm((f) => ({ ...f, location: loc }))
                  setPickMode(false)
                }}
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add location'}
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-bark-800">All locations</h2>
      <div className="mt-4 space-y-3">
        {loading ? (
          <PageLoader />
        ) : hotspots.length === 0 ? (
          <p className="py-6 text-center text-sm text-bark-400">No locations yet — add one above.</p>
        ) : (
          hotspots.map((h) => (
            <div key={h.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: LOCATION_CATEGORIES[h.category]?.color }} />
                  <p className="truncate font-medium text-bark-800">{h.name}</p>
                </div>
                {h.speciesSlugs?.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-bark-400">
                    {h.speciesSlugs.map((slug) => SPECIES.find((s) => s.slug === slug)?.commonName).filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => handleEdit(h)} aria-label="Edit" className="rounded-full p-1.5 text-canopy-600 hover:bg-canopy-50">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(h.id)} aria-label="Delete" className="rounded-full p-1.5 text-danger-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
