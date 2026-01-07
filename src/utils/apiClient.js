const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Get token from localStorage
const getToken = () => localStorage.getItem('fedex_token')

// Set token
const setToken = (token) => localStorage.setItem('fedex_token', token)

// Remove token
const removeToken = () => localStorage.removeItem('fedex_token')

// Get auth headers
const getAuthHeaders = (isJson = true) => {
  const token = getToken()
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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
      throw new Error(error.detail || 'Login failed')
    }
    
    const data = await response.json()
    setToken(data.access_token)
    return data
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
  
  // ============================================
  // "MASTER PLAN" WORKFLOW METHODS
  // ============================================
  
  async generateSchema(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_URL}/generate-schema`, {
      method: 'POST',
      headers: getAuthHeaders(false), // Not JSON
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Schema generation failed')
    }
    
    return response.json()
  },
  
  async executeSql(query) {
    const response = await fetch(`${API_URL}/execute-sql`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'SQL execution failed')
    }
    
    return response.json()
  },

  async embedData(file, tableName) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/embed-data?table_name=${tableName}`, {
        method: 'POST',
        headers: getAuthHeaders(false), // Not JSON
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Data embedding failed');
    }

    return response.json();
  },

  async runAllocationLogic(tableName) {
    const response = await fetch(`${API_URL}/run-allocation-logic`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ table_name: tableName })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Allocation logic failed');
    }

    return response.json();
  }
}