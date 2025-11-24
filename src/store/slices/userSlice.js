import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload
      state.loading = false
      state.error = null
    },
    
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload
    },
    
    addUser: (state, action) => {
      state.users.push(action.payload)
    },
    
    updateUser: (state, action) => {
      const index = state.users.findIndex(u => u.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload }
      }
      
      if (state.currentUser?.id === action.payload.id) {
        state.currentUser = { ...state.currentUser, ...action.payload }
      }
    },
    
    removeUser: (state, action) => {
      state.users = state.users.filter(u => u.id !== action.payload)
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    clearUsers: (state) => {
      state.users = []
      state.currentUser = null
    },
  },
})

export const {
  setUsers,
  setCurrentUser,
  addUser,
  updateUser,
  removeUser,
  setLoading,
  setError,
  clearError,
  clearUsers,
} = userSlice.actions

export default userSlice.reducer

// Selectors
export const selectAllUsers = (state) => state.user.users
export const selectCurrentUser = (state) => state.user.currentUser
export const selectUserLoading = (state) => state.user.loading
export const selectUserError = (state) => state.user.error
