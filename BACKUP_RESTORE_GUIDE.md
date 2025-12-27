# 📦 Admin Backup & Restore System - Complete Guide

## 🎯 Overview / خلاصہ

Super Admin ab kisi bhi admin ka complete backup create aur restore kar sakta hai. Saari tables ka data admin ID ke saath save hota hai.

---

## ✨ Features

### 1️⃣ **Create Backup (بیک اپ بنائیں)**
- Admin ki saari tables ka data backup mein save hota hai
- JSON format mein download hota hai
- Admin ID ke saath tagged rahta hai

### 2️⃣ **Restore Backup (بیک اپ بحال کریں)**
- JSON file upload karein
- Admin ID verify hoti hai
- Saara data automatically restore ho jata hai

### 3️⃣ **Backup History (بیک اپ کی تاریخ)**
- Previous backups ka record
- Creation aur restoration logs
- Date aur time tracking

---

## 🚀 How to Use / استعمال کیسے کریں

### Super Admin Panel mein Access:

1. **Login karein** as Super Admin
2. **License Management** page par jayein
3. Kisi bhi **Admin par click** karein
4. Modal mein **"Backup & Restore"** tab select karein

---

## 📋 Backup Process Flow

```
┌─────────────────────────────────────────┐
│   Super Admin → License List            │
│   ↓                                     │
│   Admin Select → Modal Opens            │
│   ↓                                     │
│   Backup & Restore Tab                  │
│   ↓                                     │
│   ┌───────────────┐  ┌──────────────┐  │
│   │ Create Backup │  │Restore Backup│  │
│   └───────────────┘  └──────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🗄️ Backed Up Tables

Ye tables backup mein shamil hain:

1. **services** - Admin ke services
2. **tickets** - Saare tickets
3. **sessions** - User sessions
4. **button_settings** - Button configurations
5. **voice_settings** - Voice/TTS settings
6. **counter_display_settings** - Counter display config
7. **display_screen_sessions** - Display sessions
8. **activity_logs** - Activity history

---

## 🔧 API Endpoints

### 1. Create Backup
```
POST /api/backup/create/:adminId
Authorization: Bearer <super_admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Backup created successfully",
  "data": {
    "admin_id": 1,
    "backup_date": "2025-12-26T10:30:00.000Z",
    "admin_info": { ... },
    "data": {
      "services": [...],
      "tickets": [...],
      ...
    }
  }
}
```

### 2. Restore Backup
```
POST /api/backup/restore
Content-Type: multipart/form-data
Authorization: Bearer <super_admin_token>

Body:
- backupFile: JSON file
- adminId: target admin ID
```

**Response:**
```json
{
  "success": true,
  "message": "Backup restored successfully",
  "restored": {
    "services": 5,
    "tickets": 120,
    "sessions": 45,
    ...
  }
}
```

### 3. Backup History
```
GET /api/backup/history/:adminId
Authorization: Bearer <super_admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "BACKUP_CREATED",
      "description": "Backup created for admin ID 1",
      "created_at": "2025-12-26T10:30:00.000Z",
      "status": "success"
    }
  ]
}
```

---

## 🎨 UI Features

### Create Backup Section
- ✅ Simple one-click backup creation
- ✅ Automatic JSON file download
- ✅ Admin ID display
- ✅ Loading states

### Restore Backup Section
- ✅ File upload with validation (JSON only)
- ✅ Admin ID verification
- ✅ Confirmation dialog
- ✅ Progress indicators

### Backup History Section
- ✅ Table view of past backups
- ✅ Date and time display
- ✅ Status badges (success/error)
- ✅ Action type (created/restored)

---

## 🔒 Security Features

1. **Super Admin Only** - Sirf super_admin access kar sakta hai
2. **Admin ID Verification** - Backup file admin ID match honi chahiye
3. **JWT Authentication** - Token verification required
4. **File Type Validation** - Sirf JSON files allowed
5. **Transaction Safety** - Database transactions use hote hain

---

## 📝 Usage Example (Urdu)

### Backup Banana:
```
1. Super Admin login karein
2. License Management → Admin select karein
3. Backup & Restore tab khulein
4. "Download Backup" button par click karein
5. JSON file download ho jayegi
```

### Backup Restore Karna:
```
1. Backup & Restore tab mein jayein
2. "Select Backup File" se JSON file choose karein
3. "Restore Backup" button par click karein
4. Confirmation dialog mein "OK" karein
5. Data restore ho jayega
```

---

## ⚠️ Important Notes

1. **Backup File Format**: JSON only
2. **Admin ID Matching**: Restore karte waqt admin ID match honi chahiye
3. **Data Overwrite**: Restore karne se purana data replace ho jata hai
4. **Super Admin Access**: Regular admins backup nahi create kar sakte
5. **Activity Logs**: Har backup action log hota hai

---

## 🐛 Troubleshooting

### Error: "Backup file admin ID does not match"
- **Solution**: Correct admin ki backup file use karein

### Error: "Only JSON files are allowed"
- **Solution**: `.json` extension wali file select karein

### Error: "No backup file provided"
- **Solution**: File select karna bhool gaye, pehle file select karein

### Error: "Failed to create backup"
- **Solution**: Database connection check karein ya logs dekhen

---

## 📊 Database Schema

### Activity Logs Entry:
```sql
INSERT INTO activity_logs (
  admin_id, 
  action_type, 
  description, 
  performed_by
) VALUES (
  1,
  'BACKUP_CREATED',
  'Backup created for admin ID 1',
  <super_admin_id>
);
```

---

## 🎯 Testing Checklist

- [x] Backup create hota hai
- [x] JSON file download hoti hai
- [x] Backup restore hota hai
- [x] Admin ID verification kaam karti hai
- [x] History display hoti hai
- [x] Super admin only access hai
- [x] Activity logs save hote hain
- [x] Error handling proper hai

---

## 🚦 File Structure

```
backend/
├── routes/
│   └── backup.js              # Backup API routes
├── uploads/
│   └── backups/               # Temporary backup files (auto-created)
└── server.js                  # Backup route registered

frontend/
└── src/
    └── app/
        └── [role]/
            └── license/
                └── list-of-license/
                    └── page.js    # Backup UI component
```

---

## 💡 Tips

1. **Regular Backups** banayein important data ke liye
2. **Backup Files** safe jagah store karein
3. **Test Restore** pehle test environment mein karein
4. **Backup History** regularly check karein
5. **Logs Review** karein activity tracking ke liye

---

## 🎉 Client Ko Dene Se Pehle

### ✅ Checklist:
- [x] Super Admin login test kiya
- [x] Admin selection working hai
- [x] Backup create aur download ho raha hai
- [x] Backup restore properly kaam kar raha hai
- [x] Admin ID verification kaam kar rahi hai
- [x] UI responsive hai
- [x] Error messages clear hain
- [x] Activity logs save ho rahe hain

---

## 📞 Support

Koi issue ho to ye check karein:
1. Server running hai?
2. Database connected hai?
3. Super admin logged in hai?
4. Network console errors check karein
5. Backend logs dekhen

---

**✨ Feature Complete! Ready for Client Delivery! ✨**

---

### Quick Commands

**Backend Start:**
```bash
cd backend
npm start
```

**Frontend Start:**
```bash
cd que-management
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Super Admin Login: `/super-admin-secure-login`

---

Made with ❤️ for Queue Management System
