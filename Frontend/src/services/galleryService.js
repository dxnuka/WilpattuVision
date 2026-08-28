import { collection, addDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'

const GALLERY_COLLECTION = 'galleryImages'



/** Fetches image URLs for a given gallery folder, most recent first. */
export async function getGalleryImages(folder) {
  const q = query(collection(db, GALLERY_COLLECTION), where('folder', '==', folder))
  const snap = await getDocs(q)
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return all.sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
    return db_ - da
  })
}

export async function getFirstGalleryImage(folder) {
  const q = query(collection(db, GALLERY_COLLECTION), where('folder', '==', folder))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const all = snap.docs.map((d) => d.data())
  const newest = all.reduce((latest, img) => {
    const t = img.createdAt?.toDate ? img.createdAt.toDate() : new Date(0)
    const latestT = latest.createdAt?.toDate ? latest.createdAt.toDate() : new Date(0)
    return t > latestT ? img : latest
  })
  return newest.url
}


export async function addGalleryImage(folder, file) {
  const { url, publicId } = await uploadToCloudinary(file, { folder: `gallery/${folder}` })
  await addDoc(collection(db, GALLERY_COLLECTION), {
    folder,
    url,
    publicId,
    createdAt: serverTimestamp(),
  })
  return url
}

export async function removeGalleryImage(id) {
  await deleteDoc(doc(db, GALLERY_COLLECTION, id))
}


export async function reassignGalleryFolder(oldFolder, newFolder) {
  const q = query(collection(db, GALLERY_COLLECTION), where('folder', '==', oldFolder))
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.update(d.ref, { folder: newFolder }))
  await batch.commit()
}
