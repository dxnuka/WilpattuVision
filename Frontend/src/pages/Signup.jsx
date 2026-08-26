import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { validateName, validatePassword } from '../lib/validators'

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nameError, setNameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const nErr = validateName(name)
    const pErr = validatePassword(password)
    setNameError(nErr)
    setPasswordError(pErr)
    if (nErr || pErr) return

    setLoading(true)
    try {
      await signUp(email, password, name.trim())
      toast.success('Account created — welcome to WilpattuVision!')
      navigate('/')
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? "That email is already registered. If it's yours, sign in — or use \"Forgot password?\" on the sign-in page to regain access."
          : 'Could not create your account.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Account created — welcome to WilpattuVision!')
      navigate('/')
    } catch {
      setError('Could not sign up with Google.')
      toast.error('Google sign-up failed.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12 sm:px-6">
      <div className="card w-full p-8">
        <h1 className="text-center text-2xl font-semibold">Create an account</h1>
        <p className="mt-1 text-center text-sm text-bark-500">Join WilpattuVision to log your wildlife sightings.</p>

        <button onClick={handleGoogle} disabled={googleLoading} className="btn-secondary mt-6 w-full">
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-bark-300">
          <div className="h-px flex-1 bg-canopy-100" />
          or
          <div className="h-px flex-1 bg-canopy-100" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bark-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError('')
              }}
              className="input-field"
            />
            {nameError && <p className="mt-1 text-xs text-danger-500">{nameError}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bark-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bark-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordError('')
              }}
              className="input-field"
            />
            <p className="mt-1 text-xs text-bark-400">8–16 characters, with at least one number and one special character.</p>
            {passwordError && <p className="mt-1 text-xs text-danger-500">{passwordError}</p>}
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-bark-500">
          Already have an account? <Link to="/login" className="font-medium text-clay-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.4 0-9.9-3.4-11.5-8.1l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.4C41.5 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}
