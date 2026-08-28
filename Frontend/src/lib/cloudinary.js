
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * @param {File} file
 * @param {{ folder?: string }} [options] - Cloudinary folder path, e.g. "sightings/uid123"
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadToCloudinary(file, { folder } = {}) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env.'
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  if (folder) formData.append('folder', folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message || 'Image upload failed.')
  }

  const data = await response.json()
  return { url: data.secure_url, publicId: data.public_id }
}
