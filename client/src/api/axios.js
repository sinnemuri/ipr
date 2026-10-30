import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('memehub.accessToken')
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

export default api
