# 📋 BACKUP & RESTORE - QUICK REFERENCE CARD

## 🚀 تیز رہنما کارڈ | Quick Guide

---

### 📥 بیک اپ بنائیں | CREATE BACKUP

```
1. Super Admin Login کریں
2. License Management → Admin پر کلک
3. "Backup & Restore" ٹیب
4. "Download Backup" بٹن دبائیں
5. JSON فائل ڈاؤن لوڈ ہو گئی ✅
```

**فائل:** `backup_admin_[ID]_[DATE].json`

---

### 📤 بیک اپ بحال کریں | RESTORE BACKUP

```
1. Super Admin Login کریں
2. License Management → Admin پر کلک
3. "Backup & Restore" ٹیب
4. "Select Backup File" → JSON منتخب کریں
5. "Restore Backup" بٹن
6. تصدیق کریں → "OK"
7. ڈیٹا بحال ہو گیا ✅
```

**نوٹ:** پرانا ڈیٹا بدل جائے گا!

---

### 🗄️ کون سے ٹیبل؟ | BACKED UP TABLES

1. ✅ Services
2. ✅ Tickets
3. ✅ Sessions
4. ✅ Button Settings
5. ✅ Voice Settings
6. ✅ Counter Display Settings
7. ✅ Display Screen Sessions
8. ✅ Activity Logs

---

### 🔒 رسائی | ACCESS

**کون استعمال کر سکتا ہے؟**
- ✅ Super Admin صرف
- ❌ Regular Admin نہیں

---

### ⚠️ احتیاط | WARNINGS

1. 🚨 **ڈیٹا بدل جائے گا**
   - Restore کرنے سے پرانا ڈیٹا ختم ہو جاتا ہے

2. 🔍 **Admin ID چیک کریں**
   - صحیح admin کا backup استعمال کریں

3. 📄 **صرف JSON فائل**
   - دوسری فائلیں کام نہیں کریں گی

---

### 🐛 مسائل | TROUBLESHOOTING

| مسئلہ | حل |
|-------|-----|
| فائل قبول نہیں ہوئی | JSON فائل استعمال کریں |
| Admin ID match نہیں | صحیح admin کا backup لیں |
| Network خرابی | انٹرنیٹ چیک کریں |
| سرور بند | Backend start کریں |

---

### 📞 کمانڈز | COMMANDS

```bash
# Backend شروع کریں
cd backend
npm start

# Frontend شروع کریں
cd que-management
npm run dev
```

---

### 🌐 رسائی | URLS

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Super Admin: `/super-admin-secure-login`

---

### 📊 API Endpoints

```
POST   /api/backup/create/:adminId
POST   /api/backup/restore
GET    /api/backup/history/:adminId
```

---

### ✅ کامیابی کے نشان | SUCCESS INDICATORS

**بیک اپ:**
```
✅ "Backup created and downloaded successfully!"
✅ JSON فائل موجود ہے
✅ History میں ریکارڈ
```

**بحالی:**
```
✅ "Backup restored successfully!"
✅ ڈیٹا نظر آ رہا ہے
✅ Activity Logs میں ریکارڈ
```

---

### 🔐 سیکیورٹی | SECURITY

- 🔒 JWT Token ضروری
- 🔒 Super Admin صرف
- 🔒 Admin ID verification
- 🔒 File type validation
- 🔒 Transaction safety

---

### 💾 فائل کی مثال | FILE EXAMPLE

```json
{
  "admin_id": 1,
  "backup_date": "2025-12-26",
  "admin_info": { "username": "admin1" },
  "data": {
    "services": [...],
    "tickets": [...]
  }
}
```

---

### 🎯 یاد رکھیں | REMEMBER

1. 📆 باقاعدہ backup لیں
2. 💾 محفوظ جگہ save کریں
3. 🧪 پہلے test کریں
4. ✅ Admin ID چیک کریں
5. 📝 تاریخ نوٹ کریں

---

### 📚 مزید معلومات | MORE INFO

- `BACKUP_RESTORE_GUIDE.md` - مکمل انگلش گائیڈ
- `BACKUP_RESTORE_URDU_GUIDE.md` - مکمل اردو گائیڈ
- `BACKUP_RESTORE_FINAL_SUMMARY.md` - تکنیکی تفصیلات

---

## 🎉 تیار! READY TO USE!

**اب استعمال کریں اور ڈیٹا محفوظ رکھیں!**

---

*بنایا گیا ❤️ کے ساتھ*  
*Queue Management System*
