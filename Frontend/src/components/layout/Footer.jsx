import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-canopy-100 bg-bark-700 text-villu-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="WilpattuVision" className="h-6 w-6 brightness-0 invert" />
              <span className="font-display text-lg font-semibold text-villu-50">WilpattuVision</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-villu-200/80">
              A BSc final year project supporting species awareness and citizen-science sighting logs
              for Wilpattu National Park, Sri Lanka.
            </p>
          </div>

          <div>
            <p className="label-eyebrow text-amber-300">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-villu-200/80">
              <li><Link to="/species" className="hover:text-villu-50">Species Encyclopedia</Link></li>
              <li><Link to="/identify" className="hover:text-villu-50">AI Identifier</Link></li>
              <li><Link to="/map" className="hover:text-villu-50">Park Map</Link></li>
              <li><Link to="/conservation" className="hover:text-villu-50">Conservation</Link></li>
            </ul>
          </div>

          <div>
            <p className="label-eyebrow text-amber-300">Project</p>
            <ul className="mt-3 space-y-2 text-sm text-villu-200/80">
              <li><Link to="/about" className="hover:text-villu-50">About this project</Link></li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-villu-200/50">
                  Sighting Leaderboard
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">Planned</span>
                </span>
              </li>
              <li><a href="https://www.dwc.gov.lk/" target="_blank" rel="noreferrer" className="hover:text-villu-50">Dept. of Wildlife Conservation</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-villu-100/10 pt-6 text-xs text-villu-200/60">
          © {new Date().getFullYear()} WilpattuVision. Built for academic purposes, not an official park resource.
        </div>
      </div>
    </footer>
  )
}
