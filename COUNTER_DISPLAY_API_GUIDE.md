# Counter Display API Guide

## Overview
Complete API system for managing counter display configuration including logos, videos, images, slider settings, and ticker content.

## Database Tables Created

### 1. `counter_display_config` Table
Stores main display configuration:
- `id` - Primary key (always 1 for single config)
- `left_logo_url` - Path to left logo image
- `right_logo_url` - Path to right logo image
- `screen_type` - 'horizontal' or 'vertical'
- `content_type` - 'video' or 'images'
- `video_url` - Path to uploaded video
- `slider_timer` - Timer in seconds (1-60)
- `ticker_content` - Bottom ticker text
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updates)

### 2. `slider_images` Table
Stores uploaded slider images:
- `id` - Primary key (auto-increment)
- `image_url` - Path to image file
- `image_name` - Original filename
- `display_order` - Display sequence
- `is_selected` - 1 if selected for display, 0 otherwise
- `created_at` - Timestamp

## API Endpoints

### Base URL
```
http://localhost:5000/api/counter-display
```

### 1. Get Current Configuration
**GET** `/config`

**Response:**
```json
{
  "success": true,
  "config": {
    "id": 1,
    "left_logo_url": "/uploads/left-logo.png",
    "right_logo_url": "/uploads/right-logo.png",
    "screen_type": "horizontal",
    "content_type": "video",
    "video_url": "/uploads/video.mp4",
    "slider_timer": 5,
    "ticker_content": "Welcome message"
  },
  "images": [
    {
      "id": 1,
      "image_url": "/uploads/image1.jpg",
      "image_name": "image1.jpg",
      "display_order": 0,
      "is_selected": 1
    }
  ]
}
```

### 2. Update Configuration
**POST** `/config`

**Request Body:**
```json
{
  "leftLogoUrl": "/uploads/left-logo.png",
  "rightLogoUrl": "/uploads/right-logo.png",
  "screenType": "horizontal",
  "contentType": "video",
  "videoUrl": "/uploads/video.mp4",
  "sliderTimer": 5,
  "tickerContent": "Welcome to our service",
  "selectedImageIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Counter display configuration updated successfully"
}
```

### 3. Upload Logo (Left or Right)
**POST** `/upload-logo`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `logo` - Image file
- `logoType` - 'left' or 'right'

**Response:**
```json
{
  "success": true,
  "message": "left logo uploaded successfully",
  "logoUrl": "/uploads/1234567890-logo.png"
}
```

### 4. Upload Video
**POST** `/upload-video`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `video` - Video file

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "videoUrl": "/uploads/1234567890-video.mp4"
}
```

### 5. Upload Slider Images
**POST** `/upload-images`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `images` - Multiple image files (max 20)

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "images": [
    {
      "id": 5,
      "imageUrl": "/uploads/1234567890-image1.jpg",
      "imageName": "image1.jpg"
    },
    {
      "id": 6,
      "imageUrl": "/uploads/1234567891-image2.jpg",
      "imageName": "image2.jpg"
    }
  ]
}
```

### 6. Delete Slider Image
**DELETE** `/image/:id`

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Frontend Integration

### Features Implemented:
✅ Auto-load existing configuration on page mount
✅ Real-time file upload for logos
✅ Real-time file upload for video
✅ Real-time file upload for images
✅ Image selection system with visual feedback
✅ Success/error message display
✅ Loading state during updates
✅ Radio button content type selection
✅ Dropdown timer selection (1-60 seconds)
✅ Professional SVG icons

### State Management:
- `leftLogoUrl` - Server path to left logo
- `rightLogoUrl` - Server path to right logo
- `videoUrl` - Server path to video
- `sliderImages` - Array of uploaded images
- `selectedImages` - Array of selected image IDs
- `contentType` - 'video' or 'images'
- `sliderTimer` - Seconds (1-60)
- `tickerContent` - Ticker text

### Upload Flow:
1. User selects file → Auto-uploads to server
2. Server saves file → Returns URL
3. Frontend updates state with URL
4. User clicks "Update Content" → Saves all configuration

## File Upload Limits:
- Maximum file size: 100MB
- Maximum slider images: 20 per upload
- Accepted formats: Images (jpg, png, gif, etc.) and Videos (mp4, webm, etc.)

## Setup Instructions:

### 1. Run Database Migration:
```bash
cd backend
node database/create-counter-display-table.js
```

### 2. Ensure Uploads Directory Exists:
```bash
mkdir backend/uploads
```

### 3. Start Backend Server:
```bash
cd backend
npm start
```

### 4. Start Frontend:
```bash
cd que-management
npm run dev
```

### 5. Access Page:
```
http://localhost:3000/[role]/counter-display
```

## Error Handling:
- File upload errors display in red message bar
- Success messages display in green message bar
- Messages auto-dismiss after 5 seconds
- Loading spinner shows during updates

## Notes:
- All uploads are stored in `backend/uploads/` directory
- Files are renamed with timestamp + random number to prevent conflicts
- Selected images are marked in database with `is_selected = 1`
- Only one configuration record exists (id = 1)
- Configuration auto-loads when page opens

## Next Steps:
1. ✅ Database tables created
2. ✅ API endpoints implemented
3. ✅ Frontend integration complete
4. ⏳ Create public display page to show configured content
5. ⏳ Add authentication middleware to protect routes
6. ⏳ Implement real-time updates using WebSocket/SSE
