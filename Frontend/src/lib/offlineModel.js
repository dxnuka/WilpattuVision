import * as tf from '@tensorflow/tfjs'

const MODEL_PATH = '/models/offline/model.json'
const INDEXEDDB_MODEL_URL = 'indexeddb://wilpattuvision-offline-model'

function absoluteModelUrl() {

  return new URL(MODEL_PATH, window.location.origin).href
}


const INPUT_SIZE = 300

const NONE_OF_ABOVE_RAW_LABEL = 'None_of_the_above'


const RAW_LABELS = [
  'Asian_elephant',
  'Bengal_monitor_lizard',
  'Crested_serpent_eagle',
  'Fishing_cat',
  'Golden_jackal',
  'Mugger_crocodile',
  NONE_OF_ABOVE_RAW_LABEL,
  'Sambar_deer',
  'Sloth_bear',
  'Spotted_deer',
  'Sri_Lankan_grey_langur',
  'Sri_Lankan_jungle_fowl',
  'Sri_Lankan_leopard',
  'Sri_Lankan_peacock',
  'Water_buffalo',
  'Wild_boar',
]


export const OFFLINE_CONFIDENCE_THRESHOLD = 0.75

let modelPromise = null


function getModel() {
  if (!modelPromise) {
    modelPromise = tf
      .loadGraphModel(INDEXEDDB_MODEL_URL)
      .catch(() => tf.loadGraphModel(absoluteModelUrl()))
  }
  return modelPromise
}


export function preloadOfflineModel() {
  getModel().catch(() => {
  })
}


export async function isOfflineModelSaved() {
  try {
    const models = await tf.io.listModels()
    return Boolean(models[INDEXEDDB_MODEL_URL])
  } catch {
    return false
  }
}


export async function downloadOfflineModel({ onProgress, force = false } = {}) {
  if (!force && (await isOfflineModelSaved())) {
    onProgress?.(1)
    return
  }

  await tf.loadGraphModel(absoluteModelUrl(), {
    onProgress: (fraction) => onProgress?.(fraction),
  })
  await tf.io.copyModel(absoluteModelUrl(), INDEXEDDB_MODEL_URL)


  modelPromise = null
}


function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}


export async function identifySpeciesOffline(file) {
  const model = await getModel()
  const img = await fileToImage(file)

  const predictions = tf.tidy(() => {

    const tensor = tf.browser
      .fromPixels(img)
      .resizeBilinear([INPUT_SIZE, INPUT_SIZE])
      .expandDims(0)
      .toFloat()
    const output = model.predict(tensor)
    return output.dataSync()
  })

  URL.revokeObjectURL(img.src)

  const scored = Array.from(predictions)
    .map((confidence, i) => ({
      species: RAW_LABELS[i] === NONE_OF_ABOVE_RAW_LABEL
        ? 'Not a recognizable species'
        : RAW_LABELS[i].replace(/_/g, ' '),
      rawLabel: RAW_LABELS[i],
      confidence,
    }))
    .sort((a, b) => b.confidence - a.confidence)

  const top3 = scored.slice(0, 3)
  const top = top3[0]
  const isRecognizedSpecies = top.rawLabel !== NONE_OF_ABOVE_RAW_LABEL
  const isConfident = isRecognizedSpecies && top.confidence >= OFFLINE_CONFIDENCE_THRESHOLD

  return {
    predictions: top3,
    isRecognizedSpecies,
    isConfident,
    thresholdUsed: OFFLINE_CONFIDENCE_THRESHOLD,
    source: 'offline',
  }
}