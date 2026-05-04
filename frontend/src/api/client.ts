import axios from 'axios'
import { settingsStore } from '@/store/settingsStore'

export const createApiClient = () => {
  const { apiUrl } = settingsStore.getState()

  return axios.create({
    baseURL: apiUrl,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  })
}

let client = createApiClient()

settingsStore.subscribe((state) => {
  client = axios.create({
    baseURL: state.apiUrl,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  })
})

export const apiClient = {
  get: <T,>(url: string) => client.get<T>(url).then((r) => r.data),
  post: <T,>(url: string, data?: unknown) => client.post<T>(url, data).then((r) => r.data),
}
