const API_URL = import.meta.env.VITE_BACKEND_URL

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

/* ───────────────────────── AUTH ───────────────────────── */

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

/* ───────────────────── TRANSACTIONS ───────────────────── */

export const transactionApi = {
  getAll: () => request('/transactions'),
}