# 🔐 Complete License Management System - Setup & Usage Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Database Setup](#database-setup)
4. [License Types](#license-types)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

یہ ایک مکمل License Management System ہے جو آپ کے Queue Management System میں integrate ہو گیا ہے۔ اس سسٹم کے ذریعے:

- **Super Admin** نئے licenses create کر سکتا ہے
- ہر license کے ساتھ automatically ایک admin account بنتا ہے
- License expiry automatic check ہوتی ہے
- User اور Service limits enforce ہوتی ہیں
- License types (Trial, Basic, Premium, Enterprise) support ہوتی ہیں

---

## ✨ Features

### ✅ License Management
- ✓ Automatic license key generation (Format: XXXX-XXXX-XXXX-XXXX)
- ✓ Multiple license types support
- ✓ Automatic expiry checking
- ✓ User and service limits enforcement
- ✓ License status tracking (active, inactive, suspended, expired)

### ✅ Admin Management
- ✓ Super admin can create licenses
- ✓ Each license creates an admin account
- ✓ Admin operations restricted by license
- ✓ Automatic license validation on API calls

### ✅ Security Features
- ✓ Password hashing with bcrypt
- ✓ JWT token authentication
- ✓ Session management
- ✓ Role-based access control

---

## 🗄️ Database Setup

### Step 1: Run Setup Script

```bash
cd backend
node database/setup-licensing.js
```

یہ script automatically:
- Admin table update کرے گا
- Licenses table create کرے گا
- Admin_sessions table create کرے گا
- Super admin account بنائے گا
- تمام indexes add کرے گا

### Step 2: Verify Setup

Setup کامیاب ہونے پر آپ کو یہ message دکھائی دے گا:

```
🎉 License System Setup Completed Successfully!

📝 Summary:
   ✓ Admin table updated with license fields
   ✓ Admin sessions table created
   ✓ Licenses table created
   ✓ Users and Services tables updated
   ✓ Super admin account created/verified
   ✓ Database indexes added
```

### Default Super Admin Credentials

```
Username: superadmin
Password: SuperAdmin@123
```

**⚠️ Important:** پہلی login کے بعد password ضرور change کریں!

---

## 📦 License Types

### 1. Trial License
```json
{
  "max_users": 5,
  "max_counters": 2,
  "max_services": 5,
  "duration_days": 30,
  "features": ["basic_reporting", "email_support"]
}
```

### 2. Basic License
```json
{
  "max_users": 10,
  "max_counters": 5,
  "max_services": 10,
  "duration_days": 365,
  "features": ["basic_reporting", "email_support", "ticket_management"]
}
```

### 3. Premium License
```json
{
  "max_users": 50,
  "max_counters": 20,
  "max_services": 50,
  "duration_days": 365,
  "features": [
    "advanced_reporting",
    "priority_support",
    "ticket_management",
    "custom_branding",
    "api_access"
  ]
}
```

### 4. Enterprise License
```json
{
  "max_users": 999,
  "max_counters": 999,
  "max_services": 999,
  "duration_days": 365,
  "features": [
    "advanced_reporting",
    "dedicated_support",
    "ticket_management",
    "custom_branding",
    "api_access",
    "multi_location",
    "white_label",
    "custom_integrations"
  ]
}
```

---

## 🔌 API Endpoints

### Authentication

#### Super Admin Login
```http
POST /api/auth/super-admin/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "SuperAdmin@123"
}
```

### License Management (Super Admin Only)

#### Create License
```http
POST /api/license/create
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "company_name": "ABC Company",
  "email": "admin@abccompany.com",
  "phone": "+92-300-1234567",
  "address": "123 Main Street",
  "city": "Karachi",
  "country": "Pakistan",
  "license_type": "premium",
  "admin_username": "admin_abc",
  "admin_password": "SecurePass@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "License and admin account created successfully",
  "data": {
    "license_id": 1,
    "license_key": "A1B2-C3D4-E5F6-G7H8",
    "admin_id": 5,
    "admin_username": "admin_abc",
    "admin_email": "admin@abccompany.com",
    "license_type": "premium",
    "start_date": "2025-12-01",
    "expiry_date": "2026-12-01",
    "max_users": 50,
    "max_counters": 20,
    "max_services": 50
  }
}
```

#### Get All Licenses
```http
GET /api/license/all
Authorization: Bearer <super_admin_token>
```

#### Get License by ID
```http
GET /api/license/:id
Authorization: Bearer <super_admin_token>
```

#### Update License
```http
PUT /api/license/:id
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "status": "active",
  "expiry_date": "2027-12-01",
  "max_users": 100
}
```

#### Delete License
```http
DELETE /api/license/:id
Authorization: Bearer <super_admin_token>
```

#### Get License Report
```http
GET /api/license/report
Authorization: Bearer <super_admin_token>
```

---

## 💡 Usage Examples

### Example 1: Create Trial License for New Client

```javascript
const response = await fetch('http://localhost:5000/api/license/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + superAdminToken
  },
  body: JSON.stringify({
    company_name: "Test Company",
    email: "test@company.com",
    license_type: "trial",
    admin_username: "testadmin",
    admin_password: "Test@123"
  })
})

const data = await response.json()
console.log('License Key:', data.data.license_key)
```

### Example 2: Check License Status

```javascript
// یہ middleware automatically check کرے گا
// اگر admin کا license expire ہو گیا تو API call fail ہو جائے گی

const response = await fetch('http://localhost:5000/api/user/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken
  },
  body: JSON.stringify({...})
})

if (!response.ok) {
  const error = await response.json()
  if (error.license_expired) {
    alert('آپ کا license expire ہو گیا ہے۔ براہ کرم renew کریں!')
  }
}
```

### Example 3: Check User Limits

```javascript
// جب admin نیا user create کرنے کی کوشش کرے گا
// تو automatically check ہو گا کہ limit تو نہیں پہنچ گئی

const response = await fetch('http://localhost:5000/api/user/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: "newuser",
    email: "newuser@example.com",
    password: "User@123"
  })
})

const data = await response.json()

if (data.limit_reached) {
  alert(`Maximum user limit (${data.max}) reached!`)
}
```

---

## 🧪 Testing

### Test 1: Setup Database
```bash
cd backend
node database/setup-licensing.js
```

### Test 2: Start Server
```bash
npm start
```

### Test 3: Login as Super Admin

**Using Postman or Thunder Client:**

```
POST http://localhost:5000/api/auth/super-admin/login

Body:
{
  "username": "superadmin",
  "password": "SuperAdmin@123"
}
```

### Test 4: Create a License

```
POST http://localhost:5000/api/license/create
Authorization: Bearer <token_from_step_3>

Body:
{
  "company_name": "Test Company",
  "email": "testadmin@test.com",
  "license_type": "trial",
  "admin_username": "testadmin",
  "admin_password": "Test@123"
}
```

### Test 5: Login as Admin

```
POST http://localhost:5000/api/auth/admin/login

Body:
{
  "username": "testadmin",
  "password": "Test@123"
}
```

### Test 6: Test License Validation

Try creating users until you hit the limit (5 for trial license)

---

## 🔧 Troubleshooting

### Problem 1: "Table 'licenses' doesn't exist"

**Solution:**
```bash
node database/setup-licensing.js
```

### Problem 2: "License expired" error but license is valid

**Solution:**
Database کی تاریخ check کریں:
```sql
SELECT CURDATE(), expiry_date FROM licenses WHERE id = ?
```

### Problem 3: Super admin login نہیں ہو رہا

**Solution:**
Super admin account manually create کریں:
```sql
INSERT INTO admin (username, email, password, role, status)
VALUES ('superadmin', 'superadmin@qmanagement.com', '$2a$10$...', 'super_admin', 'active')
```

### Problem 4: Foreign key constraint fails

**Solution:**
پہلے admin entry ہونی چاہیے، پھر license:
```bash
node database/setup-licensing.js
```

---

## 📝 Important Notes

### License Key Format
- Format: `XXXX-XXXX-XXXX-XXXX`
- Example: `A1B2-C3D4-E5F6-G7H8`
- Automatic generation hota ہے
- Unique ہونا ضروری ہے

### Expiry Checking
- ہر API call پر automatic check ہوتا ہے
- 7 دن پہلے warning دیتا ہے
- Expire ہونے پر admin کے تمام operations block ہو جاتے ہیں

### User/Service Limits
- License type کے مطابق enforce ہوتے ہیں
- Limit پہنچنے پر نیا create نہیں ہو سکتا
- Super admin کی کوئی limit نہیں

### Security
- تمام passwords bcrypt سے hash ہوتے ہیں
- JWT tokens استعمال ہوتے ہیں
- Sessions database میں track ہوتے ہیں

---

## 🎉 Congratulations!

اب آپ کا License Management System مکمل طور پر setup اور کام کر رہا ہے!

### Next Steps:
1. ✅ Database setup کر لیا
2. ✅ Super admin login کیا
3. ✅ License create کریں
4. ✅ Admin login test کریں
5. ✅ License validation test کریں

### Support:
اگر کوئی مسئلہ آئے تو:
- Backend logs check کریں
- Database queries verify کریں
- API responses دیکھیں

**Happy Coding! 🚀**
