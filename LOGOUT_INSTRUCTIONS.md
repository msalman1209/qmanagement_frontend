# 🔐 Logout & Fresh Login Instructions

## Current Issue
User is logged in as **`role: user`** (regular counter user), which is why dashboard is loading and showing 403 errors.

## Solution Steps

### Step 1: Complete Logout
1. Open browser DevTools (F12)
2. Go to **Application** tab
3. **Clear Storage**:
   - sessionStorage → Clear all
   - Cookies → Delete all for localhost:3000
4. Or just open **Incognito/Private** window

### Step 2: Login as Ticket Info User
1. Navigate to: `http://localhost:3000/ticket-info-login`
2. Enter credentials:
   - Username: `ssssss`
   - Password: `ssssss`
3. Should redirect to `/ticket_info` page

### Step 3: Verify
After login, check browser console logs:
```
✅ User role: ticket_info  (NOT 'user')
✅ admin_id: 8
```

## Different Login Pages

| Role | Login URL | Redirect To |
|------|-----------|-------------|
| Regular User (counter) | `/login` | `/user/dashboard` |
| Ticket Info Display | `/ticket-info-login` | `/ticket_info` |
| Receptionist | `/receptionist-login` | `/receptionist` |
| Admin | `/login` | `/admin/dashboard` |
| Super Admin | `/super-admin-secure-login` | `/super_admin/dashboard` |

## Quick Test Commands

### Backend Status
```powershell
# Check if backend is running
curl http://localhost:5000/api/health
```

### Database Check
```powershell
cd backend
node check-user-sessions.js
```

## Troubleshooting

### Still seeing 403 errors?
- Make sure you cleared **all** browser storage
- Check console: `getUser()` should show `role: 'ticket_info'`
- If still `role: 'user'`, you're on wrong login page

### Can't access /ticket_info page?
- Check backend logs for authentication errors
- Verify JWT token has `admin_id: 8` in payload
- Backend should log: `✅ Using ticket_info admin_id: 8`
