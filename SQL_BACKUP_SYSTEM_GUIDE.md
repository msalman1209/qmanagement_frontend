# 🔄 SQL BACKUP SYSTEM - UPDATED GUIDE

## ✅ تبدیلی | CHANGE

**پہلے:** JSON backup files  
**اب:** ✅ **SQL backup files** (Proper database dump)

---

## 📥 SQL بیک اپ کیا ہے؟ | What is SQL Backup?

SQL backup ایک **database dump** ہے جس میں:
- ✅ Actual SQL INSERT statements
- ✅ DELETE statements (پرانا data ہٹانے کے لیے)
- ✅ Direct database restore
- ✅ Human-readable format
- ✅ کسی بھی SQL tool میں import کر سکتے ہیں

---

## 🆚 JSON vs SQL

### ❌ JSON (پرانا طریقہ):
```json
{
  "admin_id": 1,
  "data": {
    "services": [...]
  }
}
```

### ✅ SQL (نیا طریقہ):
```sql
-- Queue Management System - Admin Backup
-- Admin ID: 1
-- Backup Date: 2025-12-26

DELETE FROM services WHERE admin_id = 1;

INSERT INTO services (id, admin_id, name, status) 
VALUES (1, 1, 'Service A', 'active');

INSERT INTO services (id, admin_id, name, status) 
VALUES (2, 1, 'Service B', 'active');
```

---

## 🚀 کیسے استعمال کریں؟ | How to Use?

### 1️⃣ SQL Backup بنائیں:

```
Super Admin Login
    ↓
License Management → Admin Select
    ↓
"Backup & Restore" Tab
    ↓
"Download Backup" بٹن دبائیں
    ↓
✅ .SQL فائل ڈاؤن لوڈ ہو گی
```

**فائل کی مثال:** `backup_admin_1_2025-12-26.sql`

---

### 2️⃣ SQL Backup بحال کریں:

```
"Backup & Restore" Tab
    ↓
"Select Backup File" → .SQL منتخب کریں
    ↓
"Restore Backup" دبائیں
    ↓
تصدیق کریں
    ↓
✅ ڈیٹا restore ہو گیا
```

---

## 📄 SQL Backup فائل کی ساخت | Structure

```sql
-- =============================================
-- Queue Management System - Admin Backup
-- Admin ID: 1
-- Backup Date: 12/26/2025, 10:30:00 AM
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- Table: services
-- Rows: 5
-- =============================================

DELETE FROM services WHERE admin_id = 1;

INSERT INTO services (id, admin_id, name, status, created_at) 
VALUES (1, 1, 'Service A', 'active', '2025-12-26 10:00:00');

INSERT INTO services (id, admin_id, name, status, created_at) 
VALUES (2, 1, 'Service B', 'active', '2025-12-26 10:05:00');

-- =============================================
-- Table: tickets
-- Rows: 120
-- =============================================

DELETE FROM tickets WHERE admin_id = 1;

INSERT INTO tickets (id, admin_id, ticket_number, status, created_at) 
VALUES (1, 1, 'A001', 'completed', '2025-12-26 09:00:00');

-- ... more INSERT statements ...

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- Backup Complete
-- Total Rows: 125
-- =============================================
```

---

## ✨ فوائد | Benefits

### 1. **Database Dump** 
   - Proper SQL format
   - Direct database restore

### 2. **Portable**
   - کسی بھی MySQL database میں import
   - phpMyAdmin, MySQL Workbench support

### 3. **Human Readable**
   - آسانی سے پڑھ سکتے ہیں
   - Debugging آسان ہے

### 4. **Version Control Friendly**
   - Git میں track کر سکتے ہیں
   - Changes دیکھ سکتے ہیں

### 5. **Safe**
   - Admin ID verification
   - Automatic DELETE before INSERT
   - Transaction-based restore

---

## 🗄️ Backed Up Tables

1. ✅ **services** - خدمات
2. ✅ **tickets** - ٹکٹس
3. ✅ **sessions** - سیشنز
4. ✅ **button_settings** - بٹن ترتیبات
5. ✅ **voice_settings** - آواز ترتیبات
6. ✅ **counter_display_settings** - کاؤنٹر ڈسپلے
7. ✅ **display_screen_sessions** - ڈسپلے سیشنز
8. ✅ **activity_logs** - سرگرمی لاگز

---

## 🔧 Manual Import (Alternative)

SQL backup کو manually بھی import کر سکتے ہیں:

### phpMyAdmin میں:
```
1. Database select کریں
2. "Import" tab پر جائیں
3. .sql فائل choose کریں
4. "Go" بٹن دبائیں
```

### MySQL Command Line میں:
```bash
mysql -u username -p database_name < backup_admin_1_2025-12-26.sql
```

### MySQL Workbench میں:
```
1. Server → Data Import
2. "Import from Self-Contained File"
3. .sql فائل select کریں
4. "Start Import"
```

---

## 🔒 Security Features

1. ✅ **Super Admin Only** - صرف super_admin access
2. ✅ **Admin ID Verification** - فائل میں Admin ID check
3. ✅ **SQL Injection Protection** - Values properly escaped
4. ✅ **Transaction Safety** - Rollback on error
5. ✅ **Activity Logging** - تمام actions log

---

## 📊 API Changes

### Create Backup:
```
POST /api/backup/create/:adminId

Response: SQL file download
Content-Type: application/sql
Content-Disposition: attachment; filename="backup_admin_1_2025-12-26.sql"
```

### Restore Backup:
```
POST /api/backup/restore
Content-Type: multipart/form-data

Body:
- backupFile: .sql file
- adminId: target admin ID

Response:
{
  "success": true,
  "message": "SQL Backup restored successfully",
  "restored": {
    "statements_executed": 125,
    "rows_deleted": 120,
    "rows_inserted": 125
  }
}
```

---

## ⚠️ احتیاط | Warnings

### 1. 🚨 صرف .SQL فائلیں
   - JSON, TXT, یا دوسری فائلیں قبول نہیں

### 2. 🔍 Admin ID چیک
   - Backup file کی Admin ID match ہونی چاہیے
   - Automatic verification ہوتی ہے

### 3. 💾 ڈیٹا بدل جاتا ہے
   - Restore کرنے سے پرانا data delete
   - پہلے backup ضرور لیں

### 4. 📝 SQL Syntax
   - فائل میں valid SQL ہونا چاہیے
   - Manually edit کرتے وقت احتیاط

---

## 🐛 Troubleshooting

### Error: "Only SQL files are allowed"
**حل:** .sql extension والی فائل استعمال کریں

### Error: "Backup file is for Admin ID X"
**حل:** صحیح admin کی backup فائل select کریں

### Error: "Failed to restore SQL backup"
**حل:** 
- فائل میں valid SQL check کریں
- Database connection verify کریں
- Backend logs دیکھیں

---

## 💡 بہترین طریقے | Best Practices

### 1. 📅 Regular Backups
- ہفتہ میں کم از کم ایک بار
- اہم changes سے پہلے

### 2. 💾 Safe Storage
- Backups کو secure location میں
- Multiple copies maintain کریں

### 3. 🧪 Test Before Production
- پہلے test environment میں restore
- Production میں directly نہیں

### 4. 📝 Backup Naming
- Date/time شامل کریں
- Admin ID واضح ہو

### 5. 🔍 Verify Backups
- Download کے بعد فائل check کریں
- کبھی کبھی manual import test کریں

---

## 🎯 فائدے کا خلاصہ | Summary of Benefits

| Feature | JSON | SQL |
|---------|------|-----|
| Format | ❌ Custom | ✅ Standard |
| Portability | ❌ Limited | ✅ Universal |
| Readability | ❌ Complex | ✅ Simple |
| Manual Import | ❌ No | ✅ Yes |
| Version Control | ❌ Difficult | ✅ Easy |
| Size | ❌ Larger | ✅ Optimized |

---

## 🚀 Ready to Use!

### ✅ کیا تیار ہے:
- [x] SQL backup creation
- [x] SQL file download
- [x] SQL restore from file
- [x] Admin ID verification
- [x] Activity logging
- [x] Error handling
- [x] Security measures

### 🎉 استعمال شروع کریں!

1. Super Admin login کریں
2. License Management میں جائیں
3. Admin select کریں
4. Backup & Restore tab کھولیں
5. SQL backup بنائیں یا restore کریں

---

## 📞 Support

**مسائل کی صورت میں:**
1. Backend logs چیک کریں
2. Browser console دیکھیں
3. SQL file content verify کریں
4. Database permissions چیک کریں

---

**✨ SQL Backup System Ready! ✨**

**اب صحیح database dump ملے گی! 🎉**

---

*Updated: December 26, 2025*  
*Version: 2.0 (SQL Edition)*
