/**
 * Extracts token and user from a successful auth API response.
 * Backend wraps payloads in ApiResponse: { success, message, data: AuthResponse }.
 */
export function parseAuthResponse(response) {
  const authData = response.data?.data ?? response.data

  if (!authData?.token) {
    throw new Error('Invalid auth response: missing token')
  }

  const { token, email, firstName, lastName, userId } = authData

  const user = {
    userId,
    email,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(' ') || email,
  }

  return { token, user }
}
