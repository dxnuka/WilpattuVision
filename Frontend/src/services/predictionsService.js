import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { uploadToCloudinary } from '../lib/cloudinary'

const PREDICTIONS_COLLECTION = 'predictions'


async function uploadPredictionPhoto(file, uid) {
  const owner = uid || 'anonymous'
  const { url } = await uploadToCloudinary(file, { folder: `predictions/${owner}` })
  return url
}

export async function savePrediction({ file, uid, predictions, isConfident, thresholdUsed }) {
  const image = await uploadPredictionPhoto(file, uid)
  const docRef = await addDoc(collection(db, PREDICTIONS_COLLECTION), {
    u_id: uid || null,
    image,
    predictions,
    isConfident,
    thresholdUsed,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}
