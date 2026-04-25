import type { Obligation } from './types'

const API_URL = 'http://localhost:3000/api'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const contractApi = {
  upload: async (
    file: File,
    type: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ obligation: Obligation }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_URL}/documents`)
      xhr.withCredentials = true

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) resolve(data)
          else reject(new Error(data.message || 'Upload failed'))
        } catch {
          reject(new Error('Invalid server response'))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(formData)
    })
  },

  getAll: (): Promise<{ obligations: Obligation[] }> =>
    request('/obligations'),

  remove: (id: string) =>
    request(`/obligations/${id}`, { method: 'DELETE' }),

  markPaid: (id: string) =>
    request(`/obligations/${id}/pay`, { method: 'POST' }),

  markUnpaid: (id: string) =>
    request(`/obligations/${id}/unpay`, { method: 'POST' }),

  getTimeline: (): Promise<{ events: unknown[] }> =>
    request('/timeline'),
}
