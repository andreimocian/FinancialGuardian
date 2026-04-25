import type { ExtractedContract } from '@/features/contracts/types'

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
  // POST /api/contracts/upload — multipart, returns { fileId }
  upload: async (file: File, onProgress?: (pct: number) => void): Promise<{ fileId: string }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_URL}/contracts/upload`)
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

  // Returns an EventSource that streams AgentEvents for this file
  // Backend starts the AI agent and streams SSE events back
  getExtractionStream: (fileId: string): EventSource => {
    return new EventSource(
      `${API_URL}/contracts/extract-stream/${fileId}`,
      { withCredentials: true },
    )
  },

  // POST /api/contracts/save — persists confirmed contract
  save: (contract: ExtractedContract) =>
    request('/contracts/save', {
      method: 'POST',
      body: JSON.stringify(contract),
    }),

  // GET /api/contracts — returns { contracts: ExtractedContract[] }
  getAll: (): Promise<{ contracts: ExtractedContract[] }> =>
    request('/contracts'),

  // DELETE /api/contracts/:id
  remove: (id: string) =>
    request(`/contracts/${id}`, { method: 'DELETE' }),
}
