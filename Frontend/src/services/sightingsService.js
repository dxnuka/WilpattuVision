import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { getRestrictedUserIds } from './usersService'

const SIGHTINGS_COLLECTION = 'sightings'


const MAX_PHOTOS = 5

/** Uploads up to 5 sighting photos to Cloudinary, returning their public URLs. */
export async function uploadSightingPhotos(files, uid) {
  const toUpload = files.slice(0, MAX_PHOTOS)
  const urls = await Promise.all(
    toUpload.map(async (file) => {
      const { url } = await uploadToCloudinary(file, { folder: `sightings/${uid}` })
      return url
    })
  )
  return urls
}


/**
 * Creates a new sighting log entry.
 * @param {{
 *   u_id: string,
 *   sp_id: number,
 *   speciesSlug: string,
 *   speciesCommonName: string,
 *   notes: string,
 *   latitude: number,
 *   longitude: number,
 *   image: string | null,
 *   observedAt: Date,
 * }} entry
 */
/**
 * @param {object} entry
 * @param {{ autoVerify?: boolean, verifiedAdminId?: string|null }} [options]
 *   autoVerify: true when the submitting user is an admin — their own
 *   sightings skip the review queue and go straight to 'verified'.
 */
export async function createSighting(entry, { autoVerify = false, verifiedAdminId = null } = {}) {
  const docRef = await addDoc(collection(db, SIGHTINGS_COLLECTION), {
    ...entry,
    verificationStatus: autoVerify ? 'verified' : 'pending',
    verifiedAdminId: autoVerify ? verifiedAdminId : null,
    rejectionReason: null,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}


export async function getSightingsForUser(uid) {

  const q = query(collection(db, SIGHTINGS_COLLECTION), where('u_id', '==', uid))
  const snap = await getDocs(q)
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return sortByCreatedAtDesc(all)
}


export async function getVerifiedSightings(max = 20) {

  const q = query(collection(db, SIGHTINGS_COLLECTION), where('verificationStatus', '==', 'verified'))
  const snap = await getDocs(q)
  const all = sortByCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))


  let restrictedUids = new Set()
  try {
    restrictedUids = await getRestrictedUserIds()
  } catch (err) {

    console.warn('[sightingsService] Could not check restricted users — showing all verified sightings unfiltered.', err)
  }

  return all.filter((s) => !restrictedUids.has(s.u_id)).slice(0, max)
}

function sortByCreatedAtDesc(docs) {
  return [...docs].sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
    return db_ - da
  })
}


export async function getAllSightings() {
  const q = query(collection(db, SIGHTINGS_COLLECTION), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}


export async function getSightingById(id) {
  const snap = await getDoc(doc(db, SIGHTINGS_COLLECTION, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}


export async function updateSightingStatus(id, verificationStatus, adminUid, rejectionReason = null) {
  await updateDoc(doc(db, SIGHTINGS_COLLECTION, id), {
    verificationStatus,
    verifiedAdminId: adminUid,
    rejectionReason: verificationStatus === 'rejected' ? rejectionReason : null,
    reviewedAt: serverTimestamp(),
  })
}

export async function deleteSighting(id) {
  await deleteDoc(doc(db, SIGHTINGS_COLLECTION, id))
}
