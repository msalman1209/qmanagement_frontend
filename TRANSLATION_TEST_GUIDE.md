# 🧪 Translation Testing Guide

## Quick Test Steps

### 1️⃣ **Backend Server Check**
Make sure backend is running on port 5000:
```
✅ Backend: http://localhost:5000
```

### 2️⃣ **Python TTS Service Check**
Make sure Python service is running on port 5001:
```
✅ Python TTS: http://localhost:5001
```

### 3️⃣ **Test in Configuration Page**

**URL:** `http://localhost:3000/admin/configuration`

**Steps:**
1. Select **Preferred Language**: `ur` (Urdu)
2. Select **Voice Type**: `male` (or any)
3. Set **Speech Rate**: `0.9`
4. Set **Speech Pitch**: `1.0`
5. Enter **Test Text**: `Ticket number 101 please come to counter 5`
6. Click **"Test AI Voice"** button

**Expected Result:**
- Console shows: `🌐 Auto-translating text to ur...`
- Translation: `ٹکٹ نمبر 101 براہ کرم کاؤنٹر 5 پر آئیں`
- Voice speaks in Urdu! ✅

### 4️⃣ **Save Settings to Database**
1. Click **"Save Settings"** button
2. Alert shows: `"✅ Settings saved successfully to database!"`
3. Settings are now stored permanently

### 5️⃣ **Test Live Ticket Announcement**

**URL:** `http://localhost:3000/ticket_info`

**Steps:**
1. Open ticket_info page
2. Call a ticket from dashboard
3. Watch the console logs

**Expected Console Logs:**
```javascript
🎙️ Announcing with ChatterBox AI:
  📝 Original text: Ticket number 101 please come to counter 5
  🌐 Target language: ur
  🎤 Voice type: male
  ⚡ Settings: {...}
📡 Synthesis request sent: {text: '...', language: 'ur', voiceType: 'male'}
✅ ChatterBox AI audio generated: http://localhost:5001/api/tts/audio/...
▶️ AI voice announcement started
✅ AI voice announcement completed
```

**Expected Python Service Logs:**
```
=== SYNTHESIS REQUEST ===
🌐 Auto-translating text to ur...
Original text: 'Ticket number 101 please come to counter 5'
✅ Translated text: 'ٹکٹ نمبر 101 براہ کرم کاؤنٹر 5 پر آئیں'
Using gTTS with language code: ur (from input: ur)
Speech generated successfully
========================
```

## 🌐 Test Different Languages

### Urdu Test:
```
Input: "Ticket number 101 please come to counter 5"
Language: ur
Output: "ٹکٹ نمبر 101 براہ کرم کاؤنٹر 5 پر آئیں"
```

### Arabic Test:
```
Input: "Ticket number 101 please come to counter 5"
Language: ar
Output: "تذكرة رقم 101 يرجى القدوم إلى العداد 5"
```

### Hindi Test:
```
Input: "Ticket number 101 please come to counter 5"
Language: hi
Output: "टिकट नंबर 101 कृपया काउंटर 5 पर आएं"
```

### Spanish Test:
```
Input: "Ticket number 101 please come to counter 5"
Language: es
Output: "Ticket número 101 por favor venga al mostrador 5"
```

## ❌ Common Issues & Fixes

### Issue 1: "Translation failed"
**Cause:** Internet connection required for Google Translate
**Fix:** Check internet connection, translation will fallback to English

### Issue 2: "ChatterBox AI service offline"
**Cause:** Python service not running
**Fix:** 
```powershell
cd python-tts-service
python app.py
```

### Issue 3: "No voice playing"
**Cause:** Browser autoplay policy
**Fix:** Click on the alert dialog to allow audio playback

### Issue 4: "Settings not saving"
**Cause:** Database table not created
**Fix:**
```powershell
cd backend
node database/migrate-voice-settings.js
```

### Issue 5: "Audio file not found"
**Cause:** File path issue
**Fix:** Check Python service logs, ensure OUTPUT_DIR exists

## 🔍 Debug Checklist

### Frontend (Browser Console):
- ✅ Settings loaded from database
- ✅ Language code correct (ur, ar, hi, etc.)
- ✅ Voice type selected
- ✅ Synthesis request sent
- ✅ Audio URL received
- ✅ Audio playing

### Backend (Node Terminal):
- ✅ Server running on port 5000
- ✅ Voice settings API endpoints loaded
- ✅ Request received from frontend
- ✅ Forwarding to Python service

### Python Service (Python Terminal):
- ✅ Service running on port 5001
- ✅ Translation request received
- ✅ Text translated successfully
- ✅ gTTS synthesis successful
- ✅ Audio file created
- ✅ Audio file served

## 📊 Testing Matrix

| Language | Code | Test Status | Notes |
|----------|------|-------------|-------|
| English  | en   | ✅ Working  | No translation needed |
| Urdu     | ur   | ✅ Working  | Auto-translated |
| Arabic   | ar   | ✅ Working  | Auto-translated |
| Hindi    | hi   | ✅ Working  | Auto-translated |
| Spanish  | es   | ✅ Working  | Auto-translated |
| French   | fr   | ✅ Working  | Auto-translated |
| German   | de   | ✅ Working  | Auto-translated |
| Chinese  | zh   | ✅ Working  | Auto-translated |
| Japanese | ja   | ✅ Working  | Auto-translated |

## 🎯 Success Criteria

✅ **Configuration Page:**
- Language selector working
- Test voice button working
- Translation happening automatically
- Voice playing in selected language
- Settings saving to database

✅ **Ticket Info Page:**
- Loading settings from database
- Auto-announcing new tickets
- Translation working automatically
- Voice playing in configured language
- No errors in console

✅ **Database:**
- voice_settings table exists
- Settings being saved
- Settings being loaded
- admin_id tracking working

## 🚀 Quick Start Command

Open 3 terminals and run:

**Terminal 1 - Backend:**
```powershell
cd backend
node server.js
```

**Terminal 2 - Python Service:**
```powershell
cd python-tts-service
python app.py
```

**Terminal 3 - Frontend:**
```powershell
npm run dev
```

Then test at:
- Configuration: `http://localhost:3000/admin/configuration`
- Ticket Info: `http://localhost:3000/ticket_info`

## 📝 Notes

- Translation requires internet connection
- First translation might be slower
- Subsequent translations are faster
- English voice types (male/female/child) work with pyttsx3
- Other languages use gTTS (no voice type distinction)
- All settings persist in database
- localStorage used as fallback
