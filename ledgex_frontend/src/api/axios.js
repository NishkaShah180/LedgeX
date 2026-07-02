import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
})

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const isPublicAuthRoute = url.startsWith('/auth/login') || url.startsWith('/auth/register')
  if (isPublicAuthRoute) {
    return config
  }

  const token = localStorage.getItem('token')
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
