import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Email API
export const emailsApi = {
  list: (params?: any) => api.get('/emails', { params }),
  get: (id: string) => api.get(`/emails/${id}`),
  update: (id: string, data: any) => api.patch(`/emails/${id}`, data),
  getStats: (accountId?: string) => api.get('/emails/stats', { params: { accountId } }),
  getReplySuggestions: (id: string) => api.get(`/emails/${id}/reply-suggestions`),
  generateReplySuggestion: (id: string) => api.post(`/emails/${id}/reply-suggestions`),
  recategorize: (id: string) => api.post(`/emails/${id}/recategorize`),
}

// Accounts API
export const accountsApi = {
  list: () => api.get('/accounts'),
  get: (id: string) => api.get(`/accounts/${id}`),
  getFolders: (id: string) => api.get(`/accounts/${id}/folders`),
}

// Search API
export const searchApi = {
  search: (params: any) => api.get('/search', { params }),
  getStats: (accountId?: string) => api.get('/search/stats', { params: { accountId } }),
}
