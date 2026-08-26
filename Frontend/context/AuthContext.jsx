import { createContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

export const AuthContext = createContext(undefined)


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(profileSnap.exists() ? profileSnap.data() : null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const ensureUserProfile = async (firebaseUser, extra = {}) => {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const data = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || extra.displayName || '',
        photoURL: null,
        role: 'visitor',
        restricted: false,
        createdAt: serverTimestamp(),
      }
      await setDoc(ref, data)
      setProfile(data)
    } else {
      setProfile(snap.data())
    }
  }

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const signUp = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    await ensureUserProfile(cred.user, { displayName })
    sendEmailVerification(cred.user).catch(() => {})
    return cred
  }

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider)
    await ensureUserProfile(cred.user)
    return cred
  }

  const signOut = () => firebaseSignOut(auth)


  const refreshProfile = async () => {
    if (!user) return
    const snap = await getDoc(doc(db, 'users', user.uid))
    setProfile(snap.exists() ? snap.data() : null)
  }

  const value = {
    user,
    profile,
    role: profile?.role || null,
    isAdmin: profile?.role === 'admin',
    isRestricted: !!profile?.restricted,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
