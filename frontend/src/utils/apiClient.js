const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Get token from localStorage
const getToken = () => localStorage.getItem('fedex_token')

// Set token
const setToken = (token) => localStorage.setItem('fedex_token', token)

// Remove token
const removeToken = () => localStorage.removeItem('fedex_token')

// Get auth headers
const getAuthHeaders = () => {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export const apiClient = {
  // ============================================
  // AUTH METHODS
  // ============================================
  
  async login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }
    
    const data = await response.json()
    setToken(data.token)
    return data
  },
  
  async register(userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }
    
    return response.json()
  },
  
  async verifyToken() {
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) {
      removeToken()
      return null
    }
    
    return response.json()
  },
  
  logout() {
    removeToken()
  },
  
  async getAllUsers() {
    const response = await fetch(`${API_URL}/auth/users`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) throw new Error('Failed to fetch users')
    return response.json()
  },
  
  async deleteUser(userId) {
    const response = await fetch(`${API_URL}/auth/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    
    if (!response.ok) throw new Error('Failed to delete user')
    return response.json()
  },
  
  // ============================================
  // DEBT MANAGEMENT METHODS
  // ============================================
  
  async uploadCSV(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const token = getToken()
    const response = await fetch(`${API_URL}/upload-csv`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }
    
    return response.json()
  },
  
  async getAllCases() {
    const response = await fetch(`${API_URL}/cases`, {
      headers: getAuthHeaders()
    })
    
    if (!response.ok) throw new Error('Failed to fetch cases')
    return response.json()
  },
  
  async updateCaseStatus(caseId, newStatus) {
    const response = await fetch(`${API_URL}/cases/${caseId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    })
    
    if (!response.ok) throw new Error('Failed to update status')
    return response.json()
  }
}