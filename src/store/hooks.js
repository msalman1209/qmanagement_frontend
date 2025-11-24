'use client'

import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'

// Re-export hooks from react-redux with proper typing
export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector

// Custom hooks for common operations

// Auth hooks
export const useAuth = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)
  
  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
  }
}

// Ticket hooks
export const useTickets = () => {
  const dispatch = useAppDispatch()
  const ticket = useAppSelector((state) => state.ticket)
  
  return {
    tickets: ticket.tickets,
    currentTicket: ticket.currentTicket,
    pendingTickets: ticket.pendingTickets,
    loading: ticket.loading,
    error: ticket.error,
    filters: ticket.filters,
    pagination: ticket.pagination,
  }
}

// User hooks
export const useUsers = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.user)
  
  return {
    users: user.users,
    currentUser: user.currentUser,
    loading: user.loading,
    error: user.error,
  }
}

// Service hooks
export const useServices = () => {
  const dispatch = useAppDispatch()
  const service = useAppSelector((state) => state.service)
  
  return {
    services: service.services,
    currentService: service.currentService,
    assignedServices: service.assignedServices,
    loading: service.loading,
    error: service.error,
  }
}

// Admin hooks
export const useAdmins = () => {
  const dispatch = useAppDispatch()
  const admin = useAppSelector((state) => state.admin)
  
  return {
    admins: admin.admins,
    currentAdmin: admin.currentAdmin,
    loading: admin.loading,
    error: admin.error,
  }
}

// Configuration hooks
export const useConfig = () => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => state.config)
  
  return {
    configuration: config.configuration,
    counterDisplay: config.counterDisplay,
    loading: config.loading,
    error: config.error,
  }
}

// Dashboard hooks
export const useDashboard = () => {
  const dispatch = useAppDispatch()
  const dashboard = useAppSelector((state) => state.dashboard)
  
  return {
    statistics: dashboard.statistics,
    sessions: dashboard.sessions,
    reports: dashboard.reports,
    loading: dashboard.loading,
    error: dashboard.error,
  }
}

// Role-based authorization hook
export const useRole = () => {
  const { user } = useAuth()
  
  return {
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    role: user?.role || null,
  }
}

// Check if user has specific permission
export const useHasPermission = (requiredRole) => {
  const { role } = useRole()
  
  const roleHierarchy = {
    super_admin: 3,
    admin: 2,
    user: 1,
  }
  
  return roleHierarchy[role] >= roleHierarchy[requiredRole]
}

export default {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useTickets,
  useUsers,
  useServices,
  useAdmins,
  useConfig,
  useDashboard,
  useRole,
  useHasPermission,
}
