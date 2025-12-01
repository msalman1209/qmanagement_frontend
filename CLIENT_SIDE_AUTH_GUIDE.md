# 🔐 Client-Side Authentication & Validation System

## Overview

Complete client-side authentication and validation system implemented for the Queue Management System with proper security measures, license validation, and role-based access control.

---

## ✨ Features Implemented

### 1. **Multi-Layer Authentication** ✅
- ✓ Login validation on client-side
- ✓ Token verification with backend
- ✓ Session validation on every page load
- ✓ Automatic license checking for admins
- ✓ Role-based route protection

### 2. **Middleware Protection** ✅
- ✓ Blocks unauthenticated users
- ✓ Redirects to login if not authenticated
- ✓ Prevents access to other role routes
- ✓ Security headers added
- ✓ Works on every route automatically

### 3. **Protected Route Component** ✅
- ✓ Validates authentication on mount
- ✓ Verifies token with backend
- ✓ Checks license expiry (for admins)
- ✓ Enforces role-based access
- ✓ Shows appropriate error messages

### 4. **Auth Context & Hooks** ✅
- ✓ Global authentication state
- ✓ Periodic session validation (every 5 minutes)
- ✓ Validates on window focus
- ✓ Authenticated API call wrapper
- ✓ Automatic logout on expiry

### 5. **Login Page Enhancements** ✅
- ✓ Form validation before submit
- ✓ Better error messages
- ✓ Loading states
- ✓ Toast notifications
- ✓ Prevents duplicate submissions

---

## 🛡️ Security Layers

```
┌─────────────────────────────────────┐
│     Layer 1: Middleware             │
│  - Checks cookies on every request  │
│  - Redirects unauthenticated users  │
│  - Blocks wrong role access         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Layer 2: ProtectedRoute Component  │
│  - Validates token with backend     │
│  - Checks license expiry            │
│  - Verifies role permissions        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Layer 3: Auth Context             │
│  - Periodic validation (5 min)      │
│  - Validates on window focus        │
│  - Auto API authentication          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Layer 4: Backend Verification     │
│  - JWT token validation             │
│  - Session checking in database     │
│  - License expiry validation        │
└─────────────────────────────────────┘
```

---

## 📋 How It Works

### 1. Login Process

```javascript
User enters credentials
    │
    ▼
Client-side validation
    │
    ▼
API call to backend
    │
    ▼
Backend validates & returns token
    │
    ▼
Store in Redux + Cookies
    │
    ▼
Redirect to dashboard
```

### 2. Page Load Protection

```javascript
User navigates to page
    │
    ▼
Middleware checks cookies
    ├─ Not authenticated? → Redirect to login
    ├─ Wrong role? → Redirect to correct dashboard
    └─ Valid? → Allow access
    │
    ▼
ProtectedRoute validates with backend
    ├─ Token invalid? → Logout & redirect to login
    ├─ License expired? → Show error & logout
    ├─ Wrong role? → Show access denied
    └─ Valid? → Show page content
```

### 3. Periodic Validation

```javascript
Every 5 minutes OR on window focus
    │
    ▼
Call /api/auth/verify endpoint
    │
    ├─ Session valid? → Continue
    ├─ Session expired? → Logout & redirect
    └─ License expired? → Logout & redirect
```

---

## 🔧 Usage Examples

### Example 1: Protect a Page

```javascript
// src/app/admin/dashboard/page.js
import ProtectedRoute from '@/Components/ProtectedRoute';

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      <div>
        {/* Your dashboard content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Example 2: Make Authenticated API Call

```javascript
'use client';

import { useAuthContext } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { callAPI } = useAuthContext();

  const fetchData = async () => {
    try {
      const data = await callAPI('/api/users/all');
      console.log(data);
    } catch (error) {
      // Automatically handles auth errors, license expiry, etc.
      console.error(error);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### Example 3: Use Auth Validation Hooks

```javascript
'use client';

import { useAuthValidator } from '@/utils/authValidation';

export default function MyPage() {
  // Automatically validates auth on mount
  const { isAuthenticated, user } = useAuthValidator('admin');

  return (
    <div>
      <h1>Welcome {user?.username}</h1>
    </div>
  );
}
```

### Example 4: Manual License Check

```javascript
'use client';

import { useLicenseValidator } from '@/utils/authValidation';

export default function CreateUser() {
  const { validateLicense } = useLicenseValidator();

  const handleCreate = async () => {
    // Check license before creating user
    const licenseCheck = await validateLicense();
    
    if (!licenseCheck.valid) {
      alert('License validation failed');
      return;
    }

    // Proceed with user creation
    // ...
  };

  return <button onClick={handleCreate}>Create User</button>;
}
```

---

## 🚦 What Happens When...

### User is Not Logged In
```
1. Middleware blocks access
2. Redirects to /login
3. Shows "Please login to continue"
```

### Token is Invalid/Expired
```
1. ProtectedRoute validates with backend
2. Backend returns 401/403
3. Frontend shows "Session expired"
4. Logs out user
5. Redirects to login
```

### License is Expired (Admin only)
```
1. Backend checks license on /auth/verify
2. Returns license_expired: true
3. Frontend shows "License expired" message
4. Waits 3 seconds
5. Logs out and redirects to login
```

### User Tries to Access Wrong Role Route
```
1. Middleware checks role from cookie
2. Detects role mismatch
3. Redirects to correct dashboard
Example: User with role='admin' tries to access /user → Redirected to /admin
```

### Session is Valid but User Switches Tab
```
1. Window focus event fires
2. Auth context validates session
3. If valid, continues
4. If invalid, logs out
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── layout.js                    # Includes AuthProvider
│   ├── login/
│   │   └── page.js                  # Enhanced with validation
│   └── [role]/
│       └── */page.js                # Protected with ProtectedRoute
│
├── Components/
│   └── ProtectedRoute.js            # Main protection component
│
├── contexts/
│   └── AuthContext.js               # Global auth context & periodic validation
│
├── utils/
│   └── authValidation.js            # Auth validation hooks & helpers
│
├── store/
│   └── slices/
│       └── authSlice.js             # Redux auth state
│
└── middleware.js                    # Route protection middleware
```

---

## 🎯 Validation Points

### On Login
- ✅ Form validation (required fields, password length)
- ✅ Backend authentication
- ✅ Token storage in Redux & cookies
- ✅ Redirect based on role

### On Page Load
- ✅ Middleware checks cookies
- ✅ ProtectedRoute validates token
- ✅ Role-based access control
- ✅ License expiry check (admins)

### Periodic Checks
- ✅ Every 5 minutes
- ✅ On window/tab focus
- ✅ Before critical operations

### On API Calls
- ✅ Token attached to header
- ✅ Session validation (optional)
- ✅ Automatic error handling
- ✅ License expiry detection

---

## 🔍 Debugging

### Check if User is Authenticated
```javascript
// In browser console
const state = JSON.parse(localStorage.getItem('persist:root'));
const auth = JSON.parse(state.auth);
console.log('Authenticated:', auth.isAuthenticated);
console.log('User:', auth.user);
```

### Check Cookies
```javascript
// In browser console
document.cookie
```

### Check Session Validation
```javascript
// In browser console
const token = JSON.parse(localStorage.getItem('persist:root')).auth.token;
fetch('http://localhost:5000/api/auth/verify', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(console.log);
```

---

## ⚙️ Configuration

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Validation Intervals

```javascript
// src/contexts/AuthContext.js

// Change validation interval (default: 5 minutes)
const interval = setInterval(() => {
  validateSession();
}, 5 * 60 * 1000); // Change this value
```

### Session Validation Cache

```javascript
// src/contexts/AuthContext.js

// Change minimum time between validations (default: 1 minute)
if (lastValidation && (now - lastValidation) < 60000) {
  return { valid: true };
}
```

---

## 🎨 Error Messages

### Authentication Required
```
"Please login to continue"
Redirects to: /login?redirect=/previous-page&reason=authentication_required
```

### Session Expired
```
"Your session has expired. Please login again."
Logs out and redirects to: /login
```

### License Expired
```
"Your license has expired. Please contact support."
Shows for 3 seconds, then logs out and redirects to: /login
```

### Access Denied
```
"You don't have permission to access this page."
Shows "Go to Your Dashboard" button
```

### Limit Reached
```
"Maximum user limit (10) reached for your license"
Shows in alert dialog
```

---

## ✅ Testing Checklist

### Basic Authentication
- [ ] Can login as user
- [ ] Can login as admin
- [ ] Can login as super admin
- [ ] Cannot access pages without login
- [ ] Redirected to login when not authenticated

### Token Validation
- [ ] Token validated on page load
- [ ] Invalid token logs out user
- [ ] Expired token logs out user
- [ ] Token sent with every API call

### Role-Based Access
- [ ] User can only access /user routes
- [ ] Admin can only access /admin routes
- [ ] Super admin can access /superadmin routes
- [ ] Wrong role redirected to correct dashboard

### License Validation
- [ ] Admin with expired license cannot access
- [ ] License checked on page load
- [ ] License checked periodically
- [ ] Expired license shows proper message

### Session Management
- [ ] Session validated every 5 minutes
- [ ] Session validated on window focus
- [ ] Logout clears all data
- [ ] Logout calls backend API

---

## 🎉 Benefits

### Security
✅ Multiple layers of protection
✅ Token validated on every critical operation
✅ License expiry enforced
✅ Role-based access strictly controlled

### User Experience
✅ Smooth redirects
✅ Clear error messages
✅ Loading states
✅ Toast notifications

### Developer Experience
✅ Easy to use hooks
✅ Automatic API authentication
✅ Clear documentation
✅ Reusable components

### Performance
✅ Validation cached (1 minute)
✅ Minimal API calls
✅ Efficient cookie checking
✅ No unnecessary re-renders

---

## 🚀 Result

**Ab koi bhi user bina login ke kuch nahi kar sakta!**

✅ Har page protected hai
✅ Har API call authenticated hai
✅ License automatically check hota hai
✅ Wrong role access blocked hai
✅ Session expire hone par logout ho jata hai

**Complete security hai!** 🔒
