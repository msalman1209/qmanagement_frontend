# Dubai Arabic اور Multi-Language Setup Guide (اردو میں)

## 🎯 خلاصہ (Summary)

اب آپ اپنے queue management system میں **2 زبانیں** select کر سکتے ہیں ticket announcements کے لیے۔

## ✨ نئی Features

### 1. **دو زبانیں منتخب کریں**
   - آپ maximum **2 زبانیں** select کر سکتے ہیں
   - Radio buttons/checkboxes سے آسانی سے select کریں
   - تیسری زبان select کرنے پر پہلی automatically replace ہو جائے گی

### 2. **Dubai Arabic شامل**
   - **Dubai Arabic (دبئی عربی)** 🇦🇪 اب available ہے
   - صحیح عربی numbers اور text formatting
   - دائیں سے بائیں (RTL) text display

### 3. **دو Preview Boxes**
   - دو boxes side by side دکھائی دیتے ہیں
   - Auto-translation ہر زبان کے لیے
   - Text اور voice settings دونوں دکھتے ہیں

## 🌍 Available زبانیں

| زبان | Code | Flag |
|------|------|------|
| انگریزی (English) | `en` | 🇬🇧 |
| **دبئی عربی (Dubai Arabic)** | `ar-ae` | 🇦🇪 |
| عربی (Arabic) | `ar` | 🇸🇦 |
| اردو (Urdu) | `ur` | 🇵🇰 |
| ہندی (Hindi) | `hi` | 🇮🇳 |
| ہسپانوی (Spanish) | `es` | 🇪🇸 |

## 📝 Dubai Arabic کی مثال

### انگریزی میں:
```
Ticket number P-101
Please go to counter number 5
```

### Dubai Arabic میں:
```
تذكرة رقم: مية وواحد
الرجاء الذهاب لكونتر رقم خمسة
```

## 🚀 Setup کیسے کریں

### Step 1: Database Update کریں

Backend folder میں جا کر یہ command چلائیں:

```bash
cd backend
node database/add-languages-column.js
```

### Step 2: Configuration Page کھولیں

1. Admin panel میں login کریں
2. **Configuration** page پر جائیں
3. **Preferred Languages** section تک scroll کریں

### Step 3: زبانیں Select کریں

1. **2 زبانیں** checkbox پر click کر کے select کریں:
   - 🇬🇧 English
   - 🇦🇪 **Dubai Arabic** (نیا!)
   - 🇸🇦 Arabic
   - 🇵🇰 Urdu
   - 🇮🇳 Hindi
   - 🇪🇸 Spanish

2. **قواعد:**
   - صرف 2 زبانیں select ہو سکتی ہیں
   - Deselect کرنے کے لیے دوبارہ click کریں
   - تیسری select کرنے پر پہلی replace ہو جائے گی

### Step 4: Preview دیکھیں

زبانیں select کرنے کے بعد **2 preview boxes** نظر آئیں گے:

```
┌─────────────────────┐  ┌─────────────────────┐
│   Box 1: English    │  │  Box 2: Dubai Arabic│
│                     │  │                     │
│  Ticket number      │  │    تذكرة رقم        │
│  P-101              │  │   مية وواحد         │
│  Please go to       │  │   الرجاء الذهاب     │
│  counter 5          │  │  لكونتر رقم خمسة    │
└─────────────────────┘  └─────────────────────┘
```

- **Box 1**: پہلی selected language کا translation
- **Box 2**: دوسری selected language کا translation
- Automatic translation ہر box میں
- Voice settings بھی show ہوتی ہیں

### Step 5: Voice Settings Set کریں

1. **Voice Type**: AI voice چنیں (Male/Female/Child/Default)
2. **Speech Rate**: Speed adjust کریں (0.5x - 2.0x)
3. **Speech Pitch**: Pitch adjust کریں (0.5 - 2.0)

### Step 6: Voice Test کریں

**"🔊 Test AI Voice"** button پر click کریں:
- تمام selected languages test ہوں گی
- ایک کے بعد ایک announcements سنائی دیں گی
- Pronunciation اور timing check کر سکتے ہیں

### Step 7: Settings Save کریں

**"💾 Save Settings"** button پر click کریں:
- Database میں save ہو جائے گا
- تمام future announcements پر apply ہو گا
- Browser localStorage میں backup بھی ہو گا

## 🎤 Announcements کیسے کام کرتی ہیں

جب ticket call ہوتا ہے:

1. System database سے selected زبانیں read کرتا ہے
2. ہر زبان کے لیے:
   - Ticket text translate ہوتا ہے
   - صحیح formatting apply ہوتی ہے (Arabic کے لیے RTL)
   - AI voice سے speech بنتی ہے
   - Announcement play ہوتی ہے
3. دونوں زبانوں میں 500ms pause کے ساتھ announce ہوتا ہے

### مثال:
```
1. English میں: "Ticket number P-101, please go to counter 5"
   [500ms توقف]
2. Dubai Arabic میں: "تذكرة رقم مية وواحد، الرجاء الذهاب لكونتر رقم خمسة"
```

## 🔧 مسائل اور حل (Troubleshooting)

### مسئلہ: زبانیں save نہیں ہو رہیں
**حل:**
1. Database migration چلائیں: `node database/add-languages-column.js`
2. Backend logs check کریں
3. Database connection verify کریں

### مسئلہ: Dubai Arabic صحیح display نہیں ہو رہی
**حل:**
1. Browser میں Arabic fonts support ہونے چاہیے
2. RTL direction check کریں
3. UTF-8 encoding verify کریں

### مسئلہ: Voice test کام نہیں کر رہا
**حل:**
1. Python TTS service شروع کریں:
   ```bash
   cd python-tts-service
   python app.py
   ```
2. Service status check کریں (Online ہونا چاہیے)
3. Network connection verify کریں

### مسئلہ: صرف ایک زبان میں play ہو رہی ہے
**حل:**
1. Browser console میں selectedLanguages array check کریں
2. Database میں دونوں زبانیں saved ہیں verify کریں
3. Backend logs دیکھیں

## 💡 بہترین استعمال (Best Practices)

1. **ہمیشہ English** کو ایک زبان کے طور پر رکھیں international users کے لیے
2. Live جانے سے پہلے **announcements test** کریں
3. **Speech rate 0.8-1.2 کے بیچ** رکھیں clarity کے لیے
4. **Default یا male/female voices** استعمال کریں بہترین نتائج کے لیے

## 🎯 استعمال کی مثالیں

### Dubai Airport Queue System
```
زبانیں: English + Dubai Arabic
استعمال: بین الاقوامی مسافر + مقامی آبادی
```

### پاکستان Government Office
```
زبانیں: English + Urdu
استعمال: شہریوں کے لیے دو لسانی اعلان
```

### سعودی عرب Hospital
```
زبانیں: Arabic + English
استعمال: مقامی مریض + غیر ملکی ڈاکٹر
```

## 📋 فوری حوالہ (Quick Reference)

| کام | کیسے کریں |
|-----|-----------|
| زبان شامل کریں | Checkbox پر click کریں |
| زبان ہٹائیں | Selected checkbox پر دوبارہ click کریں |
| Preview دیکھیں | زبانیں select کرنے کے بعد automatically show ہوں گے |
| Voice test | "🔊 Test AI Voice" button |
| Settings save | "💾 Save Settings" button |

## 🎨 خصوصیات (Features)

✅ 2 زبانیں بیک وقت  
✅ Dubai Arabic support  
✅ Auto-translation  
✅ Dual preview boxes  
✅ RTL text support  
✅ AI voice synthesis  
✅ Database storage  
✅ Browser backup  

## ⚠️ اہم نوٹ

- Python TTS service (ChatterBox) **ضرور چل رہی ہونی چاہیے** AI voices کے لیے
- Maximum **2 زبانیں** ایک وقت میں
- Database میں save ہونے کے لیے migration ضرور چلائیں

## 📞 مدد کے لیے

اگر کوئی مسئلہ ہو:
1. Browser console errors check کریں
2. Backend logs دیکھیں: `cd backend && npm run dev`
3. Python service running ہے verify کریں
4. Database connection check کریں

---

**ورژن:** 1.0.0  
**آخری اپ ڈیٹ:** دسمبر 2025  
**بنانے والے:** Tech Solutionor  

**نوٹ:** یہ feature AI voice generation کے لیے Python TTS service (ChatterBox) کی ضرورت ہے۔
