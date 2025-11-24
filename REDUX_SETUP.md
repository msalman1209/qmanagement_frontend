# Redux Toolkit Setup - Queue Management System

## 📁 Store Structure

```
src/store/
├── slices/
│   ├── authSlice.js         # Authentication state (login, logout, user)
│   ├── ticketSlice.js       # Ticket management state
│   ├── userSlice.js         # User management state
│   ├── serviceSlice.js      # Service management state
│   ├── adminSlice.js        # Admin management state
│   ├── configSlice.js       # Configuration state
│   └── dashboardSlice.js    # Dashboard statistics state
├── store.js                 # Redux store configuration
├── ReduxProvider.js         # Redux Provider for Next.js App Router
├── thunks.js               # All async API calls (createAsyncThunk)
├── hooks.js                # Custom Redux hooks
└── index.js                # Export all slices and store
```

## 🚀 Features

### 1. **Auth Slice** (`authSlice.js`)
Manages authentication state across the application.

**State:**
- `user`: Current logged-in user object
- `token`: JWT authentication token
- `isAuthenticated`: Boolean for auth status
- `loading`: Loading state
- `error`: Error messages

**Actions:**
- `setCredentials(user, token)` - Set user and token after login
- `logout()` - Clear auth state and localStorage
- `updateUser(userData)` - Update user profile
- `restoreAuth(user, token)` - Restore from localStorage on mount
- `setLoading(boolean)` - Set loading state
- `setError(message)` - Set error message
- `clearError()` - Clear error

**Selectors:**
```javascript
selectCurrentUser, selectToken, selectIsAuthenticated, 
selectAuthLoading, selectAuthError
```

---

### 2. **Ticket Slice** (`ticketSlice.js`)
Handles all ticket-related state management.

**State:**
- `tickets`: Array of all tickets
- `currentTicket`: Selected ticket
- `pendingTickets`: Pending tickets only
- `filters`: Search and filter criteria
- `pagination`: Page, limit, total

**Actions:**
- `setTickets(tickets)` - Set all tickets
- `addTicket(ticket)` - Add new ticket
- `updateTicket(ticket)` - Update existing ticket
- `removeTicket(ticketId)` - Delete ticket
- `setFilters(filters)` - Apply filters
- `setPagination(pagination)` - Set pagination

**Selectors:**
```javascript
selectAllTickets, selectCurrentTicket, selectPendingTickets,
selectTicketLoading, selectTicketError, selectTicketFilters
```

---

### 3. **User Slice** (`userSlice.js`)
Manages user data for admin operations.

**State:**
- `users`: Array of all users
- `currentUser`: Selected user for editing
- `loading`, `error`

**Actions:**
- `setUsers(users)` - Set all users
- `addUser(user)` - Add new user
- `updateUser(user)` - Update user
- `removeUser(userId)` - Delete user

---

### 4. **Service Slice** (`serviceSlice.js`)
Manages services and service assignments.

**State:**
- `services`: All available services
- `currentService`: Selected service
- `assignedServices`: Services assigned to users

**Actions:**
- `setServices(services)` - Set all services
- `addService(service)` - Create service
- `updateService(service)` - Update service
- `assignService(service)` - Assign to user
- `unassignService(serviceId)` - Unassign from user

---

### 5. **Admin Slice** (`adminSlice.js`)
Manages admin users separately from regular users.

**State:**
- `admins`: Array of admin users
- `currentAdmin`: Selected admin

**Actions:**
- `setAdmins(admins)` - Set all admins
- `addAdmin(admin)` - Create admin
- `updateAdmin(admin)` - Update admin
- `removeAdmin(adminId)` - Delete admin

---

### 6. **Config Slice** (`configSlice.js`)
System configuration and counter display settings.

**State:**
- `configuration`: System config object
- `counterDisplay`: Display screen settings

**Actions:**
- `setConfiguration(config)` - Set config
- `updateConfiguration(config)` - Update config
- `setCounterDisplay(display)` - Set display settings

---

### 7. **Dashboard Slice** (`dashboardSlice.js`)
Dashboard statistics and reports.

**State:**
- `statistics`: { total_tickets, solved, pending, transferred, etc. }
- `sessions`: Active user sessions
- `reports`: Generated reports

**Actions:**
- `setStatistics(stats)` - Set stats
- `incrementStat(key)` - Increment counter
- `decrementStat(key)` - Decrement counter
- `setSessions(sessions)` - Set sessions
- `setReports(reports)` - Set reports

---

## 🔧 Async Thunks (API Calls)

All API calls are defined in `thunks.js`:

### Auth Thunks:
```javascript
loginUser(credentials)
logoutUser()
getCurrentUser()
```

### Ticket Thunks:
```javascript
fetchAllTickets(filters)
fetchTicketById(ticketId)
createTicket(ticketData)
updateTicketStatus(ticketId, status)
transferTicket(ticketId, transferData)
callNextTicket(counterId)
lockTicket(ticketId, lockData)
```

### User Thunks:
```javascript
fetchAllUsers()
createUser(userData)
updateUserProfile(userId, userData)
deleteUser(userId)
```

### Service Thunks:
```javascript
fetchAllServices()
createService(serviceData)
updateService(serviceId, serviceData)
deleteService(serviceId)
assignServiceToUser(userId, serviceId)
```

### Admin Thunks:
```javascript
fetchAllAdmins()
createAdmin(adminData)
updateAdminData(adminId, adminData)
deleteAdmin(adminId)
```

### Configuration Thunks:
```javascript
fetchConfiguration()
updateConfigurationData(configData)
```

### Dashboard Thunks:
```javascript
fetchDashboardStats(filters)
fetchUserSessions()
fetchReports(filters)
```

---

## 📖 Usage Examples

### 1. Using in Components

```javascript
'use client'

import { useAuth, useTickets, useAppDispatch } from '@/store/hooks'
import { loginUser, fetchAllTickets } from '@/store/thunks'
import { setCredentials, logout } from '@/store'

export default function MyComponent() {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, loading } = useAuth()
  const { tickets, pendingTickets } = useTickets()

  // Login
  const handleLogin = async (credentials) => {
    const result = await dispatch(loginUser(credentials))
    if (result.type === 'auth/login/fulfilled') {
      dispatch(setCredentials(result.payload))
    }
  }

  // Fetch tickets
  const loadTickets = async () => {
    await dispatch(fetchAllTickets({ status: 'Pending' }))
  }

  // Logout
  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div>
      {isAuthenticated ? (
        <>
          <h1>Welcome {user?.name}</h1>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={() => handleLogin({ email, password })}>
          Login
        </button>
      )}
    </div>
  )
}
```

### 2. Role-Based Access

```javascript
'use client'

import { useRole, useHasPermission } from '@/store/hooks'

export default function AdminPanel() {
  const { isSuperAdmin, isAdmin, role } = useRole()
  const canManageUsers = useHasPermission('admin')

  if (!canManageUsers) {
    return <div>Access Denied</div>
  }

  return (
    <div>
      {isSuperAdmin && <SuperAdminFeatures />}
      {isAdmin && <AdminFeatures />}
    </div>
  )
}
```

### 3. Managing Tickets

```javascript
'use client'

import { useTickets, useAppDispatch } from '@/store/hooks'
import { createTicket, updateTicketStatus } from '@/store/thunks'
import { addTicket, updateTicket } from '@/store'

export default function TicketManager() {
  const dispatch = useAppDispatch()
  const { tickets, pendingTickets, loading } = useTickets()

  const handleCreateTicket = async (ticketData) => {
    const result = await dispatch(createTicket(ticketData))
    if (result.type === 'ticket/create/fulfilled') {
      dispatch(addTicket(result.payload))
    }
  }

  const handleUpdateStatus = async (ticketId, status) => {
    const result = await dispatch(updateTicketStatus({ ticketId, status }))
    if (result.type === 'ticket/updateStatus/fulfilled') {
      dispatch(updateTicket(result.payload))
    }
  }

  return (
    <div>
      <h2>Pending: {pendingTickets.length}</h2>
      <h2>Total: {tickets.length}</h2>
      {loading && <p>Loading...</p>}
    </div>
  )
}
```

### 4. Dashboard Statistics

```javascript
'use client'

import { useDashboard, useAppDispatch } from '@/store/hooks'
import { fetchDashboardStats } from '@/store/thunks'
import { useEffect } from 'react'

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const { statistics, loading } = useDashboard()

  useEffect(() => {
    dispatch(fetchDashboardStats())
  }, [dispatch])

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Total Tickets: {statistics.total_tickets}</div>
      <div>Solved: {statistics.solved}</div>
      <div>Pending: {statistics.pending}</div>
      <div>Transferred: {statistics.transferred}</div>
    </div>
  )
}
```

---

## 🔐 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🎯 Custom Hooks

The `hooks.js` file provides convenient hooks:

```javascript
import { 
  useAuth,           // Auth state and operations
  useTickets,        // Ticket state
  useUsers,          // User management
  useServices,       // Service management
  useAdmins,         // Admin management
  useConfig,         // Configuration
  useDashboard,      // Dashboard stats
  useRole,           // Role-based access
  useHasPermission   // Permission check
} from '@/store/hooks'
```

---

## 📝 Best Practices

1. **Always use hooks** instead of direct `useSelector`:
   ```javascript
   // ✅ Good
   const { user, isAuthenticated } = useAuth()
   
   // ❌ Avoid
   const user = useSelector(state => state.auth.user)
   ```

2. **Handle async thunks properly**:
   ```javascript
   const result = await dispatch(loginUser(credentials))
   if (result.type === 'auth/login/fulfilled') {
     // Success
   } else if (result.type === 'auth/login/rejected') {
     // Error: result.error.message
   }
   ```

3. **Clear errors after displaying**:
   ```javascript
   useEffect(() => {
     if (error) {
       showToast(error)
       dispatch(clearError())
     }
   }, [error])
   ```

4. **Use loading states**:
   ```javascript
   {loading ? <Spinner /> : <Content />}
   ```

5. **Persist important data**:
   - Auth token and user are auto-saved to localStorage
   - Restored on app mount via `ReduxProvider`

---

## 🔄 State Flow

```
Component → Dispatch Action → Reducer → Update State → Re-render Component
                ↓
          Async Thunk → API Call → Fulfill/Reject → Update State
```

---

## 🛠️ Debugging

Redux DevTools is enabled in development mode. Open browser DevTools and look for the Redux tab.

---

## 📦 Installation

Already installed:
```bash
npm install @reduxjs/toolkit react-redux
```

---

## ✅ Integration Checklist

- [x] Install packages
- [x] Create store and slices
- [x] Create async thunks
- [x] Create custom hooks
- [x] Wrap app with ReduxProvider
- [x] Add localStorage persistence
- [ ] Update components to use Redux
- [ ] Add error handling UI
- [ ] Add loading states UI

---

## 🎨 Next Steps

1. Update existing components to use Redux hooks
2. Replace local state with Redux state
3. Implement error toasts/notifications
4. Add loading spinners
5. Create protected routes based on role
6. Add real-time updates with WebSocket (optional)

---

**Redux Toolkit Setup Complete! 🎉**
