import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'

const USERS_COLLECTION = 'users'

export async function getAllUsers() {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}


export async function getRestrictedUserIds() {
  const q = query(collection(db, USERS_COLLECTION), where('restricted', '==', true))
  const snap = await getDocs(q)
  return new Set(snap.docs.map((d) => d.id))
}


export async function setUserRestricted(uid, restricted) {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { restricted })
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, USERS_COLLECTION, uid), data)
}


export async function uploadProfilePicture(file, uid) {
  const { url } = await uploadToCloudinary(file, { folder: `profile-pictures/${uid}` })
  await updateUserProfile(uid, { photoURL: url })
  return url
}


export async function removeProfilePicture(uid) {
  await updateUserProfile(uid, { photoURL: null })
}
