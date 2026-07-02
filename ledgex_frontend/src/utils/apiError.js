function formatFieldName(field) {
  return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').trim()
}

/**
 * Parses an axios error into a user-facing message (string or list of strings).
 * Handles ApiResponse shape: { message, data: { field: "error" } }.
 */
export function parseApiError(err, fallback = 'Something went wrong. Please try again.') {
  const body = err?.response?.data
  if (!body) return fallback

  const fieldData = body.data
  if (fieldData && typeof fieldData === 'object' && !Array.isArray(fieldData)) {
    const fieldErrors = Object.entries(fieldData).filter(
      ([, msg]) => typeof msg === 'string' && msg.length > 0,
    )
    if (fieldErrors.length > 0) {
      return fieldErrors.map(([field, msg]) => `${formatFieldName(field)}: ${msg}`)
    }
  }

  if (typeof body.message === 'string' && body.message.length > 0) {
    return body.message
  }

  return fallback
}
