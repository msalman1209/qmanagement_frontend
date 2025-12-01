# Counter Selection Feature Implementation

## Overview
Implemented a dynamic counter selection system where users select their counter after login. The system shows which counters are occupied and prevents multiple users from selecting the same counter.

## Files Created/Modified

### Backend Files

#### 1. **backend/controllers/admin/counters/getAdminCounters.js** (NEW)
- Fetches admin's available counters based on `total_counters` field
- Checks `user_sessions` table for occupied counters
- Returns counter array with occupation status:
```javascript
{
  counters: [
    {
      counter_no: 1,
      isOccupied: false,
      occupiedBy: null
    },
    {
      counter_no: 2,
      isOccupied: true,
      occupiedBy: { username: "john", email: "john@email.com" }
    }
  ],
  totalCounters: 5
}
```

#### 2. **backend/controllers/auth/setUserCounter.js** (NEW)
- Protected endpoint (requires authentication)
- Assigns selected counter to user's session
- Checks if counter is already occupied before assignment
- Updates `user_sessions` table with:
  - `counter_no`
  - `admin_id`
  - `username`
  - `email`
  - `is_active = 1`

#### 3. **backend/controllers/auth/userLogin.js** (MODIFIED)
- Removed `counter_no` requirement from login
- Counter selection moved to separate step after authentication
- Returns `admin_id` in user object for counter fetching

#### 4. **backend/routes/admin.js** (MODIFIED)
- Added route: `GET /api/admin/counters/:adminId`
- Imports and exports `getAdminCounters` controller

#### 5. **backend/routes/auth.js** (MODIFIED)
- Added route: `POST /api/auth/user/set-counter`
- Protected with `authenticateToken` middleware

#### 6. **backend/controllers/admin/index.js** (MODIFIED)
- Added export for `getAdminCounters`

#### 7. **backend/controllers/auth/index.js** (MODIFIED)
- Added export for `setUserCounter`

#### 8. **backend/database/init-database.js** (MODIFIED)
- Updated `user_sessions` table schema to include:
  - `email VARCHAR(255)` - User's email
  - `counter_no INT(11)` - Assigned counter number
  - `admin_id INT(11)` - Admin ID for counter grouping
  - `is_active TINYINT(1)` - Counter occupation status (0=free, 1=occupied)
- Added index on `(counter_no, admin_id, is_active)` for efficient queries
- Added migration code to add columns to existing tables

### Frontend Files

#### 9. **src/Components/CounterSelectionModal.js** (NEW)
Full-featured modal component with:
- **Counter Grid Display**: Shows all admin counters in grid layout
- **Visual States**:
  - Available counters: White background, selectable
  - Selected counter: Green background with checkmark
  - Occupied counters: Red background, disabled, shows occupant info
- **Info Banner**: Shows available/total counter count
- **Occupied Counter List**: Detailed list showing who occupied which counter
- **Legend**: Color-coded legend explaining counter states
- **Loading State**: Spinner while fetching counters
- **Error Handling**: Retry button if fetch fails
- **Responsive Design**: Grid adjusts from 3 to 5 columns based on screen size

#### 10. **src/app/login/page.js** (MODIFIED)
Major changes to login flow:

**State Management**:
```javascript
const [showCounterModal, setShowCounterModal] = useState(false)
const [pendingUserData, setPendingUserData] = useState(null)
```

**Removed**:
- Counter dropdown from user login form
- `counter_no` from formData state
- `counter_no` validation in form validation

**New Login Flow**:
1. User enters email and password
2. Backend authenticates and returns token + user data with `admin_id`
3. Frontend stores data temporarily in `pendingUserData`
4. Shows `CounterSelectionModal` with admin's counters
5. User selects available counter
6. Frontend calls `/api/auth/user/set-counter` with selected counter
7. Backend updates session with counter details
8. Redux state updated with counter info
9. User redirected to dashboard

**New Function**: `handleCounterSelect(counterNo)`
- Calls set-counter API with authorization token
- Updates Redux state with counter number
- Closes modal and triggers redirect

## Database Schema Changes

### user_sessions Table
```sql
CREATE TABLE user_sessions (
  session_id INT(11) AUTO_INCREMENT PRIMARY KEY,
  user_id INT(11) NOT NULL,
  username VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,              -- NEW
  counter_no INT(11) DEFAULT NULL,              -- NEW
  admin_id INT(11) DEFAULT NULL,                -- NEW
  token VARCHAR(500) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_info VARCHAR(255) DEFAULT NULL,
  ip_address VARCHAR(50) DEFAULT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  active TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 0,               -- NEW (counter occupation)
  KEY idx_counter_admin (counter_no, admin_id, is_active)  -- NEW
)
```

## API Endpoints

### 1. GET /api/admin/counters/:adminId
**Purpose**: Fetch admin's counters with occupation status

**Authentication**: Required (any authenticated user)

**Request**: 
```
GET /api/admin/counters/1
```

**Response**:
```json
{
  "success": true,
  "counters": [
    {
      "counter_no": 1,
      "isOccupied": false,
      "occupiedBy": null
    },
    {
      "counter_no": 2,
      "isOccupied": true,
      "occupiedBy": {
        "username": "john_user",
        "email": "john@example.com"
      }
    }
  ],
  "totalCounters": 5
}
```

### 2. POST /api/auth/user/set-counter
**Purpose**: Assign counter to authenticated user's session

**Authentication**: Required (token in Authorization header)

**Request**:
```json
{
  "counter_no": 3
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Counter assigned successfully",
  "counter_no": 3
}
```

**Error Response (Occupied)**:
```json
{
  "success": false,
  "message": "Counter 3 is already occupied by jane_user",
  "occupied": true,
  "occupiedBy": {
    "username": "jane_user",
    "email": "jane@example.com"
  }
}
```

## User Flow

### Before (Old Flow)
1. User opens login page
2. Enters email, password, and selects counter from dropdown (1-11)
3. Submits form
4. Backend validates and creates session with counter
5. Redirects to dashboard

### After (New Flow)
1. User opens login page
2. Enters email and password only
3. Submits form
4. Backend validates credentials
5. **Modal appears showing admin's available counters**
6. **User sees which counters are occupied (highlighted in red)**
7. **User selects available counter (highlighted in green when selected)**
8. **User confirms selection**
9. Backend assigns counter to session
10. Redirects to dashboard

## Features

### Dynamic Counter Count
- Each admin has `total_counters` field (default 5)
- System dynamically generates counter options based on admin's setting
- Not hardcoded to 1-11 anymore

### Real-time Occupation Status
- Queries active sessions before displaying counters
- Shows current occupant's username and email
- Prevents race conditions with database checks

### Visual Feedback
- **Available**: White/gray background, hover effects
- **Selected**: Green background with checkmark
- **Occupied**: Red background, disabled, shows occupant
- Loading spinner during API calls
- Toast notifications for success/error

### Error Handling
- Occupied counter detection (409 Conflict)
- Network error handling with retry option
- Form validation (email, password required)
- Token authorization for counter assignment

### Security
- Counter assignment requires valid authentication token
- User can only assign counter after successful login
- Double-check on backend prevents occupation conflicts
- Admin ID validation ensures counter belongs to correct admin

## Testing Checklist

- [ ] User login shows counter modal
- [ ] Modal displays correct number of counters (based on admin's total_counters)
- [ ] Occupied counters are highlighted in red
- [ ] Clicking occupied counter does nothing
- [ ] Selecting available counter highlights it in green
- [ ] Confirm button only enabled when counter selected
- [ ] Counter assignment API call succeeds
- [ ] Session updated with counter_no, admin_id, email, username
- [ ] is_active set to 1 in user_sessions
- [ ] Second user cannot select occupied counter
- [ ] Cancel button closes modal without assigning counter
- [ ] Toast notifications show for success/error
- [ ] Redirect happens after successful counter assignment
- [ ] Database migration adds columns to existing user_sessions table

## Notes

- Counter selection is mandatory for users - cannot proceed without selecting
- Modal cannot be closed until counter is selected (or user cancels, which logs them out)
- Counter remains occupied until user logs out or session expires
- Admin can configure number of counters in admin table's `total_counters` field
- System supports multiple admins with independent counter pools
