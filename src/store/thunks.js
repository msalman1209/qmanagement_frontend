import { createAsyncThunk } from '@reduxjs/toolkit'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong')
  }
  
  return data
}

// Auth Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { role, ...loginData } = credentials
      
      let endpoint = '/auth/login'
      if (role === 'super_admin') {
        endpoint = '/auth/superadmin/login'
      } else if (role === 'admin') {
        endpoint = '/auth/admin/login'
      }
      
      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(loginData),
      })
      
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
      })
      return true
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall('/auth/me')
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Ticket Thunks
export const fetchAllTickets = createAsyncThunk(
  'ticket/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const data = await apiCall(`/tickets${queryParams ? `?${queryParams}` : ''}`)
      return data.tickets || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTicketById = createAsyncThunk(
  'ticket/fetchById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/tickets/${ticketId}`)
      return data.ticket || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createTicket = createAsyncThunk(
  'ticket/create',
  async (ticketData, { rejectWithValue }) => {
    try {
      const data = await apiCall('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      })
      return data.ticket || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateTicketStatus = createAsyncThunk(
  'ticket/updateStatus',
  async ({ ticketId, status }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      return data.ticket || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const transferTicket = createAsyncThunk(
  'ticket/transfer',
  async ({ ticketId, transferData }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/tickets/${ticketId}/transfer`, {
        method: 'POST',
        body: JSON.stringify(transferData),
      })
      return data.ticket || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const callNextTicket = createAsyncThunk(
  'ticket/callNext',
  async (counterId, { rejectWithValue }) => {
    try {
      const data = await apiCall('/tickets/call-next', {
        method: 'POST',
        body: JSON.stringify({ counter_id: counterId }),
      })
      return data.ticket || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const lockTicket = createAsyncThunk(
  'ticket/lock',
  async ({ ticketId, lockData }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/tickets/${ticketId}/lock`, {
        method: 'POST',
        body: JSON.stringify(lockData),
      })
      return data.ticket || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// User Thunks
export const fetchAllUsers = createAsyncThunk(
  'user/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/users')
      return data.users || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createUser = createAsyncThunk(
  'user/create',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      return data.user || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateUserProfile = createAsyncThunk(
  'user/update',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      })
      return data.user || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteUser = createAsyncThunk(
  'user/delete',
  async (userId, { rejectWithValue }) => {
    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'DELETE',
      })
      return userId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Service Thunks
export const fetchAllServices = createAsyncThunk(
  'service/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/services')
      return data.services || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createService = createAsyncThunk(
  'service/create',
  async (serviceData, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      })
      return data.service || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateService = createAsyncThunk(
  'service/update',
  async ({ serviceId, serviceData }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/admin/services/${serviceId}`, {
        method: 'PUT',
        body: JSON.stringify(serviceData),
      })
      return data.service || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteService = createAsyncThunk(
  'service/delete',
  async (serviceId, { rejectWithValue }) => {
    try {
      await apiCall(`/admin/services/${serviceId}`, {
        method: 'DELETE',
      })
      return serviceId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const assignServiceToUser = createAsyncThunk(
  'service/assign',
  async ({ userId, serviceId }, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/services/assign', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, service_id: serviceId }),
      })
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Admin Thunks
export const fetchAllAdmins = createAsyncThunk(
  'admin/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/admins')
      return data.admins || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createAdmin = createAsyncThunk(
  'admin/create',
  async (adminData, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/admins', {
        method: 'POST',
        body: JSON.stringify(adminData),
      })
      return data.admin || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateAdminData = createAsyncThunk(
  'admin/update',
  async ({ adminId, adminData }, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/admin/admins/${adminId}`, {
        method: 'PUT',
        body: JSON.stringify(adminData),
      })
      return data.admin || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteAdmin = createAsyncThunk(
  'admin/delete',
  async (adminId, { rejectWithValue }) => {
    try {
      await apiCall(`/admin/admins/${adminId}`, {
        method: 'DELETE',
      })
      return adminId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateOwnProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })
      return data.user || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Configuration Thunks
export const fetchConfiguration = createAsyncThunk(
  'config/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/configuration')
      return data.configuration || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateConfigurationData = createAsyncThunk(
  'config/update',
  async (configData, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/configuration', {
        method: 'PUT',
        body: JSON.stringify(configData),
      })
      return data.configuration || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Dashboard Thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const data = await apiCall(`/users/dashboard${queryParams ? `?${queryParams}` : ''}`)
      return data.statistics || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchUserSessions = createAsyncThunk(
  'dashboard/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall('/admin/display-screens')
      return data.sessions || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchReports = createAsyncThunk(
  'dashboard/fetchReports',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const data = await apiCall(`/admin/reports${queryParams ? `?${queryParams}` : ''}`)
      return data.reports || data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export default {
  // Auth
  loginUser,
  logoutUser,
  getCurrentUser,
  updateOwnProfile,
  
  // Tickets
  fetchAllTickets,
  fetchTicketById,
  createTicket,
  updateTicketStatus,
  transferTicket,
  callNextTicket,
  lockTicket,
  
  // Users
  fetchAllUsers,
  createUser,
  updateUserProfile,
  deleteUser,
  
  // Services
  fetchAllServices,
  createService,
  updateService,
  deleteService,
  assignServiceToUser,
  
  // Admins
  fetchAllAdmins,
  createAdmin,
  updateAdminData,
  deleteAdmin,
  
  // Configuration
  fetchConfiguration,
  updateConfigurationData,
  
  // Dashboard
  fetchDashboardStats,
  fetchUserSessions,
  fetchReports,
}
