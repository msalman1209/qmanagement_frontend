# چیٹر باکس انٹیگریشن - فوری شروعات گائیڈ

## تیز رفتار سیٹ اپ (10 منٹ میں)

### 1️⃣ Python Service شروع کریں

```powershell
# Python service folder میں جائیں
cd python-tts-service

# Virtual environment بنائیں اور activate کریں
python -m venv venv
.\venv\Scripts\Activate.ps1

# Dependencies install کریں
pip install -r requirements.txt

# PyTorch install کریں (CPU version)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Service شروع کریں
python app.py
```

پہلی بار چلانے پر models download ہوں گی (~3GB). یہ کچھ وقت لے سکتا ہے.

### 2️⃣ Backend Server شروع کریں

نیا terminal کھولیں:

```powershell
cd backend
npm start
```

### 3️⃣ Frontend شروع کریں

نیا terminal کھولیں:

```powershell
npm run dev
```

### 4️⃣ Configuration Page کھولیں

Browser میں جائیں: `http://localhost:3000/admin/configuration`

### 5️⃣ ChatterBox فعال کریں

- "🎙️ Use ChatterBox Voice Cloning" چیک باکس کو check کریں
- Status **● Online** (سبز) ہونا چاہیے
- Test text لکھیں مثلاً: "ٹکٹ نمبر 101 براہ کرم کاؤنٹر 5 پر تشریف لائیں"
- "🔊 Test Voice" دبائیں
- "💾 Save Settings" سے محفوظ کریں

---

## Voice Cloning کیسے کریں

### اپنی آواز clone کرنے کے لیے:

1. **آڈیو فائل تیار کریں:**
   - 10-30 سیکنڈ کی صاف آواز کی recording
   - WAV یا MP3 format
   - کم سے کم background noise

2. **Upload کریں:**
   - Configuration page پر "Upload Voice Sample" استعمال کریں
   - فائل منتخب کریں اور upload کا انتظار کریں

3. **استعمال کریں:**
   - Dropdown سے اپنی uploaded voice منتخب کریں
   - Test کریں اور Save کریں

---

## عام مسائل اور حل

### ❌ ChatterBox service offline دکھا رہی ہے
**حل:** Python service چل رہی ہے؟ Terminal چیک کریں جہاں `python app.py` چل رہا ہے

### ❌ "Out of memory" error
**حل:** دوسری applications بند کریں، یا CPU-only mode استعمال کریں

### ❌ آواز خراب quality کی ہے
**حل:** بہتر quality کی voice sample upload کریں (16kHz یا زیادہ)

### ❌ بہت slow ہے
**حل:** GPU استعمال کریں (اگر available ہے) یا model cache کریں

---

## اہم نوٹس

✅ **Free:** یہ مکمل طور پر free ہے، کوئی API costs نہیں

✅ **Privacy:** تمام processing locally ہوتی ہے

✅ **Offline:** Internet صرف models download کے لیے درکار ہے

⚠️ **Storage:** ~5GB storage درکار ہے models کے لیے

⚠️ **RAM:** کم از کم 4GB RAM (8GB بہتر)

---

## اگلے قدم

مکمل documentation کے لیے دیکھیں:
- `CHATTERBOX_INTEGRATION_GUIDE.md` - تفصیلی گائیڈ
- `python-tts-service/README_URDU.md` - Python service details

---

**سوالات؟** Documentation چیک کریں یا logs دیکھیں (F12 browser console)
