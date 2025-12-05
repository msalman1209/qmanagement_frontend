# ChatterBox Voice Cloning Integration Guide
# چیٹر باکس وائس کلوننگ انٹیگریشن گائیڈ

## Overview / جائزہ

This guide explains how to integrate ChatterBox voice cloning model into your Queue Management System.

یہ گائیڈ بتاتی ہے کہ آپ اپنے Queue Management System میں ChatterBox voice cloning model کو کیسے integrate کر سکتے ہیں۔

---

## Architecture / فن تعمیر

```
┌─────────────────────┐
│  Next.js Frontend   │
│  (Configuration)    │
└──────────┬──────────┘
           │ HTTP Requests
           ↓
┌─────────────────────┐
│  Node.js Backend    │
│  (Express API)      │
│  Port: 5000         │
└──────────┬──────────┘
           │ HTTP Proxy
           ↓
┌─────────────────────┐
│ Python TTS Service  │
│  (Flask + PyTorch)  │
│  Port: 5001         │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Hugging Face       │
│  ChatterBox Models  │
└─────────────────────┘
```

---

## Installation Steps / تنصیب کے مراحل

### Step 1: Install Python Dependencies
### مرحلہ 1: Python Dependencies انسٹال کریں

```powershell
# Navigate to Python service directory
cd python-tts-service

# Create virtual environment
python -m venv venv

# Activate virtual environment (PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# For CPU-only (recommended for testing):
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# For GPU support (if you have NVIDIA GPU):
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Urdu:**
```powershell
# Python service directory میں جائیں
cd python-tts-service

# Virtual environment بنائیں
python -m venv venv

# Virtual environment کو activate کریں
.\venv\Scripts\Activate.ps1

# Dependencies install کریں
pip install -r requirements.txt

# CPU-only کے لیے:
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# GPU support کے لیے (اگر NVIDIA GPU ہے):
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

### Step 2: Install Node.js Dependencies
### مرحلہ 2: Node.js Dependencies انسٹال کریں

```powershell
# In backend directory
cd backend
npm install axios

# In root directory (for frontend)
cd ..
npm install axios
```

---

### Step 3: Start Services
### مرحلہ 3: Services شروع کریں

**Terminal 1 - Python TTS Service:**
```powershell
cd python-tts-service
.\venv\Scripts\Activate.ps1
python app.py
```

**Terminal 2 - Node.js Backend:**
```powershell
cd backend
npm start
```

**Terminal 3 - Next.js Frontend:**
```powershell
npm run dev
```

---

## Usage / استعمال

### 1. Configuration Page / تشکیل کا صفحہ

Navigate to: `http://localhost:3000/[role]/configuration`

یہاں جائیں: `http://localhost:3000/[role]/configuration`

### 2. Enable ChatterBox
### ChatterBox کو فعال کریں

- Check the box: **"🎙️ Use ChatterBox Voice Cloning (AI-Powered)"**
- Status indicator should show: **● Online** (green)

اردو:
- چیک باکس کو چیک کریں: **"🎙️ Use ChatterBox Voice Cloning (AI-Powered)"**
- سٹیٹس انڈیکیٹر **● Online** (سبز) دکھانا چاہیے

### 3. Upload Voice Sample (Optional)
### آواز کا نمونہ اپ لوڈ کریں (اختیاری)

To clone a specific voice:
کسی خاص آواز کو clone کرنے کے لیے:

1. Click "Choose File" under "Upload Voice Sample for Cloning"
2. Select an audio file (WAV, MP3, OGG, or M4A - max 10MB)
3. Wait for upload confirmation
4. Select the uploaded voice from the dropdown

اردو میں:
1. "Upload Voice Sample for Cloning" کے نیچے "Choose File" پر کلک کریں
2. آڈیو فائل منتخب کریں (WAV, MP3, OGG, یا M4A - زیادہ سے زیادہ 10MB)
3. اپ لوڈ کی تصدیق کا انتظار کریں
4. ڈراپ ڈاؤن سے اپ لوڈ کی گئی آواز منتخب کریں

### 4. Configure Settings
### سیٹنگز ترتیب دیں

- **Preferred Language:** Select Urdu, English, Arabic, or Spanish
- **Speech Rate:** Adjust speed (0.5x - 2.0x)
- **Speech Pitch:** Adjust pitch (0.5 - 2.0)
- **Test Text:** Enter text to test

اردو:
- **پسندیدہ زبان:** اردو، انگریزی، عربی، یا ہسپانوی منتخب کریں
- **تقریر کی رفتار:** رفتار ایڈجسٹ کریں (0.5x - 2.0x)
- **تقریر کی پچ:** پچ ایڈجسٹ کریں (0.5 - 2.0)
- **ٹیسٹ ٹیکسٹ:** جانچ کے لیے متن درج کریں

### 5. Test and Save
### ٹیسٹ اور محفوظ کریں

1. Click **"🔊 Test Voice"** to hear the generated speech
2. Click **"💾 Save Settings"** to save your configuration

اردو:
1. پیدا شدہ تقریر سننے کے لیے **"🔊 Test Voice"** پر کلک کریں
2. اپنی تشکیل محفوظ کرنے کے لیے **"💾 Save Settings"** پر کلک کریں

---

## API Endpoints

### Backend (Node.js) - Port 5000

```
POST   /api/voices/synthesize     - Generate speech
POST   /api/voices/upload         - Upload voice sample
GET    /api/voices/list           - List available voices
GET    /api/voices/health         - Check service status
DELETE /api/voices/:voiceId       - Delete voice sample
```

### Python Service - Port 5001

```
GET    /health                    - Health check
POST   /api/tts/synthesize        - Synthesize speech
POST   /api/tts/upload-voice      - Upload voice sample
GET    /api/tts/voices            - List voices
GET    /api/tts/audio/:filename   - Serve audio file
```

---

## Example Code Usage / کوڈ استعمال کی مثال

### Frontend - Synthesize Speech

```javascript
import axios from 'axios';

const synthesizeSpeech = async (text, language = 'en') => {
  try {
    const response = await axios.post('http://localhost:5000/api/voices/synthesize', {
      text: text,
      language: language,
      speed: 1.0,
      pitch: 1.0,
      voiceId: 'optional-voice-id'
    });
    
    if (response.data.success) {
      const audioUrl = 'http://localhost:5001' + response.data.data.audio_url;
      const audio = new Audio(audioUrl);
      audio.play();
    }
  } catch (error) {
    console.error('Speech synthesis failed:', error);
  }
};

// Usage
synthesizeSpeech('Ticket number 101 please come to counter 5', 'en');
synthesizeSpeech('ٹکٹ نمبر 101 براہ کرم کاؤنٹر 5 پر تشریف لائیں', 'ur');
```

---

## Troubleshooting / مسائل حل کرنا

### Problem: ChatterBox service shows offline
**Solution:**
```powershell
cd python-tts-service
.\venv\Scripts\Activate.ps1
python app.py
```

### Problem: Out of memory error
**Solution:**
- Use CPU-only mode
- Close other applications
- Reduce batch size in Python service

### Problem: Slow inference
**Solution:**
- Use GPU if available
- Reduce audio quality settings
- Use model quantization

### Problem: Voice quality is poor
**Solution:**
- Upload higher quality voice samples (16kHz or higher)
- Use longer voice samples (10-30 seconds)
- Ensure voice sample has minimal background noise

---

## Performance Tips / کارکردگی کی تجاویز

1. **Use GPU:** Much faster than CPU (10-100x speedup)
   GPU استعمال کریں: CPU سے بہت تیز (10-100x speedup)

2. **Cache voices:** Reuse cloned voices instead of uploading repeatedly
   Voices cache کریں: بار بار اپ لوڈ کرنے کی بجائے cloned voices دوبارہ استعمال کریں

3. **Optimize models:** Use quantized models for faster inference
   Models optimize کریں: تیز inference کے لیے quantized models استعمال کریں

4. **Background processing:** Process speech generation in background
   Background processing: پس منظر میں speech generation کو process کریں

---

## Production Deployment / پروڈکشن ڈیپلائمنٹ

### Using Gunicorn (Production WSGI server)

```powershell
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 --timeout 120 app:app
```

### Using Docker

```dockerfile
# Dockerfile for Python TTS Service
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "--timeout", "120", "app:app"]
```

Build and run:
```powershell
docker build -t chatterbox-tts .
docker run -p 5001:5001 chatterbox-tts
```

---

## System Requirements / سسٹم کی ضروریات

**Minimum / کم از کم:**
- Python 3.9+
- 4GB RAM
- 5GB Storage
- CPU with AVX support

**Recommended / تجویز کردہ:**
- Python 3.10+
- 8GB+ RAM
- 10GB Storage
- NVIDIA GPU with 4GB+ VRAM
- CUDA 11.8+

---

## Security Considerations / سیکیورٹی پر غور

1. **Authentication:** Add authentication to voice upload endpoint
   Authentication شامل کریں: voice upload endpoint میں authentication شامل کریں

2. **File validation:** Validate uploaded audio files thoroughly
   فائل کی توثیق: اپ لوڈ کی گئی آڈیو فائلوں کی اچھی طرح توثیق کریں

3. **Rate limiting:** Add rate limiting to prevent abuse
   Rate limiting شامل کریں: غلط استعمال روکنے کے لیے rate limiting شامل کریں

4. **HTTPS:** Use HTTPS in production
   HTTPS استعمال کریں: پروڈکشن میں HTTPS استعمال کریں

---

## Support / معاونت

For issues or questions:
- Check logs: `python-tts-service/` directory
- Backend logs: `backend/` directory
- Browser console: Press F12 in browser

مسائل یا سوالات کے لیے:
- لاگز چیک کریں: `python-tts-service/` ڈائرکٹری
- Backend logs: `backend/` ڈائرکٹری
- Browser console: براؤزر میں F12 دبائیں

---

## License / لائسنس

ChatterBox model is from Hugging Face: https://huggingface.co/ramimu/chatterbox-voice-cloning-model

License: MIT

---

**Happy Voice Cloning! 🎙️✨**
**خوش رہیں Voice Cloning کے ساتھ! 🎙️✨**
