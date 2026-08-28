import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { PARK_LOCATIONS } from '../data/parkLocations'

const HOTSPOTS_COLLECTION = 'hotspots'


export async function getHotspots() {
  const snap = await getDocs(collection(db, HOTSPOTS_COLLECTION))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createHotspot(data) {
  const docRef = await addDoc(collection(db, HOTSPOTS_COLLECTION), data)
  return docRef.id
}

export async function updateHotspot(id, data) {
  await updateDoc(doc(db, HOTSPOTS_COLLECTION, id), data)
}

export async function deleteHotspot(id) {
  await deleteDoc(doc(db, HOTSPOTS_COLLECTION, id))
}


export async function seedDefaultHotspots() {
  const results = await Promise.all(
    PARK_LOCATIONS.map((loc) => {
      const { id: _unused, ...data } = loc
      return createHotspot(data)
    })
  )
  return results.length
}
