const API_URL = 'http://localhost:3000/api'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // 🔥 REQUIRED for cookies
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export const authApi = {
  signup: (data: any) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: any) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  me: () =>
    request('/auth/me'),
}