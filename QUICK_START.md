# 🚀 Quick Start - License System

## ⚡ 5-Minute Setup

### 1️⃣ Setup Database (1 minute)
```bash
cd backend
npm run setup:license
```

### 2️⃣ Test Setup (30 seconds)
```bash
npm run test:license
```

### 3️⃣ Start Server (10 seconds)
```bash
npm start
```

### 4️⃣ Login as Super Admin (1 minute)
```
URL: http://localhost:5000
Username: superadmin
Password: SuperAdmin@123
```

### 5️⃣ Create First License (2 minutes)

**API Call:**
```http
POST http://localhost:5000/api/license/create
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "company_name": "My First Company",
  "email": "admin@company.com",
  "license_type": "trial",
  "admin_username": "myadmin",
  "admin_password": "Admin@123"
}
```

**✅ Done! You now have:**
- ✓ License key: XXXX-XXXX-XXXX-XXXX
- ✓ Admin account ready
- ✓ 30-day trial active

---

## 📱 Using Postman/Thunder Client

### Import These Requests:

#### 1. Super Admin Login
```
POST http://localhost:5000/api/auth/super-admin/login
Body: {
  "username": "superadmin",
  "password": "SuperAdmin@123"
}
```

#### 2. Create License
```
POST http://localhost:5000/api/license/create
Authorization: Bearer {{token}}
Body: {
  "company_name": "ABC Company",
  "email": "admin@abc.com",
  "license_type": "premium",
  "admin_username": "admin_abc",
  "admin_password": "Abc@123"
}
```

#### 3. Get All Licenses
```
GET http://localhost:5000/api/license/all
Authorization: Bearer {{token}}
```

#### 4. Admin Login
```
POST http://localhost:5000/api/auth/admin/login
Body: {
  "username": "admin_abc",
  "password": "Abc@123"
}
```

---

## 🎯 Common Tasks

### Task 1: Create Trial License
```bash
# Quick command (after login)
{
  "company_name": "Test Co",
  "email": "test@test.com",
  "license_type": "trial",
  "admin_username": "testuser",
  "admin_password": "Test@123"
}
```
**Result:** 30-day trial with 5 users, 2 counters, 5 services

### Task 2: Upgrade License
```bash
PUT /api/license/1
{
  "license_type": "premium",
  "max_users": 50,
  "expiry_date": "2026-12-01"
}
```
**Result:** License upgraded to premium

### Task 3: Extend Expiry
```bash
PUT /api/license/1
{
  "expiry_date": "2027-12-01"
}
```
**Result:** License extended by 1 year

### Task 4: Suspend License
```bash
PUT /api/license/1
{
  "status": "suspended"
}
```
**Result:** Admin can't access system

---

## 🔍 Quick Checks

### Check if Setup is Complete
```bash
npm run test:license
```
Should show all ✅

### Check Super Admin Exists
```sql
SELECT * FROM admin WHERE role = 'super_admin';
```

### Check Licenses Table
```sql
SHOW TABLES LIKE 'licenses';
```

### Check License Count
```sql
SELECT COUNT(*) FROM licenses;
```

---

## 💡 Pro Tips

### Tip 1: Auto-Generate License Keys
Don't specify `license_key` in request - it will auto-generate!

### Tip 2: Use License Types Wisely
- Trial: For testing (30 days)
- Basic: Small businesses
- Premium: Medium businesses
- Enterprise: Large organizations

### Tip 3: Monitor Expiring Licenses
```bash
GET /api/license/report
```
Shows licenses expiring in next 30 days

### Tip 4: Set Strong Passwords
Always use strong passwords for admin accounts:
- Minimum 8 characters
- 1 uppercase, 1 lowercase
- 1 number, 1 special character

---

## ⚠️ Troubleshooting

### Error: "Table licenses doesn't exist"
```bash
npm run setup:license
```

### Error: "Super admin not found"
```bash
npm run setup:license
```

### Error: "License expired"
```bash
# Login as super admin and extend expiry
PUT /api/license/1
{ "expiry_date": "2026-12-01" }
```

### Error: "User limit reached"
```bash
# Upgrade license or increase limit
PUT /api/license/1
{ "max_users": 50 }
```

---

## 📊 Quick Stats Commands

### Total Licenses
```sql
SELECT COUNT(*) FROM licenses;
```

### Active Licenses
```sql
SELECT COUNT(*) FROM licenses WHERE status = 'active';
```

### Expiring This Month
```sql
SELECT COUNT(*) FROM licenses 
WHERE expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
```

### Users Per Admin
```sql
SELECT admin_id, COUNT(*) as user_count 
FROM users 
GROUP BY admin_id;
```

---

## 🎉 You're All Set!

### What You Have Now:
✅ Complete license management system
✅ Super admin account
✅ Automatic validation
✅ User/Service limits
✅ Expiry checking
✅ Status tracking

### What You Can Do:
✅ Create unlimited licenses
✅ Manage multiple admins
✅ Track usage and expiry
✅ Generate reports
✅ Control access

### Next Steps:
1. Create your first license
2. Test admin login
3. Try creating users (check limits)
4. Generate a license report
5. Customize as needed

---

## 📞 Need Help?

### Check Documentation:
- `LICENSE_COMPLETE_GUIDE.md` - Full guide
- `LICENSE_URDU_GUIDE.md` - Urdu guide
- `LICENSE_VISUAL_GUIDE.md` - Visual diagrams
- `LICENSE_QUICK_REFERENCE.md` - API reference

### Common Issues:
1. Database not connected - Check `.env`
2. Tables not created - Run setup script
3. Token expired - Login again
4. Limits reached - Upgrade license

---

**Happy Coding! 🚀**

**Time to Complete Setup:** ~5 minutes
**Time to First License:** ~10 minutes total
