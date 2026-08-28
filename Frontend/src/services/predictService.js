import axios from 'axios'
import { identifySpeciesOffline } from '../lib/offlineModel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'


export class LowConfidenceError extends Error {
  constructor(topPrediction, source) {
    super('Confidence too low to identify this species confidently.')
    this.name = 'LowConfidenceError'
    this.topPrediction = topPrediction
    this.source = source
  }
}


export class NotRecognizedError extends Error {
  constructor(source) {
    super("This doesn't look like one of Wilpattu's known species.")
    this.name = 'NotRecognizedError'
    this.source = source
  }
}

export class OfflineModelUnavailableError extends Error {
  constructor() {
    super("The backup identifier isn't available offline on this device yet.")
    this.name = 'OfflineModelUnavailableError'
  }
}


function resolveOutcome({ predictions, isRecognizedSpecies, isConfident, thresholdUsed, source }) {
  if (!predictions?.length) {
    throw new Error('The model did not return a usable prediction. Try a clearer photo.')
  }

  if (isRecognizedSpecies === false) {
    throw new NotRecognizedError(source)
  }
  if (isConfident === false) {
    throw new LowConfidenceError(predictions[0], source)
  }

  return { predictions, thresholdUsed, source }
}

export async function identifySpecies(imageFile) {
  if (!imageFile) {
    throw new Error('No image file provided.')
  }

  const formData = new FormData()
  formData.append('file', imageFile)

  let response
  try {
    response = await axios.post(`${API_BASE_URL}/predict`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      validateStatus: (status) => status < 500,
      timeout: 12000,
    })
  } catch {

    let offlineResult
    try {
      offlineResult = await identifySpeciesOffline(imageFile)
    } catch {

      throw new OfflineModelUnavailableError()
    }
    return resolveOutcome(offlineResult)
  }

  const { data, status } = response

  if (status >= 400) {
    throw new Error(data?.detail || `Prediction failed (status ${status}).`)
  }

  return resolveOutcome({
    predictions: (data?.top_3 || []).map((p) => ({
      species: p.species,
      rawLabel: p.raw_label,
      confidence: p.confidence,
    })),
    isRecognizedSpecies: data.is_recognized_species,
    isConfident: data.is_confident,
    thresholdUsed: data.threshold_used,
    source: 'online',
  })
}