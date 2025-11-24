import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import ticketReducer from './slices/ticketSlice'
import userReducer from './slices/userSlice'
import serviceReducer from './slices/serviceSlice'
import adminReducer from './slices/adminSlice'
import configReducer from './slices/configSlice'
import dashboardReducer from './slices/dashboardSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ticket: ticketReducer,
    user: userReducer,
    service: serviceReducer,
    admin: adminReducer,
    config: configReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['auth/setCredentials', 'auth/restoreAuth'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export default store
