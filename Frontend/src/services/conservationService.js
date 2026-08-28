import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

const ARTICLES_COLLECTION = 'conservationArticles'


export async function getArticles() {
  const q = query(collection(db, ARTICLES_COLLECTION), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getArticleById(id) {
  const snap = await getDoc(doc(db, ARTICLES_COLLECTION, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function createArticle({ title, body, authorAdminId }) {
  const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
    title,
    body,
    authorAdminId,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateArticle(id, data) {
  await updateDoc(doc(db, ARTICLES_COLLECTION, id), data)
}

export async function deleteArticle(id) {
  await deleteDoc(doc(db, ARTICLES_COLLECTION, id))
}
