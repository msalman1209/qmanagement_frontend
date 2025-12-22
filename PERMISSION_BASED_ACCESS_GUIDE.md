# Permission-Based Page Access Guide

## 📋 Overview

Is implementation me user ki permissions ke base pe pages automatically load hote hain:

### ✅ Permission Types

1. **canCallTickets** → Dashboard Page Access
   - Users jo tickets call kar sakte hain
   - Dashboard pe unassigned tickets dikhai deti hain
   - "Call Ticket" button available hai

2. **canCreateTickets** → Completed Tasks Page Access
   - Users jo tickets complete kar sakte hain
   - Completed tasks page pe unki processed tickets dikhai deti hain
   - Date filtering available hai

---

## 🔐 Backend Implementation

### 1. Permission Middleware (`backend/middlewares/auth.js`)

```javascript
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    // Admin/super_admin ko sab permissions automatically hain
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next()
    }

    // Database se user ki permissions fetch karo
    const [users] = await pool.query(
      'SELECT permissions FROM users WHERE id = ?',
      [req.user.id]
    )

    // Permission check karo
    if (!permissions || !permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${permission}`,
        missing_permission: permission
      })
    }

    next()
  }
}
```

### 2. Protected Routes (`backend/routes/user.js`)

```javascript
// Dashboard - canCallTickets required
router.get("/dashboard", authenticateToken, checkPermission('canCallTickets'), getUserDashboard)

// Completed Tasks - canCreateTickets required  
router.get("/tickets/completed", authenticateToken, checkPermission('canCreateTickets'), getCompletedTickets)

// Call Ticket - canCallTickets required
router.post("/call-ticket", authenticateToken, checkPermission('canCallTickets'), callTicket)
```

---

## 💻 Frontend Implementation

### 1. Dashboard Page (`src/app/[role]/dashboard/page.js`)

**Permission Check:**
```javascript
useEffect(() => {
  const checkPermissions = async () => {
    const user = getUser();
    let permissions = JSON.parse(user.permissions);

    // Check canCallTickets permission
    if (!permissions?.canCallTickets) {
      alert('You need "Call Tickets" permission');
      
      // Redirect based on other permissions
      if (permissions?.canCreateTickets) {
        router.push('/user/completed-tasks');
      } else {
        router.push('/login');
      }
      return;
    }
  };
  checkPermissions();
}, []);
```

**API Error Handling:**
```javascript
catch (error) {
  if (error.response?.status === 403 && error.response?.data?.missing_permission) {
    alert(error.response.data.message);
    // Auto-redirect to appropriate page
    if (permissions?.canCreateTickets) {
      router.push('/user/completed-tasks');
    }
  }
}
```

### 2. Completed Tasks Page (`src/app/[role]/completed-tasks/page.js`)

**Permission Check:**
```javascript
useEffect(() => {
  const checkPermissions = () => {
    const user = getUser();
    let permissions = JSON.parse(user.permissions);

    // Check canCreateTickets permission
    if (!permissions?.canCreateTickets) {
      alert('You need "Completed Task" permission');
      
      // Redirect based on other permissions
      if (permissions?.canCallTickets) {
        router.push('/user/dashboard');
      } else {
        router.push('/login');
      }
      return false;
    }
    return true;
  };

  if (checkPermissions()) {
    fetchCompletedTickets();
  }
}, []);
```

---

## 🎯 User Scenarios

### Scenario 1: User with ONLY "Call Tickets" Permission
```json
{
  "canCallTickets": true,
  "canCreateTickets": false
}
```

**Behavior:**
- ✅ Can access Dashboard (`/user/dashboard`)
- ❌ Cannot access Completed Tasks
- If tries to access completed tasks → redirected to dashboard

### Scenario 2: User with ONLY "Completed Task" Permission
```json
{
  "canCallTickets": false,
  "canCreateTickets": true
}
```

**Behavior:**
- ❌ Cannot access Dashboard
- ✅ Can access Completed Tasks (`/user/completed-tasks`)
- If tries to access dashboard → redirected to completed tasks

### Scenario 3: User with BOTH Permissions
```json
{
  "canCallTickets": true,
  "canCreateTickets": true
}
```

**Behavior:**
- ✅ Can access Dashboard
- ✅ Can access Completed Tasks
- Can freely navigate between both pages

### Scenario 4: User with NO Permissions
```json
{
  "canCallTickets": false,
  "canCreateTickets": false
}
```

**Behavior:**
- ❌ Cannot access Dashboard
- ❌ Cannot access Completed Tasks
- Redirected to login page

---

## 🧪 Testing Instructions

### 1. Create Test Users

```javascript
// User 1: Only Call Tickets
{
  username: "caller_user",
  permissions: {
    canCallTickets: true,
    canCreateTickets: false
  }
}

// User 2: Only Completed Tasks
{
  username: "completer_user",
  permissions: {
    canCallTickets: false,
    canCreateTickets: true
  }
}

// User 3: Both Permissions
{
  username: "full_access_user",
  permissions: {
    canCallTickets: true,
    canCreateTickets: true
  }
}
```

### 2. Test Each User

**Test Caller User:**
1. Login as `caller_user`
2. Try accessing `/user/dashboard` → ✅ Should work
3. Try accessing `/user/completed-tasks` → ❌ Should redirect to dashboard

**Test Completer User:**
1. Login as `completer_user`
2. Try accessing `/user/dashboard` → ❌ Should redirect to completed tasks
3. Try accessing `/user/completed-tasks` → ✅ Should work

**Test Full Access User:**
1. Login as `full_access_user`
2. Try accessing `/user/dashboard` → ✅ Should work
3. Try accessing `/user/completed-tasks` → ✅ Should work

---

## 🔧 Database Queries for Testing

### Check User Permissions
```sql
SELECT 
  id, 
  username, 
  role, 
  permissions 
FROM users 
WHERE username IN ('caller_user', 'completer_user', 'full_access_user');
```

### Update User Permissions
```sql
-- Give only Call Tickets permission
UPDATE users 
SET permissions = JSON_OBJECT(
  'canCallTickets', true,
  'canCreateTickets', false,
  'canViewReports', false,
  'canManageQueue', false,
  'canAccessDashboard', false,
  'canManageUsers', false,
  'canManageTickets', false,
  'canManageSettings', false,
  'canManageCounters', false,
  'canManageServices', false
)
WHERE username = 'caller_user';

-- Give only Completed Tasks permission
UPDATE users 
SET permissions = JSON_OBJECT(
  'canCallTickets', false,
  'canCreateTickets', true,
  'canViewReports', false,
  'canManageQueue', false,
  'canAccessDashboard', false,
  'canManageUsers', false,
  'canManageTickets', false,
  'canManageSettings', false,
  'canManageCounters', false,
  'canManageServices', false
)
WHERE username = 'completer_user';
```

---

## 📝 Console Logs for Debugging

### Dashboard Page Logs:
```
✅ User has canCallTickets permission
📦 Separated tickets: Regular=5, Transferred=2
🔄 No ticket selected, setting to: T001
```

### Completed Tasks Page Logs:
```
✅ User has canCreateTickets permission
✅ Loaded 15 completed tickets
📊 First ticket: {...}
```

### Permission Denied Logs:
```
⚠️ User does not have canCallTickets permission - redirecting
❌ Permission denied - redirecting to completed tasks
```

---

## ⚠️ Important Notes

1. **Admin/Super Admin:** Automatically have all permissions, bypass all checks
2. **Permission Storage:** Stored as JSON in database `users.permissions` column
3. **Frontend Check:** Done on component mount for UX
4. **Backend Check:** Done on every API call for security
5. **Auto Redirect:** Users automatically redirected to appropriate page based on permissions

---

## 🐛 Troubleshooting

### Issue: User has permission but still getting error

**Solution:**
1. Check browser console for permission object
2. Verify database has correct JSON format
3. Clear browser cache and localStorage
4. Re-login to refresh token with latest permissions

### Issue: Permission check not working

**Solution:**
1. Check `permissions` column in database exists
2. Verify permissions are JSON format, not string
3. Check backend middleware is imported correctly
4. Verify route has `checkPermission()` middleware

### Issue: Infinite redirect loop

**Solution:**
1. User must have at least ONE permission (canCallTickets OR canCreateTickets)
2. Check both frontend and backend are in sync
3. Verify session storage has correct user object

---

## ✅ Verification Checklist

- [ ] Backend middleware created (`checkPermission`)
- [ ] Routes protected with middleware
- [ ] Frontend pages check permissions on mount
- [ ] Error handling redirects to appropriate page
- [ ] Database has permissions column
- [ ] Test users created with different permissions
- [ ] All scenarios tested successfully
- [ ] Console logs show correct behavior
- [ ] No infinite redirect loops
- [ ] Admin/Super admin bypass works

---

**Implementation Complete! ✨**

Ab aap users ki permissions ke base pe automatically correct pages load honge!
