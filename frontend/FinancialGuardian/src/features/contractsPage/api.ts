import type { Contract, TimelineEvent } from './types'
const API_URL = import.meta.env.VITE_BACKEND_URL

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

export const contractsApi = {
  // POST /api/documents with type='contract'
  upload: async (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<{ contract: Contract }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'contract')

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

  // GET /api/contracts
  getAll: (): Promise<{ contracts: Contract[] }> =>
    request('/contracts'),

  // GET /api/timeline?kind=contracts
  getTimeline: (): Promise<{ events: TimelineEvent[] }> =>
    request('/timeline?kind=contracts'),
}
