import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

const NOTICES_COLLECTION = 'notices'
const READS_COLLECTION = 'noticeReads'


export async function createNotice({ title, body, authorAdminId, recipientUid = 'all' }) {
  const docRef = await addDoc(collection(db, NOTICES_COLLECTION), {
    title,
    body,
    authorAdminId,
    recipientUid,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

function sortByCreatedAtDesc(docs) {
  return [...docs].sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0)
    const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0)
    return db_ - da
  })
}


export async function getPrivateNotices(uid) {
  if (!uid) return []
  const q = query(collection(db, NOTICES_COLLECTION), where('recipientUid', '==', uid))
  const snap = await getDocs(q)
  return sortByCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}


export async function getCommonNotices() {
  const q = query(collection(db, NOTICES_COLLECTION), where('recipientUid', '==', 'all'))
  const snap = await getDocs(q)
  return sortByCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}


export async function getReadNoticeIds(uid) {
  if (!uid) return new Set()
  const q = query(collection(db, READS_COLLECTION), where('uid', '==', uid))
  const snap = await getDocs(q)
  return new Set(snap.docs.map((d) => d.data().noticeId))
}

export async function markNoticeRead(uid, noticeId) {
  await setDoc(doc(db, READS_COLLECTION, `${uid}_${noticeId}`), {
    uid,
    noticeId,
    readAt: serverTimestamp(),
  })
}
