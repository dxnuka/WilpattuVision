import { Mail, MapPin, Code2 } from 'lucide-react'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="label-eyebrow">About</p>
      <h1 className="mt-2 text-3xl font-semibold">About WilpattuVision</h1>
      <p className="mt-4 text-bark-600">
        WilpattuVision is a BSc final-year project combining a Keras/EfficientNetB3 species
        classifier with a citizen-science sighting log for Wilpattu National Park, Sri Lanka.
      </p>

      <div className="card mt-10 p-6">
        <h2 className="text-lg font-semibold text-bark-800">Contact</h2>
        <p className="mt-1 text-sm text-bark-500">
          Questions, feedback, or spotted a bug? Get in touch 
        </p>

        <div className="mt-5 space-y-3">
          <a href="mailto:your.email@example.com" className="flex items-center gap-3 text-sm text-bark-700 hover:text-canopy-600">
            <Mail className="h-4 w-4 shrink-0 text-canopy-500" />
            danukasenadeera7@gmail.com
          </a>
          <a
            href="https://github.com/your-username/wilpattuvision"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-sm text-bark-700 hover:text-canopy-600"
          >
            <Code2 className="h-4 w-4 shrink-0 text-canopy-500" />
            github.com/dxnuka/WilpattuVision
          </a>
          <div className="flex items-center gap-3 text-sm text-bark-700">
            <MapPin className="h-4 w-4 shrink-0 text-canopy-500" />
            Wilpattu National Park, Sri Lanka
          </div>
        </div>
      </div>
    </div>
  )
}
