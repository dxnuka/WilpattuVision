export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-canopy-200 border-t-clay-400" />
        <p className="label-eyebrow">Loading</p>
      </div>
    </div>
  )
}
